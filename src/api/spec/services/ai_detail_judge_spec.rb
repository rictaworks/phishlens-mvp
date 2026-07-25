require "rails_helper"

RSpec.describe AiDetailJudge do
  describe "#analyze" do
    it "AI_SERVICE_URL未設定なら明示的な例外を送出する" do
      judge = described_class.new(base_url: nil)
      expect { judge.analyze("本文") }.to raise_error(AiDetailJudge::ServiceNotConfiguredError)
    end

    it "正常応答ならフィッシング意図・AI生成らしさ・根拠文を返す" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("/analyze") do
            [ 200, { "Content-Type" => "application/json" },
             { phishing_score: 70, ai_gen_score: 55, reason_text: "定型的な文面です" }.to_json ]
          end
        end
      end
      judge = described_class.new(base_url: "http://ai-service.test", connection: connection)

      result = judge.analyze("本文")

      expect(result).to eq(phishing_score: 70, ai_gen_score: 55, reason_text: "定型的な文面です")
    end

    it "AIサービスが異常ステータスを返した場合はServiceUnavailableErrorを送出する" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("/analyze") { [ 500, {}, "internal error" ] }
        end
      end
      judge = described_class.new(base_url: "http://ai-service.test", connection: connection)

      expect { judge.analyze("本文") }.to raise_error(AiDetailJudge::ServiceUnavailableError)
    end

    it "接続エラーの場合はServiceUnavailableErrorを送出する" do
      connection = Faraday.new do |f|
        f.adapter :test do |stub|
          stub.post("/analyze") { raise Faraday::ConnectionFailed, "connection refused" }
        end
      end
      judge = described_class.new(base_url: "http://ai-service.test", connection: connection)

      expect { judge.analyze("本文") }.to raise_error(AiDetailJudge::ServiceUnavailableError)
    end
  end
end
