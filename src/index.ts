#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * コーディング規約を表すインターフェース
 */
interface CodingRule {
  name: string;
  content: string;
  lastModified: Date;
}

/**
 * セッション管理用のトランスポートマップ
 */
const transports: Map<string, StreamableHTTPServerTransport> = new Map();

/**
 * RuleMCPサーバークラス
 * コーディング規約の管理機能を提供するMCPサーバー
 */
class RuleMCPServer {
  private _mcpServer: McpServer;
  private _rulesDir: string;
  private _app: express.Application;
  private _port: number;

  /**
   * コンストラクタ
   */
  public constructor() {
    this._mcpServer = new McpServer({
      name: 'rulemcp',
      version: '1.0.0',
      instructions: 'コーディング規約を管理するためのMCPサーバーです。規約の保存、取得、一覧表示、削除が可能です。',
    });

    this._rulesDir = path.join(process.cwd(), 'rules');
    this._port = parseInt(process.env.PORT || '3000', 10);
    this._app = express();

    this._ensureRulesDirectory();
    this._setupExpressApp();
    this._setupMcpTools();
  }

  /**
   * ルールディレクトリの存在を確認し、必要に応じて作成
   */
  private _ensureRulesDirectory(): void {
    if (!fs.existsSync(this._rulesDir)) {
      fs.mkdirSync(this._rulesDir, { recursive: true });
    }
  }

