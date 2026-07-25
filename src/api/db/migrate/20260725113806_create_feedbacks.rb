class CreateFeedbacks < ActiveRecord::Migration[8.1]
  def change
    create_table :feedbacks do |t|
      t.references :judgement, null: false, foreign_key: true
      t.string :google_sub, null: false
      t.string :feedback_code, null: false
      t.datetime :created_at, null: false
    end
    add_index :feedbacks, :google_sub
    add_foreign_key :feedbacks, :users, column: :google_sub, primary_key: :google_sub
    add_foreign_key :feedbacks, :feedback_categories, column: :feedback_code, primary_key: :code
  end
end
