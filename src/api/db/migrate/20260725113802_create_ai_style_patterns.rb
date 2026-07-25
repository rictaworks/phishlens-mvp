class CreateAiStylePatterns < ActiveRecord::Migration[8.1]
  def change
    create_table :ai_style_patterns do |t|
      t.string :pattern_code, null: false
      t.string :description, null: false
      t.integer :weight, null: false
    end
    add_index :ai_style_patterns, :pattern_code, unique: true
  end
end
