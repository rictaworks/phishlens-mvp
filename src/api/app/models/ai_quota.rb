class AiQuota < ApplicationRecord
  self.primary_key = "google_sub"

  belongs_to :user, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :ai_quota

  validates :quota_date, presence: true
  validates :used_count, inclusion: { in: [ 0, 1 ] }
  validates :reset_at, presence: true
end
