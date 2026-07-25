class AiStylePattern < ApplicationRecord
  MIN_WEIGHT = 10
  MAX_WEIGHT = 20

  validates :pattern_code, presence: true, uniqueness: true
  validates :description, presence: true
  validates :weight, numericality: {
    only_integer: true, greater_than_or_equal_to: MIN_WEIGHT, less_than_or_equal_to: MAX_WEIGHT
  }
end
