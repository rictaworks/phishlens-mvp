require "rails_helper"

RSpec.describe QuotaManager, type: :model do
  let(:user) { User.create!(google_sub: "sub-1", created_at: Time.current) }

  def manager_at(jst_time_string)
    fixed_time = Time.find_zone!("Asia/Tokyo").parse(jst_time_string)
    QuotaManager.new(clock: -> { fixed_time })
  end

  describe "#can_use_today?" do
    it "AiQuotaレコードがなければ利用可能" do
      manager = manager_at("2026-07-25 10:00:00")
      expect(manager.can_use_today?(user.google_sub)).to be true
    end

    it "消費済みなら利用不可" do
      manager_at("2026-07-25 10:00:00").consume(user.google_sub)
      expect(manager_at("2026-07-25 20:00:00").can_use_today?(user.google_sub)).to be false
    end

    it "JST03:00をまたぐと自動的に利用可能に戻る" do
      manager_at("2026-07-25 10:00:00").consume(user.google_sub)
      expect(manager_at("2026-07-26 02:59:59").can_use_today?(user.google_sub)).to be false
      expect(manager_at("2026-07-26 03:00:00").can_use_today?(user.google_sub)).to be true
    end
  end

  describe "#consume" do
    it "初回消費は成功しused_countが1になる" do
      manager_at("2026-07-25 10:00:00").consume(user.google_sub)
      quota = AiQuota.find(user.google_sub)
      expect(quota.used_count).to eq(1)
    end

    it "同一枠日内に2回消費するとQuotaAlreadyConsumedErrorを送出する" do
      manager = manager_at("2026-07-25 10:00:00")
      manager.consume(user.google_sub)
      expect { manager.consume(user.google_sub) }.to raise_error(QuotaManager::QuotaAlreadyConsumedError)
    end

    it "JST03:00をまたいだ後は再度消費できる" do
      manager_at("2026-07-25 10:00:00").consume(user.google_sub)
      expect { manager_at("2026-07-26 03:00:00").consume(user.google_sub) }.not_to raise_error
    end
  end

  describe "#manual_reset" do
    it "消費済みでも即座に利用可能へ戻す" do
      manager = manager_at("2026-07-25 10:00:00")
      manager.consume(user.google_sub)
      manager.manual_reset(user.google_sub)
      expect(manager.can_use_today?(user.google_sub)).to be true
    end

    it "AiQuotaレコードが存在しないユーザーにも実行できる" do
      manager = manager_at("2026-07-25 10:00:00")
      expect { manager.manual_reset(user.google_sub) }.not_to raise_error
    end
  end

  describe "#reset_daily_jst_0300" do
    it "枠日が古いAiQuotaレコードをすべてリセットする" do
      manager_at("2026-07-25 10:00:00").consume(user.google_sub)
      other_user = User.create!(google_sub: "sub-2", created_at: Time.current)
      manager_at("2026-07-25 10:00:00").consume(other_user.google_sub)

      manager_at("2026-07-26 03:00:00").reset_daily_jst_0300

      expect(AiQuota.find(user.google_sub).used_count).to eq(0)
      expect(AiQuota.find(other_user.google_sub).used_count).to eq(0)
    end
  end
end
