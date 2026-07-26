require "rails_helper"

RSpec.describe DashboardKpiCalculator, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }
  let(:other_user) { User.create!(google_sub: "sub-2", created_at: Time.current) }

  before do
    JudgementCategory.find_or_create_by!(code: "safe") { |c| c.label = "安全"; c.threshold_min = 0 }
    FeedbackCategory.find_or_create_by!(code: "agree") { |c| c.label = "同意" }
  end

  def create_judgement(owner, ai_detail_used:, body: "本文")
    JudgementRepository.new.save_hashed_result(
      google_sub: owner.google_sub,
      body: body,
      phishing_score: 10,
      ai_gen_score: 20,
      category_code: "safe",
      ai_detail_used: ai_detail_used,
      reasons: [],
    )
  end

  describe "#call" do
    it "判定が1件もない場合は全項目0を返す" do
      result = DashboardKpiCalculator.new(user.google_sub).call

      expect(result).to eq(judgement_count: 0, quota_usage_rate: 0, feedback_rate: 0)
    end

    it "判定実行数・AI枠消費率・フィードバック率を算出する" do
      create_judgement(user, ai_detail_used: true)
      create_judgement(user, ai_detail_used: true, body: "本文2")
      j3 = create_judgement(user, ai_detail_used: false, body: "本文3")
      create_judgement(user, ai_detail_used: false, body: "本文4")
      Feedback.create!(judgement: j3, google_sub: user.google_sub, feedback_code: "agree", created_at: Time.current)

      result = DashboardKpiCalculator.new(user.google_sub).call

      expect(result).to eq(judgement_count: 4, quota_usage_rate: 50, feedback_rate: 25)
    end

    it "他ユーザーの判定を集計に含めない" do
      create_judgement(user, ai_detail_used: true)
      create_judgement(other_user, ai_detail_used: true)
      create_judgement(other_user, ai_detail_used: true)

      result = DashboardKpiCalculator.new(user.google_sub).call

      expect(result[:judgement_count]).to eq(1)
    end
  end
end
