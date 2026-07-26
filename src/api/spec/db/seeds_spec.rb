require "rails_helper"

RSpec.describe "db:seed", type: :model do
  it "マスタデータ126件を投入する" do
    Rails.application.load_seed

    expect(UrgencyKeyword.count).to eq(30)
    expect(BrandDomain.count).to eq(50)
    expect(ShortenerDomain.count).to eq(20)
    expect(AiStylePattern.count).to eq(20)
    expect(JudgementCategory.count).to eq(3)
    expect(FeedbackCategory.count).to eq(3)
  end

  it "2回実行しても件数が変わらない(冪等)" do
    Rails.application.load_seed
    Rails.application.load_seed

    expect(UrgencyKeyword.count).to eq(30)
  end

  it "src/api/config/masters と src/extension/config/masters の内容が一致する(二重管理の同期漏れ検知)" do
    api_masters_dir = Rails.root.join("config", "masters")
    extension_masters_dir = Rails.root.join("..", "extension", "config", "masters")

    filenames = Dir.glob(api_masters_dir.join("*.json")).map { |path| File.basename(path) }
    expect(filenames).not_to be_empty

    filenames.each do |filename|
      api_content = JSON.parse(File.read(api_masters_dir.join(filename)))
      extension_content = JSON.parse(File.read(extension_masters_dir.join(filename)))
      expect(api_content).to eq(extension_content), "#{filename} の内容がsrc/apiとsrc/extensionで一致しません"
    end
  end
end
