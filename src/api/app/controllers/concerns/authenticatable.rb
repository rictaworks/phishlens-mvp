# requirements.md 1.2/1.7準拠。judgements等の認証必須APIで include して使う。
# 実際のHTTPリクエストを通した検証は、これを利用する各コントローラの
# request specで行う(RequestAuthenticator/GoogleIdTokenVerifierは単体テスト済み)。
module Authenticatable
  extend ActiveSupport::Concern

  included do
    rescue_from RequestAuthenticator::MissingTokenError, with: :render_unauthorized
    rescue_from GoogleIdTokenVerifier::ClientIdNotConfiguredError, with: :render_unauthorized
    rescue_from GoogleIdTokenVerifier::InvalidIdTokenError, with: :render_unauthorized
  end

  def current_google_sub
    @current_user ||= RequestAuthenticator.new.authenticate(request.headers["Authorization"])
    @current_user.google_sub
  end

  private

  def render_unauthorized(error)
    render json: { error: error.message }, status: :unauthorized
  end
end
