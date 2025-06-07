# RuleMCP - コーディング規約管理MCPサーバー

コーディング規約を簡単に保存・呼び出し・管理できるMCPサーバーです。

## 機能

- **save_rule**: コーディング規約を保存・更新
- **get_rule**: 指定されたコーディング規約を取得
- **list_rules**: 登録されているコーディング規約の一覧表示
- **delete_rule**: 指定されたコーディング規約を削除

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. 開発モード（TypeScriptのウォッチモード）

```bash
npm run dev
```

## 使用例

### 1. Pythonコーディング規約の保存

```bash
# save_rule ツールを使用
{
  "rule_name": "python",
  "content": "# Python コーディング規約\n\n## 基本ルール\n- PEP8に従う\n- 行の長さは88文字以内\n- import文は個別に記述する\n\n## 変数名\n- snake_caseを使用\n- 定数はUPPER_CASE\n\n## 関数\n- 動詞で始まる\n- type hintsを使用する"
}
```

### 2. 規約の取得

```bash
# get_rule ツールを使用
{
  "rule_name": "python"
}
```

### 3. 規約一覧の表示

```bash
# list_rules ツールを使用
{}
```

### 4. 規約の削除

```bash
# delete_rule ツールを使用
{
  "rule_name": "python"
}
```

## ディレクトリ構造

```
rulesmcp/
├── src/
│   └── index.ts          # メインサーバーファイル
├── dist/                 # ビルド出力
├── rules/               # コーディング規約ファイル保存場所
│   ├── python.md
│   ├── typescript.md
│   └── marp.md
├── package.json
├── tsconfig.json
└── README.md
```

## MCPクライアントでの設定

Claude Desktopアプリでこのサーバーを使用する場合は、設定ファイルに以下を追加してください：

```json
{
  "mcpServers": {
    "rulemcp": {
      "command": "node",
      "args": ["path/to/rulesmcp/dist/index.js"]
    }
  }
}
```

## 対応言語・フレームワークの例

- `python` - Python コーディング規約
- `typescript` - TypeScript コーディング規約
- `javascript` - JavaScript コーディング規約
- `react` - React コンポーネント規約
- `vue` - Vue.js コーディング規約
- `marp` - Marp プレゼンテーション規約
- `css` - CSS スタイル規約
- `html` - HTML マークアップ規約

各規約ファイルはMarkdown形式で保存され、最終更新日時も記録されます。 