# phishlens-mvp

生成AI製フィッシングメールを判定するブラウザ拡張のMVP。詳細仕様は [requirements.md](./requirements.md) を参照。

## 構成

| ディレクトリ | 技術 |
|---|---|
| `src/extension` | Chrome拡張 Manifest V3 / TypeScript |
| `src/dashboard` | Webダッシュボード Next.js / TypeScript |
| `src/api` | APIバックエンド Rails |
| `src/ai-service` | AI判定サービス FastAPI + LangChain |

## セットアップ・テスト実行

```bash
# 拡張機能
cd src/extension && npm install && npm test

# ダッシュボード
cd src/dashboard && npm install && npm test

# APIバックエンド
cd src/api && bundle install && RAILS_ENV=test bin/rails db:prepare && bundle exec rspec

# AI判定サービス
cd src/ai-service && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements-dev.txt && pytest
```

## ローカル起動(ポート競合を避けるため明示指定)

```bash
# ダッシュボード(Next.js) http://localhost:3000
cd src/dashboard && npm run dev

# APIバックエンド(Rails) http://localhost:3001
cd src/api && PORT=3001 bin/rails server

# AI判定サービス(FastAPI) http://localhost:8000
cd src/ai-service && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# 拡張機能ビルド → chrome://extensions で「パッケージ化されていない拡張機能を読み込む」→ src/extension/dist を選択
cd src/extension && npm run build
```

## ページ一覧

| ページ名 | URL(開発時) |
|---|---|
| ダッシュボード(判定履歴・KPI) | http://localhost:3000/ |
| Chrome拡張 判定オーバーレイ | (URLなし。`https://mail.google.com/*` 上でcontent scriptとして動作) |

管理画面(#13)はHTML画面ではなくBASIC認証で保護されたJSON API(下記API一覧参照)として実装されているため、
現時点ではURLを持つ管理画面ページは存在しない。

## API一覧

| API | エンドポイント | 詳細 |
|---|---|---|
| 判定API | `POST /api/judgements` (Rails) | [SPEC/api/judgements.md](./SPEC/api/judgements.md) |
| 判定履歴API | `GET /api/judgements` (Rails) | [SPEC/api/judgements.md](./SPEC/api/judgements.md) |
| KPI集計API | `GET /api/judgements/kpis` (Rails) | [SPEC/api/judgements.md](./SPEC/api/judgements.md) |
| フィードバックAPI | `POST /api/feedbacks` (Rails) | [SPEC/api/feedbacks.md](./SPEC/api/feedbacks.md) |
| 管理API: マスタ管理 | `/admin/masters/:master_type` (Rails) | [SPEC/api/admin-masters.md](./SPEC/api/admin-masters.md) |
| 管理API: AI枠手動リセット | `POST /admin/quota_resets` (Rails) | [SPEC/api/admin-quota-resets.md](./SPEC/api/admin-quota-resets.md) |
| AI詳細判定API | `POST /analyze` (FastAPI) | [SPEC/api/analyze.md](./SPEC/api/analyze.md) |

## 自動ログイン手順

Googleログイン(chrome.identity経由のOAuth、#14)は実装済みだが、**実クレデンシャルが未設定のため現時点では動作しない**。
動作させるには以下の設定が必要:

1. Google Cloud ConsoleでOAuthクライアントIDを発行する
2. `src/extension/manifest.json` の `oauth2.client_id` をプレースホルダ(`REPLACE_WITH_...`)から実際のクライアントIDに差し替える
3. Rails側に環境変数 `GOOGLE_OAUTH_CLIENT_ID` を設定する(IDトークン検証用)

上記が未設定の間、拡張は `GoogleAuthNotConfiguredError`、Rails APIは401(`ClientIdNotConfiguredError`)を返す
(規約によりフォールバックせず明示的エラーとする設計)。

ダッシュボード(Next.js)側のGoogleログイン(#45)はGoogle Identity Services(GIS)の「Googleでログイン」ボタンを使用する。
拡張のOAuthクライアント(Chrome拡張タイプ)とは**別に、Webアプリケーションタイプ**のOAuthクライアントIDを発行する必要がある
(承認済みJavaScriptオリジンに `http://localhost:3000` および本番Vercel URLを登録する)。動作させるには以下の設定が必要:

1. Google Cloud ConsoleでWebアプリケーション用OAuthクライアントIDを発行する
2. `src/dashboard/.env.local` の `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` をプレースホルダ(`REPLACE_WITH_...`)から実際のクライアントIDに差し替える
3. `src/dashboard/.env.local` の `NEXT_PUBLIC_API_BASE_URL` にRails APIのURL(開発時は `http://localhost:3001`)を設定する
4. Rails側の `CORS_ALLOWED_ORIGINS` にダッシュボードのオリジンを追加する

上記が未設定の間、ダッシュボードはサインインボタンの代わりに未設定エラーメッセージを表示する(規約によりフォールバックしない)。
