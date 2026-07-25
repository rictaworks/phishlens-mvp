require "rails_helper"

RSpec.describe "db:seed", type: :model do
  it "マスタデータ126件を投入する" do
    Rails.application.load_seed

    expect(UrgencyKeyword.count).to eq(30)
    expect(BrandDomain.count).to eq(50)
    expect(ShortenerDomain.count).to eq(20)
    expect(AiStylePattern.count).to eq(20)
    expect(JudgementCategory.count).to eq(3)
    expect(FeedbackCategory.count).to eq(3)
  end

  it "2回実行しても件数が変わらない(冪等)" do
    Rails.application.load_seed
    Rails.application.load_seed

    expect(UrgencyKeyword.count).to eq(30)
  end
end
