require "rails_helper"

RSpec.describe BrandDomain, type: :model do
  it "brand_nameとofficial_domainがあれば有効" do
    brand = BrandDomain.new(brand_name: "Amazon", official_domain: "amazon.co.jp")
    expect(brand).to be_valid
  end

  it "official_domainがなければ無効" do
    brand = BrandDomain.new(brand_name: "Amazon", official_domain: nil)
    expect(brand).not_to be_valid
  end
end
