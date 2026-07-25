class BrandDomain < ApplicationRecord
  validates :brand_name, presence: true
  validates :official_domain, presence: true
end
