require "rails_helper"

RSpec.describe "Admin::Masters", type: :request do
  def basic_auth_header(username, password)
    { "Authorization" => ActionController::HttpAuthentication::Basic.encode_credentials(username, password) }
  end

  around do |example|
    original_username = ENV["ADMIN_BASIC_AUTH_USERNAME"]
    original_password = ENV["ADMIN_BASIC_AUTH_PASSWORD"]
    example.run
    ENV["ADMIN_BASIC_AUTH_USERNAME"] = original_username
    ENV["ADMIN_BASIC_AUTH_PASSWORD"] = original_password
  end

  describe "GET /admin/masters/:master_type" do
    it "認証情報未設定なら503" do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = nil
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = nil

      get "/admin/masters/urgency_keywords"

      expect(response).to have_http_status(:service_unavailable)
    end

    it "未認証なら401" do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"

      get "/admin/masters/urgency_keywords"

      expect(response).to have_http_status(:unauthorized)
    end

    it "誤った認証情報なら401" do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"

      get "/admin/masters/urgency_keywords", headers: basic_auth_header("admin", "wrong")

      expect(response).to have_http_status(:unauthorized)
    end

    it "正しい認証情報なら一覧を返す" do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"
      UrgencyKeyword.create!(keyword: "至急テスト用ワード", lang: "ja")

      get "/admin/masters/urgency_keywords", headers: basic_auth_header("admin", "secret")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.pluck("keyword")).to include("至急テスト用ワード")
    end

    it "未知のマスタ種別は404" do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"

      get "/admin/masters/unknown_master", headers: basic_auth_header("admin", "secret")

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /admin/masters/:master_type" do
    before do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"
    end

    it "マスタレコードを作成する" do
      expect {
        post "/admin/masters/urgency_keywords",
             params: { master: { keyword: "至急テスト用ワード", lang: "ja" } },
             headers: basic_auth_header("admin", "secret"), as: :json
      }.to change(UrgencyKeyword, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "不正な値なら422" do
      post "/admin/masters/urgency_keywords",
           params: { master: { keyword: "至急", lang: "invalid" } },
           headers: basic_auth_header("admin", "secret"), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /admin/masters/:master_type/:id" do
    before do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"
    end

    it "マスタレコードを更新する" do
      keyword = UrgencyKeyword.create!(keyword: "至急", lang: "ja")

      patch "/admin/masters/urgency_keywords/#{keyword.id}",
            params: { master: { keyword: "緊急" } },
            headers: basic_auth_header("admin", "secret"), as: :json

      expect(response).to have_http_status(:ok)
      expect(keyword.reload.keyword).to eq("緊急")
    end
  end

  describe "DELETE /admin/masters/:master_type/:id" do
    before do
      ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
      ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"
    end

    it "マスタレコードを削除する" do
      keyword = UrgencyKeyword.create!(keyword: "至急", lang: "ja")

      delete "/admin/masters/urgency_keywords/#{keyword.id}", headers: basic_auth_header("admin", "secret")

      expect(response).to have_http_status(:no_content)
      expect(UrgencyKeyword.exists?(keyword.id)).to be false
    end
  end
end
