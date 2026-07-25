class CreateShortenerDomains < ActiveRecord::Migration[8.1]
  def change
    create_table :shortener_domains do |t|
      t.string :domain, null: false
    end
    add_index :shortener_domains, :domain, unique: true
  end
end
