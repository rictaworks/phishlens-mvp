require "rails_helper"

RSpec.describe FeedbackCategory, type: :model do
  it "agree/dispute/unknown以外のcodeは無効" do
    category = FeedbackCategory.new(code: "invalid", label: "無効")
    expect(category).not_to be_valid
  end

  it "agree/dispute/unknownは有効" do
    %w[agree dispute unknown].each do |code|
      category = FeedbackCategory.new(code: code, label: code)
      expect(category).to be_valid
    end
  end
end
