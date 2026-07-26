# PhishLens E2Eユーザーテスト手順

過去に merge された全PR(#15〜#50, WIP/重複を除く24件)の「動作確認手順(非エンジニアの方向け)」を
新しい順に読み込み、**現時点(2026-07-26, mainブランチ / v0.0.2)の実装状態に対して有効な手順のみ**を
1本のE2Eテスト手順として統合したものです。個別PRの手順は当時実装途中の機能(CIグリーンのみ確認、
UIがまだ存在しない等)を多く含むため、ここでは重複・陳腐化した手順は除外し、現在動く機能のみを記載します。

## 対象環境(本番)

| コンポーネント | URL / 場所 |
|---|---|
| ダッシュボード | https://phishlens-mvp.vercel.app/ |
| APIバックエンド | https://api-production-b0e7.up.railway.app |
| AI判定サービス | Railway内部サービス(apiから`AI_SERVICE_URL`経由で呼び出し。外部公開URLなし) |
| Chrome拡張 | GitHub Releases [`extension-v0.0.2`](https://github.com/rictaworks/phishlens-mvp/releases/tag/extension-v0.0.2) の `phishlens-extension-v0.0.2.zip` |

## 前提知識:意図的な「未設定エラー」表示について

本プロジェクトは秘密情報未設定時に**フォールバックせず明示的エラーを表示する**設計方針を一貫して採用しています
(README「自動ログイン手順」章 参照)。以下は **バグではなく仕様通りの状態** です。テスト中にこれらが表示されても
異常とは判定しないでください。

- ダッシュボードのGoogleログイン:Web用OAuthクライアントIDが**未発行**のため、常に設定エラーメッセージが出る
- 拡張のGoogleログイン(`chrome.identity`):同様に未設定エラーとなる場合がある
- 管理API(`/admin/masters/*`, `/admin/quota_resets`):`ADMIN_BASIC_AUTH_USERNAME`/`PASSWORD`が未設定のRailway環境では503

これらは追加のAPIキー/クレデンシャル発行が必要な、本テストのスコープ外の別タスクです。

---

## 1. ダッシュボード(Next.js / Vercel)

### 1-1. トップページ表示確認

1. https://phishlens-mvp.vercel.app/ をブラウザで開く
2. 「PhishLens ダッシュボード」の見出しが表示されることを確認する
3. 「本文・件名・送信元アドレスは保存されません。履歴にはスコア・区分・根拠コード・本文ハッシュのみ保持されます。」という
   プライバシー説明文が表示されることを確認する(個人情報非保持のポリシー明示)

**実行結果(2026-07-26確認済み)**: ✅ 200 OKで表示。見出し・プライバシー文言とも表示確認済み。

### 1-2. Googleログイン(未設定時の挙動)

1. トップページに「Google OAuthクライアントIDが未設定です。src/dashboard/.env.localのNEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_IDを
   設定してください。」というメッセージが表示されることを確認する
2. ログインボタン自体は表示されない(フォールバックしない設計のため)

**実行結果(2026-07-26確認済み)**: ✅ 想定通りの未設定メッセージを表示(既知の未対応事項。Google Cloud Consoleで
Webアプリケーション用OAuthクライアントIDを発行し、Vercel環境変数`NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`に設定すれば
解消する)。

> Googleログインが発行済みになったら、以下を追加で確認すること(現時点は未実施):
> - ログイン後に判定履歴一覧(スコア・区分・根拠コード・本文ハッシュ表示、本文/件名/送信元は非表示)が表示される
> - KPI(判定件数・AI枠使用率・フィードバック率)が表示される

---

## 2. APIバックエンド(Rails / Railway)admin API 疎通確認

非エンジニアの方は本節はスキップ可(開発者向けのAPI疎通確認)。

| リクエスト | 期待結果 |
|---|---|
| `GET /api/judgements`(認証なし) | `401 Unauthorized` |
| `GET /api/judgements/kpis`(認証なし) | `401 Unauthorized` |
| `POST /api/feedbacks`(認証なし) | `401 Unauthorized` |
| `GET /admin/masters/category` | `503`(`ADMIN_BASIC_AUTH_USERNAME`/`PASSWORD`未設定のため。設定後はBASIC認証が要求される想定) |
| `POST /admin/quota_resets` | 同上 |

**実行結果(2026-07-26確認済み)**: ✅ 上記すべて期待通り。judgements/kpis/feedbacksは正しく401で保護されている。
admin系は環境変数未設定のため503(想定内・要別途設定)。

---

## 3. Chrome拡張(Gmail上での判定・フィードバック)

### 3-1. インストール

1. https://github.com/rictaworks/phishlens-mvp/releases/tag/extension-v0.0.2 から
   `phishlens-extension-v0.0.2.zip` をダウンロードする
2. 展開する
3. `chrome://extensions` を開き、右上の「デベロッパーモード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」で展開したフォルダを選択する
5. 拡張一覧に「PhishLens」が表示されることを確認する

### 3-2. Gmail上でのメール判定

1. https://mail.google.com を開き、任意のメールを開く
2. 画面右下に判定ボタン(虫眼鏡アイコン+「判定する」)が浮動表示されることを確認する
3. 判定ボタンをクリックする
4. 結果パネルが表示され、以下が表示されることを確認する:
   - 「判定結果: (区分ラベル)」
   - 「フィッシングスコア: n/100」
   - 「AI生成スコア: n/100」または「判定不能」
   - 根拠(reason)の一覧
   - AI判定枠の使用状況(quota-status)
5. 「同意する」または「異議あり」ボタンをクリックし、reCAPTCHA v3(本番サイトキー設定済み・Issue #46)経由で
   フィードバックが送信され、「フィードバックを送信しました」の確認メッセージが表示されることを確認する
6. 「閉じる」ボタンで結果パネルが閉じ、判定ボタン表示に戻ることを確認する
7. 「再判定する」(判定後は文言が変わる)で同じメールを再判定できることを確認する

### 3-3. API障害時のフォールバック確認(任意)

- Rails API呼び出しが失敗した場合、ローカルのルールベース判定(`PhishingScorer`/`AiStyleScorer`)に自動的に
  縮退し、判定結果は表示されるがフィードバック送信は不可(`quotaUsed: false`, `feedbackGiven: false`)となる
  設計になっていることをコードレベルで確認済み(`src/extension/src/content.ts` `buildRuleBasedResult`)。

**実行結果**: ⏳ Gmail実メールアカウントでの目視確認はエンジニア以外の実機ユーザーテストが必要なため、
本セッションでは未実施(ブラウザツールでのGmail操作はユーザーの実メールアカウントへのログインを要するため、
勝手なアカウント操作を避ける観点からスキップ)。手順は上記の通り確定済み。次回、実アカウントでの確認を推奨。

---

## 4. 既知の未対応事項(本テストのスコープ外)

| 項目 | 状態 |
|---|---|
| ダッシュボード用Google OAuthクライアントID(Webアプリケーションタイプ) | 未発行 |
| 拡張用Google OAuthクライアントIDの動作確認(Chrome拡張タイプ、`chrome.identity`) | 未確認 |
| Railway `api` サービスの`ADMIN_BASIC_AUTH_USERNAME`/`PASSWORD` | 未設定(admin API常時503) |

これらは追加のクレデンシャル発行判断(本人確認)が必要なため、本E2Eテストでは意図的な仕様通りの状態として
記録するに留め、変更は行っていません。
