# typescript コーディング規約

最終更新: 2025-06-08T09:41:30.065Z

---

# TypeScriptコーディング規約

## 1. 命名規則
- **変数・関数**: camelCase
  ```typescript
  const userName = 'John';
  function getUserData() { }
  ```

- **クラス・インターフェース・型**: PascalCase
  ```typescript
  class UserService { }
  interface UserData { }
  type ApiResponse = { };
  ```

- **定数**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_RETRY_COUNT = 3;
  ```

- **ファイル名**: kebab-case
  ```
  user-service.ts
  api-client.ts
  ```

## 2. 型定義
- 明示的な型注釈を推奨
  ```typescript
  // Good
  const count: number = 0;
  function getUser(id: string): Promise<User> { }
  
  // 型推論が明確な場合は省略可
  const items = [1, 2, 3]; // number[]と推論される
  ```

## 3. インターフェースと型エイリアス
- オブジェクトの形状定義にはinterfaceを使用
- ユニオン型や複雑な型にはtype aliasを使用
  ```typescript
  interface User {
    id: string;
    name: string;
    email: string;
  }
  
  type Status = 'pending' | 'approved' | 'rejected';
  ```

## 4. 関数定義
- アロー関数と通常の関数を適切に使い分け
  ```typescript
  // メソッドや独立した関数
  function calculateTotal(items: Item[]): number { }
  
  // コールバックや短い関数
  const filtered = items.filter(item => item.active);
  ```

## 5. エラーハンドリング
- 適切な型でエラーをキャッチ
  ```typescript
  try {
    await apiCall();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
  ```

## 6. Import/Export
- 名前付きエクスポートを推奨
- 相対パスより絶対パスを使用
  ```typescript
  // Good
  import { UserService, ApiClient } from '@/services';
  
  // 避ける
  import UserService from '../../../services/UserService';
  ```

## 7. 設定ファイル
- ESLint + Prettier の組み合わせを推奨
- `@typescript-eslint/recommended` を基本設定として使用

## 8. その他のベストプラクティス
- `any` 型の使用を避ける
- `strict` モードを有効にする
- 未使用の変数やimportを削除する
- コメントは必要最小限に留める（コードが自己説明的になるよう心がける）
