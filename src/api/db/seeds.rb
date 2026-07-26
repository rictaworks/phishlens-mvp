# マスタデータはsrc/extension/config/masters/配下のJSONを正とし、
# Rails側はsrc/api/config/masters/に複製した同一内容を読み込んでシードする
# (apiサービス単体デプロイでもsrc/extensionに依存せず起動できるようにするため。#35)。

require "json"

masters_dir = Rails.root.join("config", "masters")
load_master = lambda { |filename| JSON.parse(File.read(masters_dir.join(filename))) }

load_master.call("urgency-keywords.json").each do |row|
  UrgencyKeyword.find_or_create_by!(keyword: row["keyword"], lang: row["lang"])
end

load_master.call("brand-domains.json").each do |row|
  BrandDomain.find_or_create_by!(brand_name: row["brand_name"], official_domain: row["official_domain"])
end

load_master.call("shortener-domains.json").each do |row|
  ShortenerDomain.find_or_create_by!(domain: row["domain"])
end

load_master.call("ai-style-patterns.json").each do |row|
  AiStylePattern.find_or_create_by!(pattern_code: row["pattern_code"]) do |pattern|
    pattern.description = row["description"]
    pattern.weight = row["weight"]
  end
end

load_master.call("judgement-categories.json").each do |row|
  JudgementCategory.find_or_create_by!(code: row["code"]) do |category|
    category.label = row["label"]
    category.threshold_min = row["threshold_min"]
  end
end

load_master.call("feedback-categories.json").each do |row|
  FeedbackCategory.find_or_create_by!(code: row["code"]) do |category|
    category.label = row["label"]
  end
end
