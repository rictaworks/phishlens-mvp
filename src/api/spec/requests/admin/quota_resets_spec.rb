require "rails_helper"

RSpec.describe "Admin::QuotaResets", type: :request do
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

  before do
    ENV["ADMIN_BASIC_AUTH_USERNAME"] = "admin"
    ENV["ADMIN_BASIC_AUTH_PASSWORD"] = "secret"
  end

  describe "POST /admin/quota_resets" do
    it "未認証なら401" do
      post "/admin/quota_resets", params: { google_sub: "sub-1" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "AI枠を手動リセットする" do
      user = User.create!(google_sub: "sub-1", created_at: Time.current)
      AiQuota.create!(google_sub: user.google_sub, quota_date: Date.current, used_count: 1, reset_at: Time.current)

      post "/admin/quota_resets",
           params: { google_sub: user.google_sub },
           headers: basic_auth_header("admin", "secret"), as: :json

      expect(response).to have_http_status(:created)
      expect(AiQuota.find(user.google_sub).used_count).to eq(0)
    end

    it "存在しないユーザーなら404" do
      post "/admin/quota_resets",
           params: { google_sub: "unknown-sub" },
           headers: basic_auth_header("admin", "secret"), as: :json

      expect(response).to have_http_status(:not_found)
    end

    it "google_subパラメータがなければ400" do
      post "/admin/quota_resets", params: {}, headers: basic_auth_header("admin", "secret"), as: :json

      expect(response).to have_http_status(:bad_request)
    end
  end
end
