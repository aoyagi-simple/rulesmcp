# python コーディング規約

最終更新: 2024-12-28T00:00:00.000Z

---

# Python コーディング規約

## 基本ルール

- PEP8に従う
- 行の長さは88文字以内（Black formatterのデフォルト）
- import文は個別に記述する
- docstringはGoogle形式またはNumPy形式を使用

## 変数名・関数名

- snake_caseを使用
- 定数はUPPER_CASE
- プライベート変数は先頭にアンダースコア（_）
- 特殊メソッドは前後にアンダースコア（__init__）

## 関数

- 動詞で始まる名前を付ける
- type hintsを必ず使用する
- 戻り値の型も明記する

```python
def calculate_total_price(items: List[Item], tax_rate: float) -> float:
    """商品の合計金額を計算する.
    
    Args:
        items: 商品のリスト
        tax_rate: 税率（0.1 = 10%）
    
    Returns:
        税込み合計金額
    """
    subtotal = sum(item.price for item in items)
    return subtotal * (1 + tax_rate)
```

## クラス

- PascalCaseを使用
- 単一責任の原則に従う
- dataclassを活用する

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    age: Optional[int] = None
```

## インポート

```python
# 標準ライブラリ
import os
import sys
from pathlib import Path

# サードパーティライブラリ
import requests
import pandas as pd

# ローカルモジュール
from .models import User
from .utils import calculate_age
```

## エラーハンドリング

- 具体的な例外をキャッチする
- ログを残す
- 適切なエラーメッセージを提供する

```python
import logging

logger = logging.getLogger(__name__)

def process_user_data(user_id: int) -> Optional[User]:
    try:
        user_data = fetch_user_from_api(user_id)
        return User(**user_data)
    except requests.RequestException as e:
        logger.error(f"API呼び出しに失敗しました: {e}")
        return None
    except KeyError as e:
        logger.error(f"必要なキーが見つかりません: {e}")
        return None
``` 