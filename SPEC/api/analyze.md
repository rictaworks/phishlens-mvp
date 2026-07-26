# AI詳細判定API

メール本文を受け取り、LangChain(`ChatGoogleGenerativeAI`, `model=gemini-2.5-flash`)経由でフィッシング意図・
AI生成らしさ・根拠文を返す。Rails API(`src/api/app/services/ai_detail_judge.rb`)から呼び出される
内部サービスであり、拡張/ダッシュボードから直接叩くことは想定しない。

- **エンドポイント**: `POST /analyze`
- **実装**: `src/ai-service/app/main.py`
- **認証**: なし(内部ネットワーク経由呼び出しを想定。公開時は別途アクセス制限が必要)
- **関連issue**: [#10](https://github.com/rictaworks/phishlens-mvp/issues/10)

## リクエスト

```json
{ "body": "至急ご確認ください。..." }
```

## レスポンス (200)

```json
{
  "phishing_score": 78,
  "ai_gen_score": 65,
  "reason_text": "緊急性を煽る表現が多用されています"
}
```

## エラー

| status | 条件 |
|---|---|
| 422 | `body`が空 |
| 502 | LLM呼び出し失敗(構造化出力の解析失敗を含む) |
| 503 | `GOOGLE_API_KEY`未設定 |

本文はログ出力・永続化しない(オンメモリ処理のみ、requirements.md 1.7)。

## ヘルスチェック

- `GET /healthz` → `{ "status": "ok" }`
