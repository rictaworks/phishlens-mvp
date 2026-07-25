class JudgementCategory < ApplicationRecord
  self.primary_key = "code"

  CODES = %w[danger caution safe].freeze

  has_many :judgements, foreign_key: :category_code, primary_key: :code, inverse_of: :judgement_category

  validates :code, inclusion: { in: CODES }
  validates :label, presence: true
  validates :threshold_min, presence: true,
                             numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
