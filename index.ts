#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface CodingRule {
  name: string;
  content: string;
  lastModified: Date;
}

class RuleMCPServer {
  private server: Server;
  private rulesDir: string;

  constructor() {
    this.server = new Server(
      {
        name: "rulemcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // ルールファイルを保存するディレクトリ
    this.rulesDir = path.join(process.cwd(), "rules");
    this.ensureRulesDirectory();

    this.setupHandlers();
  }

  private ensureRulesDirectory(): void {
    if (!fs.existsSync(this.rulesDir)) {
      fs.mkdirSync(this.rulesDir, { recursive: true });
    }
  }

  private setupHandlers(): void {
    // ツール一覧の返却
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "save_rule",
            description: "コーディング規約を保存または更新します",
            inputSchema: {
              type: "object",
              properties: {
                rule_name: {
                  type: "string",
                  description: "ルール名（例: python, marp, typescript）",
                },
                content: {
                  type: "string",
                  description: "コーディング規約の内容",
                },
              },
              required: ["rule_name", "content"],
            },
          },
          {
            name: "get_rule",
            description: "指定されたコーディング規約を取得します",
            inputSchema: {
              type: "object",
              properties: {
                rule_name: {
                  type: "string",
                  description: "取得するルール名",
                },
              },
              required: ["rule_name"],
            },
          },
          {
            name: "list_rules",
            description: "利用可能なコーディング規約の一覧を取得します",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "delete_rule",
            description: "指定されたコーディング規約を削除します",
            inputSchema: {
              type: "object",
              properties: {
                rule_name: {
                  type: "string",
                  description: "削除するルール名",
                },
              },
              required: ["rule_name"],
            },
          },
        ],
      };
    });

    // ツール実行の処理
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "save_rule":
            return await this.saveRule(args as { rule_name: string; content: string });
          
          case "get_rule":
            return await this.getRule(args as { rule_name: string });
          
          case "list_rules":
            return await this.listRules();
          
          case "delete_rule":
            return await this.deleteRule(args as { rule_name: string });
          
          default:
            throw new Error(`不明なツール: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async saveRule(args: { rule_name: string; content: string }) {
    const { rule_name, content } = args;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this.rulesDir, fileName);

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

    fs.writeFileSync(filePath, ruleData, "utf8");

    return {
      content: [
        {
          type: "text",
          text: `コーディング規約「${rule_name}」を正常に保存しました。\nファイル: ${filePath}`,
        },
      ],
    };
  }

  private async getRule(args: { rule_name: string }) {
    const { rule_name } = args;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this.rulesDir, fileName);

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `コーディング規約「${rule_name}」が見つかりません。`,
          },
        ],
      };
    }

    const content = fs.readFileSync(filePath, "utf8");

    return {
      content: [
        {
          type: "text",
          text: `# ${rule_name} コーディング規約\n\n${content}`,
        },
      ],
    };
  }

  private async listRules() {
    if (!fs.existsSync(this.rulesDir)) {
      return {
        content: [
          {
            type: "text",
            text: "登録されているコーディング規約はありません。",
          },
        ],
      };
    }

    const files = fs.readdirSync(this.rulesDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const ruleName = path.basename(file, '.md');
        const filePath = path.join(this.rulesDir, file);
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
            type: "text",
            text: "登録されているコーディング規約はありません。",
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
          type: "text",
          text: `## 登録されているコーディング規約\n\n${rulesList}`,
        },
      ],
    };
  }

  private async deleteRule(args: { rule_name: string }) {
    const { rule_name } = args;
    const fileName = `${rule_name}.md`;
    const filePath = path.join(this.rulesDir, fileName);

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `コーディング規約「${rule_name}」が見つかりません。`,
          },
        ],
      };
    }

    fs.unlinkSync(filePath);

    return {
      content: [
        {
          type: "text",
          text: `コーディング規約「${rule_name}」を削除しました。`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("RuleMCP Server started");
  }
}

// サーバーの起動
const server = new RuleMCPServer();
server.run().catch(console.error); 