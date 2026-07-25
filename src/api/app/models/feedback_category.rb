class FeedbackCategory < ApplicationRecord
  self.primary_key = "code"

  CODES = %w[agree dispute unknown].freeze

  has_many :feedbacks, foreign_key: :feedback_code, primary_key: :code, inverse_of: :feedback_category

  validates :code, inclusion: { in: CODES }
  validates :label, presence: true
end
