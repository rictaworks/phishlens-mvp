# requirements.md 1.4-C/D準拠。
# ルールベース結果とAI詳細判定結果を統合し、総合判定区分を決定する。
class JudgementIntegrator
  RULE_WEIGHT = 0.4
  AI_WEIGHT = 0.6
  SCORE_MIN = 0
  SCORE_MAX = 100

  def integrate_phishing_score(rule_score, ai_score)
    return rule_score if ai_score.nil?

    ((rule_score * RULE_WEIGHT) + (ai_score * AI_WEIGHT)).round.clamp(SCORE_MIN, SCORE_MAX)
  end

  def integrate_ai_gen_score(rule_ai_gen_score:, ai_result_score:)
    ai_result_score || rule_ai_gen_score
  end

  def categorize(phishing_score)
    JudgementCategory.where("threshold_min <= ?", phishing_score).order(threshold_min: :desc).first!
  end
end
