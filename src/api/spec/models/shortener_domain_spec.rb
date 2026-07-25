require "rails_helper"

RSpec.describe ShortenerDomain, type: :model do
  it "domainがあれば有効" do
    expect(ShortenerDomain.new(domain: "bit.ly")).to be_valid
  end

  it "domainが重複していれば無効" do
    ShortenerDomain.create!(domain: "bit.ly")
    expect(ShortenerDomain.new(domain: "bit.ly")).not_to be_valid
  end
end
