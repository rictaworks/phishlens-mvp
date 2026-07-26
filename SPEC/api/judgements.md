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
  "id": 42,
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

---

## 判定履歴API

自分自身(認証トークンのgoogle_subに紐づく分のみ)の判定履歴を新しい順に返す。本文・件名・送信元は含まない。

- **エンドポイント**: `GET /api/judgements`
- **実装**: `src/api/app/controllers/api/judgements_controller.rb#index`
- **認証**: 必須。`Authorization: Bearer <Google IDトークン>`
- **関連issue**: [#45](https://github.com/rictaworks/phishlens-mvp/issues/45)

### レスポンス (200)

```json
{
  "judgements": [
    {
      "id": 42,
      "judged_at": "2026-07-22T09:14:00+09:00",
      "category_code": "danger",
      "category_label": "危険",
      "phishing_score": 78,
      "ai_gen_score": 65,
      "ai_detail_used": true,
      "feedback_label": "異議",
      "body_sha256": "...",
      "reasons": [ { "code": "AUTH_HEADERS_ANY_FAIL", "delta": 30 } ]
    }
  ]
}
```

- `feedback_label` はフィードバック未送信の場合 `null`(表示用の代替文字列への変換はフロントエンド側で行う)。
- 最大 `HISTORY_LIMIT`(100件)まで返す。ページネーションはMVP範囲外。
- 他ユーザーの判定は`google_sub`でスコープされ、常に除外される。

### エラー

| status | 条件 |
|---|---|
| 401 | 認証エラー(トークン欠落・不正・`GOOGLE_OAUTH_CLIENT_ID`未設定) |

---

## KPI集計API

自分自身の判定実行数・AI枠消費率・フィードバック率を集計して返す(requirements.md 1.8)。

- **エンドポイント**: `GET /api/judgements/kpis`
- **実装**: `src/api/app/controllers/api/judgements_controller.rb#kpis` / `src/api/app/services/dashboard_kpi_calculator.rb`
- **認証**: 必須。`Authorization: Bearer <Google IDトークン>`
- **関連issue**: [#45](https://github.com/rictaworks/phishlens-mvp/issues/45)

### レスポンス (200)

```json
{
  "judgement_count": 128,
  "quota_usage_rate": 62,
  "feedback_rate": 34
}
```

- `quota_usage_rate` = AI詳細判定が使われた判定の割合(%、四捨五入)。
- `feedback_rate` = フィードバックが送信された判定の割合(%、四捨五入)。
- 判定が1件もない場合はすべて`0`。

### エラー

| status | 条件 |
|---|---|
| 401 | 認証エラー(トークン欠落・不正・`GOOGLE_OAUTH_CLIENT_ID`未設定) |
