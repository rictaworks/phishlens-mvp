# 管理API: AI枠手動リセット

指定した`google_sub`のAI詳細判定枠を即座にリセットする。

- **エンドポイント**: `POST /admin/quota_resets`
- **実装**: `src/api/app/controllers/admin/quota_resets_controller.rb`
- **認証**: BASIC認証(`ADMIN_BASIC_AUTH_USERNAME` / `ADMIN_BASIC_AUTH_PASSWORD`)
- **関連issue**: [#13](https://github.com/rictaworks/phishlens-mvp/issues/13)

## リクエスト

```json
{ "google_sub": "<対象ユーザーのgoogle_sub>" }
```

## レスポンス (201)

```json
{ "google_sub": "...", "used_count": 0, "reset_at": "2026-07-25T03:00:00Z" }
```

## エラー

| status | 条件 |
|---|---|
| 400 | `google_sub`パラメータ欠落 |
| 401 | BASIC認証失敗 |
| 404 | 対象の`google_sub`に該当するユーザーが存在しない |
| 503 | BASIC認証情報未設定 |
