# 判定API

メールの抽出データを受け取り、ルールベース判定(+利用可能ならAI詳細判定)を統合して結果を返す。

- **エンドポイント**: `POST /api/judgements`
- **実装**: `src/api/app/controllers/api/judgements_controller.rb`
- **認証**: 必須。`Authorization: Bearer <Google IDトークン>`
- **関連issue**: [#9](https://github.com/rictaworks/phishlens-mvp/issues/9)

## リクエスト

```json
{
  "subject": "【重要】アカウントの確認が必要です",
  "body": "お客様のアカウントで不審なログインが検出されました。至急ご確認ください。",
  "sender_display_name": "Amazon",
  "sender_domain": "amaz0n-verify.com",
  "auth_headers": { "spf": "fail", "dkim": "fail", "dmarc": "fail" },
  "links": [
    { "display_text": "https://amazon.co.jp/account", "href": "https://amaz0n.co.jp/login" }
  ]
}
```

`body` と `sender_domain` は必須。`auth_headers` はヘッダ取得不能な場合 `null` を許容する。

## レスポンス (201)

```json
{
  "category_code": "danger",
  "category_label": "危険",
  "phishing_score": 78,
  "ai_gen_score": 65,
  "reasons": [
    { "code": "AUTH_HEADERS_ANY_FAIL", "delta": 30 }
  ],
  "ai_detail_used": true,
  "ai_reason_text": "定型的な文面です",
  "quota_available": false
}
```

- `ai_gen_score` は判定不能の場合 `null`。
- `ai_detail_used` が `false` の場合、AI枠消費済みか `AI_SERVICE_URL` 未設定によりルールベースへ縮退している。

## エラー

| status | 条件 |
|---|---|
| 400 | `body` / `sender_domain` 欠落 |
| 401 | 認証エラー(トークン欠落・不正・`GOOGLE_OAUTH_CLIENT_ID`未設定) |

本文は保存されない。`body_sha256`(SHA-256ハッシュ)のみDBに保持する(requirements.md 1.7)。
