require "faraday"
require "json"
require "uri"

# requirements.md 1.2/F6準拠。フィードバック送信時にreCAPTCHAを検証する。
class RecaptchaVerifier
  class NotConfiguredError < StandardError; end
  class VerificationFailedError < StandardError; end

  SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
  OPEN_TIMEOUT_SECONDS = 3
  TIMEOUT_SECONDS = 5

  def initialize(secret_key: ENV["RECAPTCHA_SECRET_KEY"], connection: nil)
    @secret_key = secret_key
    @connection = connection
  end

  def verify!(token, remote_ip: nil)
    raise NotConfiguredError, "RECAPTCHA_SECRET_KEYが設定されていません" if @secret_key.blank?
    raise VerificationFailedError, "reCAPTCHAトークンがありません" if token.blank?

    response = http_connection.post(SITEVERIFY_URL) do |req|
      req.headers["Content-Type"] = "application/x-www-form-urlencoded"
      req.body = URI.encode_www_form(secret: @secret_key, response: token, remoteip: remote_ip)
    end

    payload = JSON.parse(response.body)
    unless payload["success"]
      raise VerificationFailedError, "reCAPTCHA検証に失敗しました: #{payload['error-codes']}"
    end

    true
  rescue Faraday::Error => e
    raise VerificationFailedError, "reCAPTCHA検証サービスに接続できませんでした: #{e.message}"
  rescue JSON::ParserError => e
    raise VerificationFailedError, "reCAPTCHA検証サービスの応答を解析できませんでした: #{e.message}"
  end

  private

  def http_connection
    @connection ||= Faraday.new do |f|
      f.options.open_timeout = OPEN_TIMEOUT_SECONDS
      f.options.timeout = TIMEOUT_SECONDS
      f.adapter Faraday.default_adapter
    end
  end
end
