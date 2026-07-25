class Feedback < ApplicationRecord
  belongs_to :judgement, inverse_of: :feedbacks
  belongs_to :user, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :feedbacks
  belongs_to :feedback_category, foreign_key: :feedback_code, primary_key: :code, inverse_of: :feedbacks

  validates :feedback_code, inclusion: { in: FeedbackCategory::CODES }
end
