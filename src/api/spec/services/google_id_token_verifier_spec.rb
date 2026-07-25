require "rails_helper"

RSpec.describe GoogleIdTokenVerifier, type: :model do
  describe "#verify" do
    it "client_idが未設定なら明示的な例外を送出する" do
      verifier = GoogleIdTokenVerifier.new(client_id: nil)
      expect { verifier.verify("dummy-token") }
        .to raise_error(GoogleIdTokenVerifier::ClientIdNotConfiguredError)
    end

    it "検証に成功した場合はsubを返す" do
      verifier = GoogleIdTokenVerifier.new(client_id: "test-client-id")
      allow(Google::Auth::IDTokens).to receive(:verify_oidc)
        .with("valid-token", aud: "test-client-id")
        .and_return({ "sub" => "google-sub-123", "name" => "山田太郎" })

      expect(verifier.verify("valid-token")).to eq("google-sub-123")
    end

    it "Googleの検証ライブラリが失敗した場合は明示的な例外を送出する" do
      verifier = GoogleIdTokenVerifier.new(client_id: "test-client-id")
      allow(Google::Auth::IDTokens).to receive(:verify_oidc)
        .and_raise(Google::Auth::IDTokens::AudienceMismatchError.new("aud mismatch"))

      expect { verifier.verify("invalid-token") }
        .to raise_error(GoogleIdTokenVerifier::InvalidIdTokenError)
    end
  end
end
