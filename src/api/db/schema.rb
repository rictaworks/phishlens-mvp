# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_25_113806) do
  create_table "ai_quotas", primary_key: "google_sub", id: :string, force: :cascade do |t|
    t.date "quota_date", null: false
    t.datetime "reset_at", null: false
    t.integer "used_count", default: 0, null: false
  end

  create_table "ai_style_patterns", force: :cascade do |t|
    t.string "description", null: false
    t.string "pattern_code", null: false
    t.integer "weight", null: false
    t.index ["pattern_code"], name: "index_ai_style_patterns_on_pattern_code", unique: true
  end

  create_table "brand_domains", force: :cascade do |t|
    t.string "brand_name", null: false
    t.string "official_domain", null: false
  end

  create_table "feedback_categories", primary_key: "code", id: :string, force: :cascade do |t|
    t.string "label", null: false
  end

  create_table "feedbacks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "feedback_code", null: false
    t.string "google_sub", null: false
    t.integer "judgement_id", null: false
    t.index ["google_sub"], name: "index_feedbacks_on_google_sub"
    t.index ["judgement_id"], name: "index_feedbacks_on_judgement_id"
  end

  create_table "judgement_categories", primary_key: "code", id: :string, force: :cascade do |t|
    t.string "label", null: false
    t.integer "threshold_min", null: false
  end

  create_table "judgement_reasons", force: :cascade do |t|
    t.integer "judgement_id", null: false
    t.string "reason_code", null: false
    t.integer "score_delta", null: false
    t.index ["judgement_id"], name: "index_judgement_reasons_on_judgement_id"
  end

  create_table "judgements", force: :cascade do |t|
    t.boolean "ai_detail_used", default: false, null: false
    t.integer "ai_gen_score"
    t.string "body_sha256", null: false
    t.string "category_code", null: false
    t.string "google_sub", null: false
    t.datetime "judged_at", null: false
    t.integer "phishing_score", null: false
    t.index ["body_sha256"], name: "index_judgements_on_body_sha256"
    t.index ["google_sub"], name: "index_judgements_on_google_sub"
  end

  create_table "shortener_domains", force: :cascade do |t|
    t.string "domain", null: false
    t.index ["domain"], name: "index_shortener_domains_on_domain", unique: true
  end

  create_table "urgency_keywords", force: :cascade do |t|
    t.string "keyword", null: false
    t.string "lang", null: false
  end

  create_table "users", primary_key: "google_sub", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name"
  end

  add_foreign_key "ai_quotas", "users", column: "google_sub", primary_key: "google_sub"
  add_foreign_key "feedbacks", "feedback_categories", column: "feedback_code", primary_key: "code"
  add_foreign_key "feedbacks", "judgements"
  add_foreign_key "feedbacks", "users", column: "google_sub", primary_key: "google_sub"
  add_foreign_key "judgement_reasons", "judgements"
  add_foreign_key "judgements", "judgement_categories", column: "category_code", primary_key: "code"
  add_foreign_key "judgements", "users", column: "google_sub", primary_key: "google_sub"
end
