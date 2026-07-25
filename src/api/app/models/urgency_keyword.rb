class UrgencyKeyword < ApplicationRecord
  LANGS = %w[ja en].freeze

  validates :keyword, presence: true
  validates :lang, inclusion: { in: LANGS }
end
