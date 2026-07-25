require "rails_helper"

RSpec.describe Feedback, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }
  let(:category) { JudgementCategory.create!(code: "danger", label: "危険", threshold_min: 60) }
  let(:feedback_category) { FeedbackCategory.create!(code: "agree", label: "同意") }
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

  it "有効な属性であれば有効" do
    feedback = Feedback.new(
      judgement: judgement,
      google_sub: user.google_sub,
      feedback_code: feedback_category.code,
      created_at: Time.current,
    )
    expect(feedback).to be_valid
  end

  it "judgement・user・feedback_categoryに属する" do
    feedback = Feedback.create!(
      judgement: judgement,
      google_sub: user.google_sub,
      feedback_code: feedback_category.code,
      created_at: Time.current,
    )
    expect(feedback.judgement).to eq(judgement)
    expect(feedback.user).to eq(user)
    expect(feedback.feedback_category).to eq(feedback_category)
  end
end
