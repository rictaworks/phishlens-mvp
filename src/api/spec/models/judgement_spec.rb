require "rails_helper"

RSpec.describe Judgement, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }
  let(:category) { JudgementCategory.create!(code: "danger", label: "危険", threshold_min: 60) }

  def build_judgement(overrides = {})
    Judgement.new(
      {
        google_sub: user.google_sub,
        body_sha256: "a" * 64,
        phishing_score: 78,
        ai_gen_score: 65,
        category_code: category.code,
        ai_detail_used: true,
        judged_at: Time.current
      }.merge(overrides),
    )
  end

  it "有効な属性であれば有効" do
    expect(build_judgement).to be_valid
  end

  it "phishing_scoreが0-100の範囲外なら無効" do
    expect(build_judgement(phishing_score: 101)).not_to be_valid
    expect(build_judgement(phishing_score: -1)).not_to be_valid
  end

  it "ai_gen_scoreはnil(判定不能)を許容する" do
    expect(build_judgement(ai_gen_score: nil)).to be_valid
  end

  it "body_sha256が64文字の16進文字列でなければ無効" do
    expect(build_judgement(body_sha256: "short")).not_to be_valid
  end

  it "本文・件名・送信元アドレスに相当するカラムを持たない(requirements.md 1.7準拠)" do
    expect(Judgement.column_names).not_to include("body", "subject", "sender_address")
  end

  it "userとjudgement_categoryに属する" do
    judgement = build_judgement
    judgement.save!
    expect(judgement.user).to eq(user)
    expect(judgement.judgement_category).to eq(category)
  end
end
