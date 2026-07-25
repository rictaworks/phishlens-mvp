require "rails_helper"

RSpec.describe AiQuota, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }

  it "used_countが0または1なら有効" do
    [ 0, 1 ].each do |count|
      quota = AiQuota.new(
        google_sub: user.google_sub,
        quota_date: Date.current,
        used_count: count,
        reset_at: Time.current,
      )
      expect(quota).to be_valid
    end
  end

  it "used_countが0/1以外なら無効" do
    quota = AiQuota.new(
      google_sub: user.google_sub,
      quota_date: Date.current,
      used_count: 2,
      reset_at: Time.current,
    )
    expect(quota).not_to be_valid
  end

  it "userに属する" do
    quota = AiQuota.create!(
      google_sub: user.google_sub,
      quota_date: Date.current,
      used_count: 0,
      reset_at: Time.current,
    )
    expect(quota.user).to eq(user)
  end
end
