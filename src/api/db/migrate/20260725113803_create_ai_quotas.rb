class CreateAiQuotas < ActiveRecord::Migration[8.1]
  def change
    create_table :ai_quotas, primary_key: :google_sub, id: :string do |t|
      t.date :quota_date, null: false
      t.integer :used_count, null: false, default: 0
      t.datetime :reset_at, null: false
    end
    add_foreign_key :ai_quotas, :users, column: :google_sub, primary_key: :google_sub
  end
end
