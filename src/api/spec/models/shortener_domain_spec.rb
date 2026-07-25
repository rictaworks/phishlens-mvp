require "rails_helper"

RSpec.describe ShortenerDomain, type: :model do
  it "domainがあれば有効" do
    expect(ShortenerDomain.new(domain: "example-shortener-test.example")).to be_valid
  end

  it "domainが重複していれば無効" do
    ShortenerDomain.find_or_create_by!(domain: "example-shortener-test.example")
    expect(ShortenerDomain.new(domain: "example-shortener-test.example")).not_to be_valid
  end
end
