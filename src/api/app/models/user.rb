class User < ApplicationRecord
  self.primary_key = "google_sub"

  has_many :judgements, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :user
  has_many :feedbacks, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :user
  has_one :ai_quota, foreign_key: :google_sub, primary_key: :google_sub, inverse_of: :user

  validates :google_sub, presence: true
end
