# requirements.md F7準拠。管理画面(マスタ管理・AI枠手動リセット)の共通認証。
module Admin
  class BaseController < ApplicationController
    include ActionController::HttpAuthentication::Basic::ControllerMethods

    class AdminNotConfiguredError < StandardError; end

    before_action :ensure_admin_credentials_configured!
    before_action :authenticate_admin!

    rescue_from AdminNotConfiguredError, with: :render_not_configured

    private

    def ensure_admin_credentials_configured!
      if admin_username.blank? || admin_password.blank?
        raise AdminNotConfiguredError, "ADMIN_BASIC_AUTH_USERNAME/ADMIN_BASIC_AUTH_PASSWORDが設定されていません"
      end
    end

    def authenticate_admin!
      authenticate_or_request_with_http_basic("PhishLens Admin") do |username, password|
        secure_compare(username, admin_username) & secure_compare(password, admin_password)
      end
    end

    def secure_compare(a, b)
      ActiveSupport::SecurityUtils.secure_compare(a.to_s, b.to_s)
    end

    def admin_username
      ENV["ADMIN_BASIC_AUTH_USERNAME"]
    end

    def admin_password
      ENV["ADMIN_BASIC_AUTH_PASSWORD"]
    end

    def render_not_configured(error)
      render json: { error: error.message }, status: :service_unavailable
    end
  end
end
