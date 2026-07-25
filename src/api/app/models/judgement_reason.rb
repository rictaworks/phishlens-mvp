class JudgementReason < ApplicationRecord
  belongs_to :judgement, inverse_of: :judgement_reasons

  validates :reason_code, presence: true
  validates :score_delta, presence: true, numericality: { only_integer: true }
end
