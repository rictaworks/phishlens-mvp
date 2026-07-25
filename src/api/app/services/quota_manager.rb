# requirements.md 1.2/1.4-C準拠。AI詳細判定は1日1回/アカウント、
# JST 03:00を境界に枠がリセットされる(開発者による手動リセットも可)。
class QuotaManager
  class QuotaAlreadyConsumedError < StandardError; end

  JST_ZONE_NAME = "Asia/Tokyo"
  RESET_HOUR = 3

  def initialize(clock: -> { Time.current })
    @clock = clock
  end

  def can_use_today?(google_sub)
    quota = AiQuota.find_by(google_sub: google_sub)
    return true if quota.nil?
    return true if stale?(quota)

    quota.used_count.zero?
  end

  def consume(google_sub)
    quota = AiQuota.find_or_initialize_by(google_sub: google_sub)
    reset_quota(quota) if quota.new_record? || stale?(quota)

    raise QuotaAlreadyConsumedError, "本日のAI詳細判定は利用済みです: #{google_sub}" if quota.used_count.positive?

    quota.used_count = 1
    quota.save!
    quota
  end

  def manual_reset(google_sub)
    quota = AiQuota.find_or_initialize_by(google_sub: google_sub)
    reset_quota(quota)
    quota.save!
    quota
  end

  def reset_daily_jst_0300
    AiQuota.find_each do |quota|
      next unless stale?(quota)

      reset_quota(quota)
      quota.save!
    end
  end

  private

  def reset_quota(quota)
    quota.quota_date = current_quota_date
    quota.used_count = 0
    quota.reset_at = now
  end

  def stale?(quota)
    quota.quota_date != current_quota_date
  end

  def current_quota_date
    jst_now = now.in_time_zone(JST_ZONE_NAME)
    boundary = jst_now.change(hour: RESET_HOUR, min: 0, sec: 0)
    (jst_now < boundary ? jst_now - 1.day : jst_now).to_date
  end

  def now
    @clock.call
  end
end
