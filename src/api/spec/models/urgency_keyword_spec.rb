require "rails_helper"

RSpec.describe UrgencyKeyword, type: :model do
  it "keywordとlangがあれば有効" do
    keyword = UrgencyKeyword.new(keyword: "至急", lang: "ja")
    expect(keyword).to be_valid
  end

  it "langがja/en以外なら無効" do
    keyword = UrgencyKeyword.new(keyword: "urgent", lang: "fr")
    expect(keyword).not_to be_valid
  end

  it "keywordがなければ無効" do
    keyword = UrgencyKeyword.new(keyword: nil, lang: "ja")
    expect(keyword).not_to be_valid
  end
end
