require "rails_helper"

RSpec.describe RequestAuthenticator, type: :model do
  let(:verifier) { instance_double(GoogleIdTokenVerifier) }
  let(:authenticator) { RequestAuthenticator.new(verifier: verifier) }

  describe "#authenticate" do
    it "Authorizationヘッダがなければ明示的な例外を送出する" do
      expect { authenticator.authenticate(nil) }.to raise_error(RequestAuthenticator::MissingTokenError)
    end

    it "Bearer形式でなければ明示的な例外を送出する" do
      expect { authenticator.authenticate("Token abc") }
        .to raise_error(RequestAuthenticator::MissingTokenError)
    end

    it "有効なIDトークンならユーザーを返す(新規作成)" do
      allow(verifier).to receive(:verify).with("valid-token").and_return("google-sub-1")

      expect { authenticator.authenticate("Bearer valid-token") }.to change(User, :count).by(1)
    end

    it "既存ユーザーなら新規作成しない" do
      User.create!(google_sub: "google-sub-1", created_at: Time.current)
      allow(verifier).to receive(:verify).with("valid-token").and_return("google-sub-1")

      expect { authenticator.authenticate("Bearer valid-token") }.not_to change(User, :count)
    end

    it "検証ライブラリの例外はそのまま伝播する" do
      allow(verifier).to receive(:verify).and_raise(GoogleIdTokenVerifier::InvalidIdTokenError, "invalid")

      expect { authenticator.authenticate("Bearer bad-token") }
        .to raise_error(GoogleIdTokenVerifier::InvalidIdTokenError)
    end
  end
end
