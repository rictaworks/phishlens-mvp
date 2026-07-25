require "rails_helper"

RSpec.describe JudgementIntegrator do
  before do
    JudgementCategory.find_or_create_by!(code: "danger") { |c| c.label = "危険"; c.threshold_min = 60 }
    JudgementCategory.find_or_create_by!(code: "caution") { |c| c.label = "注意"; c.threshold_min = 30 }
    JudgementCategory.find_or_create_by!(code: "safe") { |c| c.label = "安全"; c.threshold_min = 0 }
  end

  describe "#categorize" do
    it "60以上はdanger" do
      expect(described_class.new.categorize(60).code).to eq("danger")
      expect(described_class.new.categorize(100).code).to eq("danger")
    end

    it "30〜59はcaution" do
      expect(described_class.new.categorize(30).code).to eq("caution")
      expect(described_class.new.categorize(59).code).to eq("caution")
    end

    it "30未満はsafe" do
      expect(described_class.new.categorize(0).code).to eq("safe")
      expect(described_class.new.categorize(29).code).to eq("safe")
    end
  end

  describe "#integrate_phishing_score" do
    it "AI結果がなければルールベーススコアをそのまま使う" do
      expect(described_class.new.integrate_phishing_score(78, nil)).to eq(78)
    end

    it "AI結果があればルール0.4+AI0.6で統合する" do
      # 40 * 0.4 + 80 * 0.6 = 64
      expect(described_class.new.integrate_phishing_score(40, 80)).to eq(64)
    end

    it "統合結果は0-100にクリップする" do
      expect(described_class.new.integrate_phishing_score(100, 100)).to eq(100)
      expect(described_class.new.integrate_phishing_score(0, 0)).to eq(0)
    end
  end

  describe "#integrate_ai_gen_score" do
    it "AI結果のai_gen_scoreがあればそれを優先する" do
      expect(described_class.new.integrate_ai_gen_score(rule_ai_gen_score: 20, ai_result_score: 55)).to eq(55)
    end

    it "AI結果がなければルールベースの値を使う" do
      expect(described_class.new.integrate_ai_gen_score(rule_ai_gen_score: 20, ai_result_score: nil)).to eq(20)
    end

    it "どちらもなければnil(判定不能)" do
      expect(described_class.new.integrate_ai_gen_score(rule_ai_gen_score: nil, ai_result_score: nil)).to be_nil
    end
  end
end
