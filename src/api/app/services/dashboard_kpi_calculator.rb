# requirements.md 1.8準拠。ダッシュボードKPI(判定実行数・AI枠消費率・フィードバック率)を
# 対象ユーザー(google_sub)の判定履歴のみから算出する。
class DashboardKpiCalculator
  def initialize(google_sub)
    @google_sub = google_sub
  end

  def call
    judgements = Judgement.where(google_sub: @google_sub).includes(:feedbacks).to_a
    count = judgements.size

    {
      judgement_count: count,
      quota_usage_rate: rate(count) { judgements.count(&:ai_detail_used) },
      feedback_rate: rate(count) { judgements.count { |judgement| judgement.feedbacks.any? } }
    }
  end

  private

  def rate(count)
    return 0 if count.zero?

    ((yield.to_f / count) * 100).round
  end
end
