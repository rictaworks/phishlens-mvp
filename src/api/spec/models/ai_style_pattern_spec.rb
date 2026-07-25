require "rails_helper"

RSpec.describe AiStylePattern, type: :model do
  it "weightが10〜20の範囲なら有効" do
    pattern = AiStylePattern.new(pattern_code: "test_pattern", description: "テスト", weight: 15)
    expect(pattern).to be_valid
  end

  it "weightが範囲外なら無効" do
    pattern = AiStylePattern.new(pattern_code: "test_pattern", description: "テスト", weight: 5)
    expect(pattern).not_to be_valid
  end

  it "pattern_codeが重複していれば無効" do
    AiStylePattern.create!(pattern_code: "dup", description: "テスト", weight: 10)
    expect(AiStylePattern.new(pattern_code: "dup", description: "テスト2", weight: 10)).not_to be_valid
  end
end
