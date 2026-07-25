class ShortenerDomain < ApplicationRecord
  validates :domain, presence: true, uniqueness: true
end
