require "digest"

# requirements.md 1.7準拠。本文は一切保存せずSHA256ハッシュのみを永続化する。
class JudgementRepository
  def save_hashed_result(google_sub:, body:, phishing_score:, ai_gen_score:, category_code:, ai_detail_used:, reasons:)
    judgement = Judgement.create!(
      google_sub: google_sub,
      body_sha256: Digest::SHA256.hexdigest(body),
      phishing_score: phishing_score,
      ai_gen_score: ai_gen_score,
      category_code: category_code,
      ai_detail_used: ai_detail_used,
      judged_at: Time.current,
    )
    reasons.each do |reason|
      judgement.judgement_reasons.create!(reason_code: reason[:code], score_delta: reason[:delta])
    end
    judgement
  end

  def history_by_sub(google_sub)
    Judgement.where(google_sub: google_sub).order(judged_at: :desc)
  end
end
