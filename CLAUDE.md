# Claude Safety Rules

## 削除系コマンドの禁止（重要）

以下のルールはこのワークスペース内のすべての会話で絶対に守られる：

- Claude はファイルまたはディレクトリを削除するコマンドを一切生成してはならない。
  例：rm, rm -rf, rm *, rmdir, unlink, cache --delete,
      lftp mirror --delete, rsync --delete, git clean -df, find -delete 等。

- 削除が必要な場合でも、Claude は削除コマンドを提案せず、
  「手動で削除してください」といった説明に留めること。

- 削除の推奨・削除操作の自動判断も禁止。

- ssh / lftp / デプロイ系スクリプトを生成する場合でも、
  削除コマンドの生成は禁止。

これらはすべての会話・コード生成に適用される。

## シークレット管理（重要）

- `config/master.key` など機密ファイルを `git add` するコードを生成してはならない
- デプロイスクリプト・セットアップ手順でも同様
- シークレットは必ず環境変数（RAILS_MASTER_KEY 等）で渡すこと
- `.gitignore` への追加を確認する手順を必ずコードに含めること
- 初回コミット前に `git status` でステージング確認を促すこと

## プロジェクト概要

- PhishLens MVP: Gmail等のWebメール上でフィッシング/AI生成メールを判定するChrome拡張(MV3/TypeScript)。
- 構成: Chrome拡張 → Next.js(TS)ダッシュボード(Vercel) / Rails APIバックエンド(Railway) / FastAPI+LangChain AI判定サービス(Railway) / PostgreSQL(本番)・SQLite(開発)。
- 詳細仕様は @requirements.md を参照。まだソースコードは存在しない(スキャフォールディング段階)。

## ブランチ / PR運用

- mainブランチでの直接作業は禁止。src/* 以外の変更はmainへのpushを許可するが、src/* の変更は必ずPRを作成すること。
- PRには非エンジニア向けのユーザーテスト手順を丁寧に記載すること。
- commit前にsecurity reviewを実施すること。参照: `.claude/QC10.md`, `.claude/TM.md`(テストメソッド/テストフレームワーク概要 — 脅威モデルではない), `.claude/OWASP10.md`(OWASP Top 10)。
- CIは必須。CDはClaude Desktop側で構成するため、本リポジトリのCI設定にはCDを含めない。

## テスト方針(TDD厳守)

- 順序: plan → red test → coding → green test。
- テストフレームワーク: RSpec(Rails側)/ Jest(フロント側)を想定。
- フロントエンドの動作確認はcurl, wget --mirror, playwrightで行うこと。

## コーディング規約

- デフォルトアイコンはFont Awesomeを使用する。絵文字は使用しない。
- フォールバック処理は禁止。想定される例外は明示的に例外処理として書くこと。
- デバッグトレース(ログ出力等)ができるように書くこと。
- 制御構文・条件構文以外の処理はクラスまたは関数に分離すること。セキュリティ上グローバル変数は禁止。
- 文字列リテラルは直書きせず設定ファイルに分離すること。
- 環境変数は `.env` を参照すること(値は絶対にコミットしない — 上記シークレット管理も参照)。

## ドキュメント構成

- `TASKS/` タスク管理 / `DEBUG/` バグ報告 / `CLIENT/` クライアント要望 / `WORK/` 作業報告
- `ENV/DEVELOPMENT.md` 開発環境 / `ENV/PRODUCTION.md` 本番環境
- `SPEC/` 仕様書・リバースエンジニアリング図(ER図/DFD/シーケンス図/クラス図/状態遷移図/ユースケース図)。図はMermaid記法(```mermaid フェンス、GitHub等でそのまま描画されるため追加インストール不要)を使用。
- `DELETE/` はゴミ箱として運用する(実削除はしない — 上記「削除系コマンドの禁止」を厳守)。
- README.mdには自動ログイン手順・ページ一覧(ページ名+URL)・API一覧(SPEC/apiリンク: タイトル+エンドポイントURL)を常に最新化して記載すること(ページ/APIが実装され次第、順次追記)。
- 注意: `.gitignore` により `TASKS/`, `DEBUG/`, `CLIENT/`, `WORK/`, `ENV/`, `app-ui/` は追跡対象外(ローカル運用)。`SPEC/` のみ git管理下にあり、チーム共有される。

## 開発原則・デザイン原則

- 実装判断に迷ったら `.claude/development-principles.md`(YAGNI/KISS/DRY/SOLID、Fail Fast、Boy Scout Rule 等)を参照すること。
- UI/フロントエンド実装時は `.claude/CRAP.md`(Contrast/Repetition/Alignment/Proximity のデザインチェックリスト)を参照すること。

## デザインモック

- 事前にデザイン指定がある場合、`app-ui/` 配置済みのモック(現在: `PhishLens Mockup.dc.html` ほか、パーミッション555=読み取り専用)に従うこと。

## サブエージェント構成

- 規模に応じて次のロールのサブエージェントを用意する: director, project-manager, designer, debugger, tester, data-scientist, deployer, writer, service-manager。

## 表記

- 時刻表記はJST、文字エンコードはUTF-8。