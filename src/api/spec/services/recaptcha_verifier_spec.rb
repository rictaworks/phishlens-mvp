require "rails_helper"

RSpec.describe RecaptchaVerifier do
  describe "#verify!" do
    it "RECAPTCHA_SECRET_KEY未設定なら明示的な例外を送出する" do
      verifier = described_class.new(secret_key: nil)
      expect { verifier.verify!("token") }.to raise_error(RecaptchaVerifier::NotConfiguredError)
    end

    it "トークンが空なら明示的な例外を送出する" do
      verifier = described_class.new(secret_key: "test-secret")
      expect { verifier.verify!("") }.to raise_error(RecaptchaVerifier::VerificationFailedError)
    end

    it "Googleが成功を返せばtrueを返す" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("https://www.google.com/recaptcha/api/siteverify") do
            [ 200, { "Content-Type" => "application/json" }, { success: true, score: 0.9 }.to_json ]
          end
        end
      end
      verifier = described_class.new(secret_key: "test-secret", connection: connection)

      expect(verifier.verify!("valid-token")).to be true
    end

    it "Googleが失敗を返せば明示的な例外を送出する" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("https://www.google.com/recaptcha/api/siteverify") do
            [ 200, { "Content-Type" => "application/json" }, { success: false, "error-codes": [ "invalid-input-response" ] }.to_json ]
          end
        end
      end
      verifier = described_class.new(secret_key: "test-secret", connection: connection)

      expect { verifier.verify!("invalid-token") }.to raise_error(RecaptchaVerifier::VerificationFailedError)
    end

    it "接続エラーの場合は明示的な例外を送出する" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("https://www.google.com/recaptcha/api/siteverify") { raise Faraday::ConnectionFailed, "refused" }
        end
      end
      verifier = described_class.new(secret_key: "test-secret", connection: connection)

      expect { verifier.verify!("token") }.to raise_error(RecaptchaVerifier::VerificationFailedError)
    end
  end
end
