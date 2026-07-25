require "rails_helper"

RSpec.describe JudgementCategory, type: :model do
  it "danger/caution/safe以外のcodeは無効" do
    category = JudgementCategory.new(code: "unknown", label: "不明", threshold_min: 0)
    expect(category).not_to be_valid
  end

  it "danger/caution/safeは有効" do
    %w[danger caution safe].each do |code|
      category = JudgementCategory.new(code: code, label: code, threshold_min: 0)
      expect(category).to be_valid
    end
  end
end
