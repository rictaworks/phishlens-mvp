require "rails_helper"

RSpec.describe JudgementReason, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }
  let(:category) { JudgementCategory.create!(code: "danger", label: "危険", threshold_min: 60) }
  let(:judgement) do
    Judgement.create!(
      google_sub: user.google_sub,
      body_sha256: "a" * 64,
      phishing_score: 78,
      category_code: category.code,
      ai_detail_used: false,
      judged_at: Time.current,
    )
  end

  it "reason_codeとscore_deltaがあれば有効" do
    reason = JudgementReason.new(judgement: judgement, reason_code: "AUTH_HEADERS_ANY_FAIL", score_delta: 30)
    expect(reason).to be_valid
  end

  it "judgementに属する" do
    reason = JudgementReason.create!(judgement: judgement, reason_code: "X", score_delta: 5)
    expect(reason.judgement).to eq(judgement)
  end
end
