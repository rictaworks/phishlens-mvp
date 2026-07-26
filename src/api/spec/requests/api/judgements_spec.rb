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

  describe "GET /api/judgements" do
    it "Authorizationヘッダがなければ401" do
      get "/api/judgements"

      expect(response).to have_http_status(:unauthorized)
    end

    it "自分の判定履歴のみをスコア・区分・根拠コード・本文ハッシュで返す(本文/件名/送信元は含まない)" do
      stub_valid_google_token(sub: "sub-a")
      User.find_or_create_by!(google_sub: "sub-a") { |u| u.created_at = Time.current }
      User.find_or_create_by!(google_sub: "sub-b") { |u| u.created_at = Time.current }
      judgement = JudgementRepository.new.save_hashed_result(
        google_sub: "sub-a", body: "本文", phishing_score: 78, ai_gen_score: 65,
        category_code: "danger", ai_detail_used: true,
        reasons: [ { code: "AUTH_HEADERS_ANY_FAIL", delta: 30 } ],
      )
      Feedback.create!(judgement: judgement, google_sub: "sub-a", feedback_code: "dispute", created_at: Time.current)

      other_judgement = JudgementRepository.new.save_hashed_result(
        google_sub: "sub-b", body: "他人の本文", phishing_score: 10, ai_gen_score: nil,
        category_code: "safe", ai_detail_used: false, reasons: [],
      )

      get "/api/judgements", headers: { "Authorization" => "Bearer valid-token" }

      expect(response).to have_http_status(:ok)
      rows = response.parsed_body["judgements"]
      expect(rows.length).to eq(1)

      row = rows.first
      expect(row["id"]).to eq(judgement.id)
      expect(row["category_code"]).to eq("danger")
      expect(row["category_label"]).to eq("危険")
      expect(row["phishing_score"]).to eq(78)
      expect(row["ai_gen_score"]).to eq(65)
      expect(row["ai_detail_used"]).to be true
      expect(row["feedback_label"]).to eq("異議")
      expect(row["body_sha256"]).to eq(Digest::SHA256.hexdigest("本文"))
      expect(row["reasons"]).to eq([ { "code" => "AUTH_HEADERS_ANY_FAIL", "delta" => 30 } ])

      returned_ids = rows.map { |r| r["id"] }
      expect(returned_ids).not_to include(other_judgement.id)

      json_text = response.body
      expect(json_text).not_to include("本文")
      expect(json_text).not_to include("他人の本文")
    end

    it "フィードバックがない判定はfeedback_labelがnull" do
      stub_valid_google_token
      User.find_or_create_by!(google_sub: "google-sub-1") { |u| u.created_at = Time.current }
      JudgementRepository.new.save_hashed_result(
        google_sub: "google-sub-1", body: "本文", phishing_score: 5, ai_gen_score: nil,
        category_code: "safe", ai_detail_used: false, reasons: [],
      )

      get "/api/judgements", headers: { "Authorization" => "Bearer valid-token" }

      expect(response.parsed_body["judgements"].first["feedback_label"]).to be_nil
    end
  end

  describe "GET /api/judgements/kpis" do
    it "Authorizationヘッダがなければ401" do
      get "/api/judgements/kpis"

      expect(response).to have_http_status(:unauthorized)
    end

    it "判定実行数・AI枠消費率・フィードバック率を返す" do
      stub_valid_google_token
      User.find_or_create_by!(google_sub: "google-sub-1") { |u| u.created_at = Time.current }
      JudgementRepository.new.save_hashed_result(
        google_sub: "google-sub-1", body: "本文", phishing_score: 5, ai_gen_score: nil,
        category_code: "safe", ai_detail_used: true, reasons: [],
      )

      get "/api/judgements/kpis", headers: { "Authorization" => "Bearer valid-token" }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["judgement_count"]).to eq(1)
      expect(body["quota_usage_rate"]).to eq(100)
      expect(body["feedback_rate"]).to eq(0)
    end
  end
end
