class CreateUrgencyKeywords < ActiveRecord::Migration[8.1]
  def change
    create_table :urgency_keywords do |t|
      t.string :keyword, null: false
      t.string :lang, null: false
    end
  end
end
