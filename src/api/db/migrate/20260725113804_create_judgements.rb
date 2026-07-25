class CreateJudgements < ActiveRecord::Migration[8.1]
  def change
    create_table :judgements do |t|
      t.string :google_sub, null: false
      t.string :body_sha256, null: false
      t.integer :phishing_score, null: false
      t.integer :ai_gen_score
      t.string :category_code, null: false
      t.boolean :ai_detail_used, null: false, default: false
      t.datetime :judged_at, null: false
    end
    add_index :judgements, :google_sub
    add_index :judgements, :body_sha256
    add_foreign_key :judgements, :users, column: :google_sub, primary_key: :google_sub
    add_foreign_key :judgements, :judgement_categories, column: :category_code, primary_key: :code
  end
end
