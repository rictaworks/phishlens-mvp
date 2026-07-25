class CreateBrandDomains < ActiveRecord::Migration[8.1]
  def change
    create_table :brand_domains do |t|
      t.string :brand_name, null: false
      t.string :official_domain, null: false
    end
  end
end
