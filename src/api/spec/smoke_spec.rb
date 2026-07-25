require "rails_helper"

RSpec.describe "アプリケーション起動確認" do
  it "Rails環境がテストモードで読み込まれる" do
    expect(Rails.env).to eq("test")
  end
end
