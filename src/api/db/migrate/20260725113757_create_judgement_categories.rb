class CreateJudgementCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :judgement_categories, primary_key: :code, id: :string do |t|
      t.string :label, null: false
      t.integer :threshold_min, null: false
    end
  end
end
