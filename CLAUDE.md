# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

phishlens-mvp — 生成AI製フィッシングメールを判定するブラウザ拡張（Chrome拡張 + Next.jsダッシュボード + Rails API + FastAPI/LangChain判定サービス）のMVP。詳細設計は requirements.md を参照。

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

これらはすべての会話・コード生成に適用される。削除の代わりに DELETE/ ディレクトリへ移動すること。

## シークレット管理（重要）

- `config/master.key` など機密ファイルを `git add` するコードを生成してはならない
- デプロイスクリプト・セットアップ手順でも同様
- シークレットは必ず環境変数（RAILS_MASTER_KEY 等）で渡すこと
- `.gitignore` への追加を確認する手順を必ずコードに含めること
- 初回コミット前に `git status` でステージング確認を促すこと

## ブランチ運用

- main ブランチでの直接作業は禁止。
- src/* 以外の変更は main への直接 push を許可する。
- src/* の変更は必ず PR を作成すること。
- PR には非エンジニア向けのユーザーテスト手順（実機での確認方法）を丁寧に記載すること。

## テスト方針（TDD厳守）

- 順序: plan → red test → coding → green test。この順序を飛ばさない。
- テストフレームワーク: RSpec（Rails API）、Jest（TypeScript/Next.js・Chrome拡張）など言語に応じたもの。
- フロントエンドの動作確認は curl, wget --mirror, playwright で行うこと（目視確認だけで済ませない）。
- コミット前に security review を実施すること（/security-review を使用）。

## コーディング規約

- 時刻は JST、エンコードは UTF-8。
- アイコンは Font Awesome を使用する。絵文字は使用しない。
- 環境変数は .env を参照する。
- フォールバック処理は禁止。例外はすべて明示的にハンドリングすること。
- デバッグトレースできるように処理の要所でログを出力すること。
- 制御構文・条件構文以外はクラスまたは関数内に書くこと（トップレベルの裸のロジックを避ける）。
- グローバル変数は禁止(セキュリティ上の理由)。
- 文字列リテラルは設定ファイルまたはDBに分離すること（ハードコード禁止）。ハードコードを検出するテストを書くこと。
- ネイティブの alert() / confirm() / prompt() はプロジェクト全体で使用禁止。
- 環境判定（development/staging/production等）を必ず実装し、分岐できるようにすること。開発環境はテスト可能にするため認証済み状態に自動分岐すること。
- 画像はAI生成すること。専門的な文章（ライティング）はwriterエージェントに担当させること。

## アーキテクチャ・デプロイ・多言語（自社開発プロジェクト向け）

詳細は @.claude/rules/architecture-deploy.md と @.claude/rules/i18n.md を参照。

## README.md 必須記載事項

README.md を作成・更新する際は以下を漏れなく記載すること:
- 自動ログイン手順
- ページ一覧（ページ名・URLリンク）
- API一覧（SPEC/api へのリンク、タイトル・エンドポイントURL）

## 品質・セキュリティ参照ファイル

- 品質チェック10項目: @.claude/QC10.md
- テスト手法・フレームワーク: @DOCS/TM.md
- セキュリティ（OWASP Top 10 2021）: @.claude/OWASP10.md
- コンプライアンスチェック10項目: @.claude/CC.md
- 開発原則（YAGNI/KISS/DRY/SOLID等）: @DOCS/development-principles.md

## ディレクトリ運用

- TASKS/ — タスク管理
- DEBUG/ — バグ報告
- CLIENT/ — クライアント要望
- WORK/ — 作業報告
- ENV/DEVELOPMENT.md — 開発環境
- ENV/PRODUCTION.md — 本番環境
- SPEC/ — 仕様書・リバースエンジニアリング図（ER図/DFD/シーケンス図/クラス図/状態遷移図/ユースケース図。mermaid使用）
- DELETE/ — ゴミ箱（削除の代わりにここへ移動する）
- app-ui/ — 事前デザイン指定がある場合のモック配置場所（存在する場合は必ず従うこと）

## CI/CD

- CI は必須。CD は Claude Desktop 側で設定する（このリポジトリの CI 設定には含めない）。

## ワークフロー・AI役割分担

AI役割分担・リリースフローの詳細は @.claude/rules/workflow.md を参照。
