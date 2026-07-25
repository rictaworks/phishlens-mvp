require "rails_helper"

RSpec.describe "Api::Feedbacks", type: :request do
  let(:user) { User.create!(google_sub: "google-sub-1", created_at: Time.current) }
  let(:other_user) { User.create!(google_sub: "google-sub-2", created_at: Time.current) }
  let(:category) do
    JudgementCategory.find_or_create_by!(code: "danger") { |c| c.label = "危険"; c.threshold_min = 60 }
  end
  let(:judgement) do
    Judgement.create!(
      google_sub: user.google_sub,
      body_sha256: "a" * 64,
      phishing_score: 78,
      category_code: category.code,
      ai_detail_used: false,
      judged_at: Time.current,
    )
  end

  def stub_valid_google_token(sub:)
    ENV["GOOGLE_OAUTH_CLIENT_ID"] = "test-client-id"
    allow(Google::Auth::IDTokens).to receive(:verify_oidc).and_return({ "sub" => sub })
  end

  def stub_recaptcha(success:)
    ENV["RECAPTCHA_SECRET_KEY"] = "test-secret"
    verifier = instance_double(RecaptchaVerifier)
    allow(RecaptchaVerifier).to receive(:new).and_return(verifier)
    if success
      allow(verifier).to receive(:verify!).and_return(true)
    else
      allow(verifier).to receive(:verify!).and_raise(RecaptchaVerifier::VerificationFailedError, "failed")
    end
  end

  describe "POST /api/feedbacks" do
    it "Authorizationヘッダがなければ401" do
      post "/api/feedbacks", params: { judgement_id: judgement.id, feedback_code: "agree", recaptcha_token: "t" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "reCAPTCHA検証に成功すればフィードバックを保存し201を返す" do
      stub_valid_google_token(sub: user.google_sub)
      stub_recaptcha(success: true)

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "agree", recaptcha_token: "valid-token" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:created)
      expect(Feedback.count).to eq(1)
      expect(Feedback.last.feedback_code).to eq("agree")
      expect(Feedback.last.google_sub).to eq(user.google_sub)
    end

    it "reCAPTCHA検証に失敗すれば422を返し保存しない" do
      stub_valid_google_token(sub: user.google_sub)
      stub_recaptcha(success: false)

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "agree", recaptcha_token: "bad-token" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(Feedback.count).to eq(0)
    end

    it "RECAPTCHA_SECRET_KEY未設定なら503を返す" do
      stub_valid_google_token(sub: user.google_sub)
      ENV["RECAPTCHA_SECRET_KEY"] = nil

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "agree", recaptcha_token: "t" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:service_unavailable)
    end

    it "他ユーザーの判定へのフィードバックは404" do
      stub_valid_google_token(sub: other_user.google_sub)
      stub_recaptcha(success: true)

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "agree", recaptcha_token: "t" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:not_found)
      expect(Feedback.count).to eq(0)
    end

    it "feedback_codeが不正なら422を返す" do
      stub_valid_google_token(sub: user.google_sub)
      stub_recaptcha(success: true)

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "invalid", recaptcha_token: "t" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "recaptcha_tokenパラメータがなければ400" do
      stub_valid_google_token(sub: user.google_sub)

      post "/api/feedbacks",
           params: { judgement_id: judgement.id, feedback_code: "agree" },
           headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:bad_request)
    end
  end
end
