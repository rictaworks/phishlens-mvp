class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users, primary_key: :google_sub, id: :string do |t|
      t.string :display_name
      t.datetime :created_at, null: false
    end
  end
end
