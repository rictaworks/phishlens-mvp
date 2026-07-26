require "rails_helper"

RSpec.describe RuleBased::PhishingScorer do
  describe "CREDENTIAL_REQUEST_PHRASES_PATH" do
    it "Rails.root配下のパスを参照する(Railwayのapi単体デプロイでも解決できるように)" do
      expect(described_class::CREDENTIAL_REQUEST_PHRASES_PATH.to_s).to start_with(Rails.root.to_s)
    end

    it "実ファイルが存在する" do
      expect(File.exist?(described_class::CREDENTIAL_REQUEST_PHRASES_PATH)).to be(true)
    end
  end

  describe "CREDENTIAL_REQUEST_PHRASES" do
    it "src/extension/config/credential-request-phrases.json と内容が一致する(二重管理の同期漏れ検知)" do
      extension_path = Rails.root.join("..", "extension", "config", "credential-request-phrases.json")
      extension_phrases = JSON.parse(File.read(extension_path))

      expect(described_class::CREDENTIAL_REQUEST_PHRASES).to eq(extension_phrases)
    end
  end

  def base_email(overrides = {})
    {
      subject: "定期のお知らせ",
      body: "いつもご利用ありがとうございます。",
      sender_display_name: "カスタマーサポート",
      sender_domain: "example.com",
      auth_headers: { spf: "pass", dkim: "pass", dmarc: "pass" },
      links: []
    }.merge(overrides)
  end

  describe "認証ヘッダ評価" do
    it "SPF/DKIM/DMARCすべてpassなら-30点" do
      result = described_class.new(base_email).score
      expect(result[:reasons]).to include(code: "AUTH_HEADERS_ALL_PASS", delta: -30)
    end

    it "いずれかfailなら+30点" do
      email = base_email(auth_headers: { spf: "pass", dkim: "fail", dmarc: "pass" })
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "AUTH_HEADERS_ANY_FAIL", delta: 30)
    end

    it "ヘッダ取得不能なら0点" do
      result = described_class.new(base_email(auth_headers: nil)).score
      expect(result[:reasons]).to include(code: "AUTH_HEADERS_UNAVAILABLE", delta: 0)
    end
  end

  describe "URL評価" do
    it "表示テキストとhrefのドメイン不一致で+25点" do
      email = base_email(
        auth_headers: nil,
        links: [ { display_text: "https://amazon.co.jp/account", href: "https://amaz0n-verify.com/login" } ],
      )
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URL_DISPLAY_HREF_MISMATCH", delta: 25)
    end

    it "短縮URLドメイン該当で+10点" do
      ShortenerDomain.find_or_create_by!(domain: "bit.ly")
      email = base_email(auth_headers: nil, links: [ { display_text: "詳細", href: "https://bit.ly/abc123" } ])
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URL_SHORTENER_DOMAIN", delta: 10)
    end

    it "punycodeドメインで+25点" do
      email = base_email(
        auth_headers: nil,
        links: [ { display_text: "確認する", href: "https://xn--80ak6aa92e.com/login" } ],
      )
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URL_PUNYCODE_OR_IP", delta: 25)
    end

    it "IPアドレス直打ちURLで+25点" do
      email = base_email(auth_headers: nil, links: [ { display_text: "確認する", href: "http://192.168.1.10/login" } ])
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URL_PUNYCODE_OR_IP", delta: 25)
    end

    it "ブランドドメインと編集距離1-2の類似偽ドメインで+30点" do
      BrandDomain.find_or_create_by!(brand_name: "Amazon", official_domain: "amazon.co.jp")
      email = base_email(auth_headers: nil, links: [ { display_text: "確認する", href: "https://amaz0n.co.jp/login" } ])
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URL_BRAND_LOOKALIKE_DOMAIN", delta: 30)
    end
  end

  describe "緊急性キーワード評価" do
    it "1件該当で+5点" do
      UrgencyKeyword.find_or_create_by!(keyword: "至急", lang: "ja")
      email = base_email(auth_headers: nil, body: "至急ご確認ください。")
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URGENCY_KEYWORDS_MATCHED", delta: 5)
    end

    it "上限は+20点" do
      %w[至急 緊急 直ちに 今すぐ 最終通知 重要].each { |k| UrgencyKeyword.find_or_create_by!(keyword: k, lang: "ja") }
      email = base_email(auth_headers: nil, body: "至急、緊急、直ちに、今すぐ、最終通知、重要な連絡です。")
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "URGENCY_KEYWORDS_MATCHED", delta: 20)
    end
  end

  describe "認証情報要求表現評価" do
    it "該当表現があれば+20点" do
      email = base_email(auth_headers: nil, body: "本人確認のためパスワードを入力してください。")
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "CREDENTIAL_REQUEST_DETECTED", delta: 20)
    end
  end

  describe "送信者ブランド不一致評価" do
    it "表示名がブランドマスタに一致し送信ドメインが不一致なら+25点" do
      BrandDomain.find_or_create_by!(brand_name: "Amazon", official_domain: "amazon.co.jp")
      email = base_email(auth_headers: nil, sender_display_name: "Amazon", sender_domain: "amaz0n-verify.com")
      result = described_class.new(email).score
      expect(result[:reasons]).to include(code: "SENDER_BRAND_DOMAIN_MISMATCH", delta: 25)
    end

    it "送信ドメインが公式ドメインと一致すれば加点しない" do
      BrandDomain.find_or_create_by!(brand_name: "Amazon", official_domain: "amazon.co.jp")
      email = base_email(auth_headers: nil, sender_display_name: "Amazon", sender_domain: "amazon.co.jp")
      result = described_class.new(email).score
      expect(result[:reasons]).not_to include(a_hash_including(code: "SENDER_BRAND_DOMAIN_MISMATCH"))
    end
  end

  describe "合計スコアのクリップ" do
    it "100点を超える場合は100にクリップする" do
      BrandDomain.find_or_create_by!(brand_name: "Amazon", official_domain: "amazon.co.jp")
      email = {
        subject: "【重要】至急のご連絡",
        body: "本人確認のためパスワードを入力してください。",
        sender_display_name: "Amazon",
        sender_domain: "amaz0n-verify.com",
        auth_headers: { spf: "fail", dkim: "fail", dmarc: "fail" },
        links: [ { display_text: "https://amazon.co.jp/account", href: "https://amaz0n.co.jp/login" } ]
      }
      result = described_class.new(email).score
      expect(result[:score]).to eq(100)
    end

    it "0点を下回る場合は0にクリップする" do
      result = described_class.new(base_email).score
      expect(result[:score]).to eq(0)
    end
  end
end
