require "rails_helper"

RSpec.describe RuleBased::PatternDetectors do
  describe "PHRASE_LISTS_PATH" do
    it "Rails.root配下のパスを参照する(Railwayのapi単体デプロイでも解決できるように)" do
      expect(described_class::PHRASE_LISTS_PATH.to_s).to start_with(Rails.root.to_s)
    end

    it "実ファイルが存在する" do
      expect(File.exist?(described_class::PHRASE_LISTS_PATH)).to be(true)
    end
  end

  describe "PHRASE_LISTS" do
    it "src/extension/config/ai-style-phrase-lists.json と内容が一致する(二重管理の同期漏れ検知)" do
      extension_path = Rails.root.join("..", "extension", "config", "ai-style-phrase-lists.json")
      extension_phrase_lists = JSON.parse(File.read(extension_path))

      expect(described_class::PHRASE_LISTS).to eq(extension_phrase_lists)
    end
  end
end
