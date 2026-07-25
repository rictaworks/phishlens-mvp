# フィードバックAPI

判定結果への同意/異議フィードバックをreCAPTCHA検証必須で受け付ける。

- **エンドポイント**: `POST /api/feedbacks`
- **実装**: `src/api/app/controllers/api/feedbacks_controller.rb`
- **認証**: 必須。`Authorization: Bearer <Google IDトークン>`
- **関連issue**: [#12](https://github.com/rictaworks/phishlens-mvp/issues/12)

## リクエスト

```json
{
  "judgement_id": 42,
  "feedback_code": "agree",
  "recaptcha_token": "<reCAPTCHAトークン>"
}
```

`feedback_code` は `agree` / `dispute` / `unknown` のいずれか。

## レスポンス (201)

```json
{ "id": 1, "feedback_code": "agree" }
```

## エラー

| status | 条件 |
|---|---|
| 400 | 必須パラメータ欠落 |
| 401 | 認証エラー |
| 404 | 対象の`judgement_id`が存在しない、または他ユーザーの判定(自分の判定のみフィードバック可能) |
| 422 | `feedback_code`が不正、またはreCAPTCHA検証失敗 |
| 503 | `RECAPTCHA_SECRET_KEY`未設定 |

reCAPTCHAウィジェット(トークン取得UI)自体は未実装。呼び出し元(ダッシュボード/拡張)が
何らかの方法で取得したトークンを渡すことを前提とする(拡張側は
`src/extension/src/api/feedback-client.ts` の `submitFeedback` を参照)。
