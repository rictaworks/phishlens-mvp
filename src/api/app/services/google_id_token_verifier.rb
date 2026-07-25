require "googleauth"
require "googleauth/id_tokens"

# requirements.md 1.2/1.7準拠。Google IDトークンを検証し、opaqueなsub値のみを返す。
# メールアドレス等の他クレームは呼び出し元に一切渡さない。
class GoogleIdTokenVerifier
  class ClientIdNotConfiguredError < StandardError; end
  class InvalidIdTokenError < StandardError; end

  def initialize(client_id: ENV["GOOGLE_OAUTH_CLIENT_ID"])
    @client_id = client_id
  end

  def verify(id_token)
    if @client_id.blank?
      raise ClientIdNotConfiguredError, "GOOGLE_OAUTH_CLIENT_IDが設定されていません"
    end

    begin
      payload = Google::Auth::IDTokens.verify_oidc(id_token, aud: @client_id)
    rescue Google::Auth::IDTokens::VerificationError => e
      raise InvalidIdTokenError, "Google IDトークンの検証に失敗しました: #{e.message}"
    end

    payload.fetch("sub")
  end
end
