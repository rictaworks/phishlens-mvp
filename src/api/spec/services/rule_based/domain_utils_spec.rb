require "rails_helper"

RSpec.describe RuleBased::DomainUtils do
  describe ".extract_domain_from_url" do
    it "httpsのURLからホスト名を小文字で取得する" do
      expect(described_class.extract_domain_from_url("https://Example.com/path")).to eq("example.com")
    end

    it "不正なURLはnilを返す" do
      expect(described_class.extract_domain_from_url("not a url")).to be_nil
    end
  end

  describe ".extract_domain_from_text" do
    it "URLらしき文字列を含むテキストからドメインを抽出する" do
      expect(described_class.extract_domain_from_text("こちら amazon.co.jp をご確認ください")).to eq("amazon.co.jp")
    end

    it "ドメインらしき文字列を含まないテキストはnilを返す" do
      expect(described_class.extract_domain_from_text("アカウントを確認する")).to be_nil
    end
  end

  describe ".punycode_domain?" do
    it "xn--を含むラベルがあればtrue" do
      expect(described_class.punycode_domain?("xn--80ak6aa92e.com")).to be true
    end

    it "通常のドメインはfalse" do
      expect(described_class.punycode_domain?("example.com")).to be false
    end
  end

  describe ".ip_address_domain?" do
    it "IPv4アドレスはtrue" do
      expect(described_class.ip_address_domain?("192.168.1.1")).to be true
    end

    it "通常のドメインはfalse" do
      expect(described_class.ip_address_domain?("example.com")).to be false
    end
  end

  describe ".levenshtein_distance" do
    it "同一文字列は0" do
      expect(described_class.levenshtein_distance("amazon.co.jp", "amazon.co.jp")).to eq(0)
    end

    it "1文字違いは1" do
      expect(described_class.levenshtein_distance("amazon.co.jp", "amaz0n.co.jp")).to eq(1)
    end
  end
end
