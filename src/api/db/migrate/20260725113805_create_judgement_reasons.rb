class CreateJudgementReasons < ActiveRecord::Migration[8.1]
  def change
    create_table :judgement_reasons do |t|
      t.references :judgement, null: false, foreign_key: true
      t.string :reason_code, null: false
      t.integer :score_delta, null: false
    end
  end
end
