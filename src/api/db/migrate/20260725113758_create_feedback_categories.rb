class CreateFeedbackCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :feedback_categories, primary_key: :code, id: :string do |t|
      t.string :label, null: false
    end
  end
end
