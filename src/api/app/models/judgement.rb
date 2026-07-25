class Judgement < ApplicationRecord
  BODY_SHA256_PATTERN = /\A[0-9a-f]{64}\z/

  belongs_to :user, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :judgements
  belongs_to :judgement_category, foreign_key: :category_code, primary_key: :code, inverse_of: :judgements
  has_many :judgement_reasons, inverse_of: :judgement, dependent: :destroy
  has_many :feedbacks, inverse_of: :judgement, dependent: :destroy

  validates :body_sha256, presence: true, format: { with: BODY_SHA256_PATTERN }
  validates :phishing_score, presence: true,
                              numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :ai_gen_score, numericality: {
    only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100
  }, allow_nil: true
  validates :judged_at, presence: true
  validates :ai_detail_used, inclusion: { in: [ true, false ] }
end
