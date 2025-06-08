# MCP SDK ライブラリ仕様メモ

## 概要
Model Context Protocol (MCP) の公式TypeScript SDKの仕様をまとめたメモです。

## 使用ライブラリ
- `@modelcontextprotocol/sdk/server/mcp.js` - McpServer クラス
- `@modelcontextprotocol/sdk/server/streamableHttp.js` - StreamableHTTPServerTransport クラス

## McpServer クラス

### 基本的な使用方法
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "サーバー名",
  version: "1.0.0",
  instructions: "サーバーの使用方法の説明"
});
```

### 主要メソッド

#### tool() - ツールの定義
```typescript
server.tool(
  "tool_name",           // ツール名
  { param: z.string() }, // パラメータスキーマ（Zodを使用）
  async (params, { authInfo }) => {
    // ツールの実装
    return {
      content: [{ type: "text", text: "結果" }]
    };
  }
);
```

#### resource() - リソースの定義
```typescript
server.resource(
  "resource_name",
  "resource://uri",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "リソースの内容"
    }]
  })
);
```

#### prompt() - プロンプトの定義
```typescript
server.prompt(
  "prompt_name",
  { param: z.string() },
  ({ param }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `プロンプトテンプレート: ${param}`
      }
    }]
  })
);
```

#### connect() - トランスポートとの接続
```typescript
await server.connect(transport);
```

## StreamableHTTPServerTransport クラス

### 基本的な使用方法
```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => uuidv4(),
  onsessioninitialized: (sessionId) => {
    // セッション初期化時の処理
  }
});
```

### 設定オプション
- `sessionIdGenerator`: セッションID生成関数
- `onsessioninitialized`: セッション初期化時のコールバック
- `enableJsonResponse`: JSON レスポンスを有効にする（デフォルト: true）
- `eventSourceEnabled`: Server-Sent Events を有効にする（デフォルト: true）

### 主要メソッド

#### handleRequest() - リクエスト処理
```typescript
await transport.handleRequest(req, res, body);
```
- Express の req, res オブジェクトと、パースされたボディを受け取る
- MCP プロトコルに従ってリクエストを処理し、レスポンスを返す

### セッション管理
- `transport.sessionId`: セッションIDを取得
- `transport.onclose`: 接続終了時のコールバック設定

## プロトコル仕様

### Streamable HTTP Transport (2025-03-26)
- 単一エンドポイント（`/mcp`）でリクエスト・レスポンスを処理
- セッションIDは `Mcp-Session-Id` ヘッダーで管理
- JSON レスポンスまたは SSE ストリーミングに対応

### HTTP メソッド
- `POST /mcp`: クライアントからサーバーへのリクエスト
- `GET /mcp`: SSE ストリーム（オプション）
- `DELETE /mcp`: セッション終了

### セッション管理フロー
1. 初回リクエスト（`initialize` メソッド）でセッション作成
2. サーバーが `Mcp-Session-Id` ヘッダーでセッションIDを返却
3. 以降のリクエストでクライアントがセッションIDを送信
4. セッション終了時は DELETE リクエストまたは接続切断

## 認証
- OAuth 2.1 with PKCE をサポート
- `authInfo` オブジェクトでユーザー情報を取得
  - `token`: アクセストークン
  - `clientId`: クライアントID
  - `scopes`: 権限スコープ

## エラーハンドリング
- JSON-RPC 2.0 エラーフォーマットを使用
- 標準的なHTTPステータスコードを返却
- 構造化されたエラーレスポンス

## 実装時の注意点
1. セッション管理は必須（メモリ内のMapで管理可能）
2. 認証情報の検証を適切に実装
3. エラーハンドリングを適切に行う
4. CORS設定が必要な場合は適切に設定
5. プロダクション環境では HTTPS を使用

## 参考リンク
- [MCP TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 仕様書](https://modelcontextprotocol.io/) 