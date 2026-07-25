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

## ページ一覧

(未実装。ページ実装後にここへ追記する)

## API一覧

(未実装。API実装後にここへ追記する。エンドポイントごとにSPEC/配下の仕様書へリンクする)

## 自動ログイン手順

(未実装。Googleログイン実装後にここへ追記する)
