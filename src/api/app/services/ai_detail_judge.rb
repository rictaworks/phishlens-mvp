require "faraday"
require "json"

# requirements.md 1.4-C準拠。FastAPI(#10)のAI詳細判定サービスへ本文を送信する。
# 本文はオンメモリで送信するのみでこのクラス自体は何も保存・ログ出力しない。
class AiDetailJudge
  class ServiceNotConfiguredError < StandardError; end
  class ServiceUnavailableError < StandardError; end

  ANALYZE_PATH = "/analyze"
  OPEN_TIMEOUT_SECONDS = 3
  TIMEOUT_SECONDS = 10

  def initialize(base_url: ENV["AI_SERVICE_URL"], connection: nil)
    @base_url = base_url
    @connection = connection
  end

  def analyze(body)
    raise ServiceNotConfiguredError, "AI_SERVICE_URLが設定されていません" if @base_url.blank?

    response = http_connection.post(ANALYZE_PATH) do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = { body: body }.to_json
    end

    unless response.success?
      raise ServiceUnavailableError, "AI判定サービスがエラーを返しました(status=#{response.status})"
    end

    payload = JSON.parse(response.body)
    {
      phishing_score: payload.fetch("phishing_score"),
      ai_gen_score: payload["ai_gen_score"],
      reason_text: payload["reason_text"]
    }
  rescue Faraday::Error => e
    raise ServiceUnavailableError, "AI判定サービスに接続できませんでした: #{e.message}"
  rescue JSON::ParserError => e
    raise ServiceUnavailableError, "AI判定サービスの応答を解析できませんでした: #{e.message}"
  end

  private

  def http_connection
    @connection ||= Faraday.new(url: @base_url) do |f|
      f.options.open_timeout = OPEN_TIMEOUT_SECONDS
      f.options.timeout = TIMEOUT_SECONDS
      f.adapter Faraday.default_adapter
    end
  end
end
