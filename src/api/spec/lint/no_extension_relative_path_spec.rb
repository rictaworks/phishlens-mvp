require "rails_helper"

RSpec.describe "src/extension への相対パス参照禁止" do
  # Issue #32, #35: Railwayの api サービスは Root Directory: src/api でデプロイされるため、
  # src/extension は実行環境に存在しない。app/lib/dbの実行コードがこの相対パスに
  # 依存すると本番クラッシュするため、再発防止として静的にgrepで検知する。
  SCAN_DIRS = %w[app lib db].freeze
  FORBIDDEN_PATTERN = /["']\.\.["']\s*,\s*["']extension["']/

  it "app/lib/db配下に \"..\", \"extension\" という相対パス参照が存在しない" do
    offending_lines = SCAN_DIRS.flat_map do |dir|
      Dir.glob(Rails.root.join(dir, "**", "*.rb")).flat_map do |file|
        File.readlines(file).each_with_index.filter_map do |line, index|
          "#{file}:#{index + 1}: #{line.strip}" if line.match?(FORBIDDEN_PATTERN)
        end
      end
    end

    expect(offending_lines).to be_empty, "以下の箇所がsrc/extensionへの相対パス参照に依存しています:\n#{offending_lines.join("\n")}"
  end
end
