require "rails_helper"

RSpec.describe "Api::Judgements", type: :request do
  before do
    JudgementCategory.find_or_create_by!(code: "danger") { |c| c.label = "危険"; c.threshold_min = 60 }
    JudgementCategory.find_or_create_by!(code: "caution") { |c| c.label = "注意"; c.threshold_min = 30 }
    JudgementCategory.find_or_create_by!(code: "safe") { |c| c.label = "安全"; c.threshold_min = 0 }
  end

  def stub_valid_google_token(sub: "google-sub-1")
    ENV["GOOGLE_OAUTH_CLIENT_ID"] = "test-client-id"
    allow(Google::Auth::IDTokens).to receive(:verify_oidc).and_return({ "sub" => sub })
  end

  def valid_params
    {
      subject: "【重要】アカウントの確認が必要です",
      body: "お客様のアカウントで不審なログインが検出されました。至急ご確認ください。",
      sender_display_name: "Amazon",
      sender_domain: "amaz0n-verify.com",
      auth_headers: { spf: "fail", dkim: "fail", dmarc: "fail" },
      links: []
    }
  end

  describe "POST /api/judgements" do
    it "Authorizationヘッダがなければ401" do
      post "/api/judgements", params: valid_params, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "有効な認証情報であれば判定結果を返し201で保存する" do
      stub_valid_google_token
      BrandDomain.find_or_create_by!(brand_name: "Amazon", official_domain: "amazon.co.jp")

      post "/api/judgements", params: valid_params, headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["category_code"]).to be_present
      expect(body["phishing_score"]).to be_a(Integer)
      expect(body["ai_detail_used"]).to be false
      expect(body["reasons"]).to be_an(Array)

      judgement = Judgement.last
      expect(judgement.google_sub).to eq("google-sub-1")
      expect(judgement.body_sha256).to eq(Digest::SHA256.hexdigest(valid_params[:body]))
      expect(body["id"]).to eq(judgement.id)
    end

    it "本文を保存しない(DBに本文カラムが存在しない)" do
      stub_valid_google_token
      post "/api/judgements", params: valid_params, headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(Judgement.column_names).not_to include("body")
    end

    it "AI_SERVICE_URL未設定のためAI詳細判定は使われずルールベースで確定する" do
      stub_valid_google_token
      post "/api/judgements", params: valid_params, headers: { "Authorization" => "Bearer valid-token" }, as: :json

      body = response.parsed_body
      expect(body["ai_detail_used"]).to be false
      expect(body["quota_available"]).to be true
    end

    it "bodyパラメータがなければ400" do
      stub_valid_google_token
      post "/api/judgements", params: valid_params.except(:body),
                               headers: { "Authorization" => "Bearer valid-token" }, as: :json

      expect(response).to have_http_status(:bad_request)
    end
  end
end
