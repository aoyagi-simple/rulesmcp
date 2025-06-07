# marp コーディング規約

最終更新: 2024-12-28T00:00:00.000Z

---

# Marp プレゼンテーション規約

## 基本設定

```yaml
---
marp: true
theme: default
size: 16:9
paginate: true
header: 'プレゼンテーションタイトル'
footer: '© 2024 会社名'
---
```

## スライド構成

### タイトルスライド

```markdown
# プレゼンテーションタイトル
## サブタイトル

発表者: 名前  
日付: 2024年12月28日  
会社名/部署名
```

### セクション区切り

```markdown
---
<!-- _class: lead -->

# セクション名

---
```

## テキストスタイリング

### 見出し階層

- `#` メインタイトル（スライドタイトル）
- `##` セクションタイトル
- `###` サブセクション
- `####` 詳細項目

### 強調表現

- **太字**: 重要なポイント
- *斜体*: 補足説明
- `コード`: コマンドや技術用語
- ==ハイライト==: 最重要ポイント

## リスト表現

### 箇条書き

```markdown
- メインポイント1
  - サブポイント1-1
  - サブポイント1-2
- メインポイント2
- メインポイント3
```

### 番号付きリスト

```markdown
1. ステップ1: 準備
2. ステップ2: 実行
3. ステップ3: 検証
```

## 画像・図表

### 画像挿入

```markdown
![alt text](./images/diagram.png)

<!-- 画像サイズ調整 -->
![bg right:40%](./images/background.jpg)
```

### 表組み

```markdown
| 項目 | 値 | 説明 |
|------|-----|------|
| CPU | 90% | 高負荷 |
| Memory | 75% | 正常 |
| Disk | 60% | 正常 |
```

## レイアウト指定

### 背景画像

```markdown
---
<!-- _backgroundColor: #f0f0f0 -->
<!-- _backgroundImage: url('./images/bg.jpg') -->

# スライドタイトル
---
```

### 2カラムレイアウト

```markdown
<!-- _class: cols-2 -->

## 左カラム

内容...

## 右カラム

内容...
```

## コードブロック

### プログラムコード

```markdown
```python
def hello_world():
    print("Hello, World!")
    return "success"
\```
```

### コマンド例

```markdown
```bash
npm install marp-cli
marp slides.md --pdf
\```
```

## スライドノート

```markdown
<!-- 
このスライドで説明すべきポイント:
- ポイント1
- ポイント2
-->

# スライド内容

発表時の詳細説明や補足事項は
スライドノートに記載する
```

## ベストプラクティス

### スライド設計

- 1スライド1メッセージ
- 文字サイズは読みやすく（最小24px）
- 色のコントラストを十分に確保
- アニメーションは控えめに

### ファイル構成

```
presentation/
├── slides.md           # メインスライド
├── assets/
│   ├── images/        # 画像ファイル
│   ├── css/          # カスタムCSS
│   └── themes/       # カスタムテーマ
├── output/           # 出力ファイル
└── README.md         # 説明書
```

### カスタムテーマ

```css
/* custom-theme.css */
section {
    font-family: 'Noto Sans JP', sans-serif;
    background-color: #ffffff;
}

h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
}

.lead {
    text-align: center;
    font-size: 1.5em;
}
``` 