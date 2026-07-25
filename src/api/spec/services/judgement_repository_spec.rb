require "rails_helper"

RSpec.describe JudgementRepository do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }

  before do
    JudgementCategory.find_or_create_by!(code: "danger") { |c| c.label = "危険"; c.threshold_min = 60 }
  end

  describe "#save_hashed_result" do
    it "本文を保存せずSHA256ハッシュのみ保存する" do
      judgement = described_class.new.save_hashed_result(
        google_sub: user.google_sub,
        body: "秘密の本文です",
        phishing_score: 78,
        ai_gen_score: 65,
        category_code: "danger",
        ai_detail_used: true,
        reasons: [ { code: "AUTH_HEADERS_ANY_FAIL", delta: 30 } ],
      )

      expect(judgement.body_sha256).to eq(Digest::SHA256.hexdigest("秘密の本文です"))
      expect(Judgement.column_names).not_to include("body")
    end

    it "ai_gen_scoreがnilなら判定不能としてNULL保存する" do
      judgement = described_class.new.save_hashed_result(
        google_sub: user.google_sub,
        body: "本文",
        phishing_score: 10,
        ai_gen_score: nil,
        category_code: "danger",
        ai_detail_used: false,
        reasons: [],
      )

      expect(judgement.ai_gen_score).to be_nil
    end

    it "根拠をJudgementReasonとして保存する" do
      judgement = described_class.new.save_hashed_result(
        google_sub: user.google_sub,
        body: "本文",
        phishing_score: 78,
        ai_gen_score: 65,
        category_code: "danger",
        ai_detail_used: true,
        reasons: [
          { code: "AUTH_HEADERS_ANY_FAIL", delta: 30 },
          { code: "URGENCY_KEYWORDS_MATCHED", delta: 15 }
        ],
      )

      expect(judgement.judgement_reasons.count).to eq(2)
      expect(judgement.judgement_reasons.pluck(:reason_code)).to contain_exactly(
        "AUTH_HEADERS_ANY_FAIL", "URGENCY_KEYWORDS_MATCHED",
      )
    end
  end

  describe "#history_by_sub" do
    it "google_subに紐づく判定履歴を新しい順で返す" do
      repo = described_class.new
      first = repo.save_hashed_result(
        google_sub: user.google_sub, body: "1件目", phishing_score: 10,
        ai_gen_score: nil, category_code: "danger", ai_detail_used: false, reasons: [],
      )
      travel_to(1.hour.from_now) do
        @second = repo.save_hashed_result(
          google_sub: user.google_sub, body: "2件目", phishing_score: 20,
          ai_gen_score: nil, category_code: "danger", ai_detail_used: false, reasons: [],
        )
      end

      history = repo.history_by_sub(user.google_sub)

      expect(history.first).to eq(@second)
      expect(history.last).to eq(first)
    end
  end
end
