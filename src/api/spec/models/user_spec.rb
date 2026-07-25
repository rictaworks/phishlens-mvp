require "rails_helper"

RSpec.describe User, type: :model do
  it "google_subがあれば有効" do
    user = User.new(google_sub: "sub-123", created_at: Time.current)
    expect(user).to be_valid
  end

  it "google_subがなければ無効" do
    user = User.new(google_sub: nil, created_at: Time.current)
    expect(user).not_to be_valid
  end

  it "メールアドレス等の個人情報カラムを持たない(requirements.md 1.7準拠)" do
    expect(User.column_names).not_to include("email")
  end

  it "judgementsを複数保有できる" do
    expect(User.new.respond_to?(:judgements)).to be true
  end
end
