# 管理API: マスタ管理

マスタ6種(計126件)のCRUDをBASIC認証配下で提供する。

- **実装**: `src/api/app/controllers/admin/masters_controller.rb`
- **認証**: BASIC認証(`ADMIN_BASIC_AUTH_USERNAME` / `ADMIN_BASIC_AUTH_PASSWORD`)
- **関連issue**: [#13](https://github.com/rictaworks/phishlens-mvp/issues/13)

## エンドポイント

| method | path | 説明 |
|---|---|---|
| GET | `/admin/masters/:master_type` | 一覧取得 |
| POST | `/admin/masters/:master_type` | 新規作成(`master`パラメータ配下に属性を渡す) |
| PATCH | `/admin/masters/:master_type/:id` | 更新 |
| DELETE | `/admin/masters/:master_type/:id` | 削除 |

`:master_type` に指定可能な値と対応する属性:

| master_type | 対応モデル | 属性 |
|---|---|---|
| `urgency_keywords` | UrgencyKeyword | `keyword`, `lang` |
| `brand_domains` | BrandDomain | `brand_name`, `official_domain` |
| `shortener_domains` | ShortenerDomain | `domain` |
| `ai_style_patterns` | AiStylePattern | `pattern_code`, `description`, `weight` |
| `judgement_categories` | JudgementCategory | `label`, `threshold_min` |
| `feedback_categories` | FeedbackCategory | `label` |

## リクエスト例

```
POST /admin/masters/urgency_keywords
Authorization: Basic <base64(username:password)>
Content-Type: application/json

{ "master": { "keyword": "至急", "lang": "ja" } }
```

## エラー

| status | 条件 |
|---|---|
| 400 | `master`パラメータ欠落 |
| 401 | BASIC認証失敗 |
| 404 | 未知の`master_type`、または存在しない`id` |
| 422 | バリデーションエラー |
| 503 | `ADMIN_BASIC_AUTH_USERNAME`/`ADMIN_BASIC_AUTH_PASSWORD`未設定 |

現時点ではJSON APIのみでHTML管理画面は未実装(#13のPR参照)。