  /**
   * Express アプリケーションの設定
   */
  private _setupExpressApp(): void {
    // CORS設定
    this._app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
      exposedHeaders: ['Mcp-Session-Id'],
    }));

    // JSON パーサー設定
    this._app.use(express.json({ limit: '10mb' }));

    // ヘルスチェックエンドポイント
    this._app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // MCP エンドポイント
    this._app.post('/mcp', this._handleMcpRequest.bind(this));
    this._app.get('/mcp', this._handleMcpSseRequest.bind(this));
    this._app.delete('/mcp', this._handleMcpDeleteRequest.bind(this));
  }

  /**
   * MCP ツールの設定
   */
  private _setupMcpTools(): void {
    // save_rule ツール
    this._mcpServer.tool(
      'save_rule',
      {
        rule_name: z.string().describe('ルール名（例: python, marp, typescript）'),
        content: z.string().describe('コーディング規約の内容'),
      },
      {
        description: 'コーディング規約を保存または更新します',
      },
      async (params) => {
        return await this._saveRule(params);
      }
    );

    // get_rule ツール
    this._mcpServer.tool(
      'get_rule',
      {
        rule_name: z.string().describe('取得するルール名'),
      },
      {
        description: '指定されたコーディング規約を取得します',
      },
      async (params) => {
        return await this._getRule(params);
      }
    );

    // list_rules ツール
    this._mcpServer.tool(
      'list_rules',
      {},
      {
        description: '利用可能なコーディング規約の一覧を取得します',
      },
      async () => {
        return await this._listRules();
      }
    );

    // delete_rule ツール
    this._mcpServer.tool(
      'delete_rule',
      {
        rule_name: z.string().describe('削除するルール名'),
      },
      {
        description: '指定されたコーディング規約を削除します',
      },
      async (params) => {
        return await this._deleteRule(params);
      }
    );
  }

  /**
   * MCP リクエストハンドラー
   */
  private async _handleMcpRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      const sessionId = req.headers['mcp-session-id'] as string;
      const isInitialize = req.body?.method === 'initialize';

      let transport: StreamableHTTPServerTransport;
      let currentSessionId: string;

      if (isInitialize) {
        // 新しいセッションを作成
        currentSessionId = uuidv4();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => currentSessionId,
          onsessioninitialized: (id) => {
            console.log(`Session initialized: ${id}`);
          },
        });

        // セッションIDを設定
        transport.sessionId = currentSessionId;
        transports.set(currentSessionId, transport);

        // クリーンアップハンドラー設定
        transport.onclose = () => {
          transports.delete(currentSessionId);
          console.log(`Session closed: ${currentSessionId}`);
        };

        // MCPサーバーに接続
        await this._mcpServer.connect(transport);

        // レスポンスヘッダーにセッションIDを設定
        res.setHeader('Mcp-Session-Id', currentSessionId);
      } else {
        // 既存のセッションを使用
        if (!sessionId || !transports.has(sessionId)) {
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Invalid or missing session ID',
            },
            id: req.body?.id || null,
          });
          return;
        }

        transport = transports.get(sessionId)!;
        currentSessionId = sessionId;
        res.setHeader('Mcp-Session-Id', currentSessionId);
      }

      // リクエストを処理
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: req.body?.id || null,
        });
      }
    }
  }

  /**
   * MCP SSE リクエストハンドラー
   */
  private async _handleMcpSseRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        error: 'Invalid or missing session ID',
      });
      return;
    }

    // SSE ヘッダー設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Keep-alive
    const keepAlive = setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  }

  /**
   * MCP DELETE リクエストハンドラー（セッション終了）
   */
  private async _handleMcpDeleteRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;

    if (!sessionId || !transports.has(sessionId)) {
      res.status(404).json({
        error: 'Session not found',
      });
      return;
    }

    const transport = transports.get(sessionId)!;
    transport.close();
    transports.delete(sessionId);

    res.status(204).end();
  }

  /**
   * ルール保存の実装
   */
  private async _saveRule(params: { rule_name: string; content: string }) {
    const { rule_name, content } = params;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this._rulesDir, fileName);

    const rule: CodingRule = {
      name: rule_name,
      content: content,
      lastModified: new Date(),
    };

    const ruleData = `# ${rule_name} コーディング規約

最終更新: ${rule.lastModified.toISOString()}

---

${content}
`;

    fs.writeFileSync(filePath, ruleData, 'utf8');

    return {
      content: [
        {
          type: 'text' as const,
          text: `コーディング規約「${rule_name}」を正常に保存しました。\nファイル: ${filePath}`,
        },
      ],
    };
  }

  /**
   * ルール取得の実装
   */
  private async _getRule(params: { rule_name: string }) {
    const { rule_name } = params;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this._rulesDir, fileName);

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `コーディング規約「${rule_name}」が見つかりません。`,
          },
        ],
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');

    return {
      content: [
        {
          type: 'text' as const,
          text: content,
        },
      ],
    };
  }

  /**
   * ルール一覧取得の実装
   */
  private async _listRules() {
    if (!fs.existsSync(this._rulesDir)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '登録されているコーディング規約はありません。',
          },
        ],
      };
    }

    const files = fs.readdirSync(this._rulesDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const ruleName = path.basename(file, '.md');
        const filePath = path.join(this._rulesDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: ruleName,
          lastModified: stats.mtime.toISOString(),
        };
      });

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '登録されているコーディング規約はありません。',
          },
        ],
      };
    }

    const rulesList = files
      .map(rule => `- **${rule.name}** (最終更新: ${rule.lastModified})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `## 登録されているコーディング規約\n\n${rulesList}`,
        },
      ],
    };
  }

  /**
   * ルール削除の実装
   */
  private async _deleteRule(params: { rule_name: string }) {
    const { rule_name } = params;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this._rulesDir, fileName);

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `コーディング規約「${rule_name}」が見つかりません。`,
          },
        ],
      };
    }

    fs.unlinkSync(filePath);

    return {
      content: [
        {
          type: 'text' as const,
          text: `コーディング規約「${rule_name}」を削除しました。`,
        },
      ],
    };
  }

  /**
   * サーバーの起動
   */
  public async run(): Promise<void> {
    this._app.listen(this._port, () => {
      console.log(`RuleMCP Server started on port ${this._port}`);
      console.log(`Health check: http://localhost:${this._port}/health`);
      console.log(`MCP endpoint: http://localhost:${this._port}/mcp`);
    });
  }
}

// サーバーの起動
const server = new RuleMCPServer();
server.run().catch(console.error); 