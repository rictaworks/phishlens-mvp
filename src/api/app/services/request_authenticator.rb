# requirements.md 1.2/1.7準拠。Authorization: Bearer <GoogleIDトークン> を検証し、
# opaqueなgoogle_subに対応するUserを取得(なければ作成)する。
class RequestAuthenticator
  class MissingTokenError < StandardError; end

  BEARER_PREFIX = "Bearer "

  def initialize(verifier: GoogleIdTokenVerifier.new)
    @verifier = verifier
  end

  def authenticate(authorization_header)
    if authorization_header.blank? || !authorization_header.start_with?(BEARER_PREFIX)
      raise MissingTokenError, "Authorizationヘッダは 'Bearer <Google IDトークン>' 形式である必要があります"
    end

    id_token = authorization_header.delete_prefix(BEARER_PREFIX)
    google_sub = @verifier.verify(id_token)
    User.find_or_create_by!(google_sub: google_sub) { |user| user.created_at = Time.current }
  end
end
