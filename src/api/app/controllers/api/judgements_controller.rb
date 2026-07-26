module Api
  # requirements.md シーケンス図・1.4-C/D準拠。判定リクエストを受け取り、
  # ルールベース判定・AI詳細判定(枠がある場合)を統合して結果を返す。
  class JudgementsController < ApplicationController
    include Authenticatable

    rescue_from ActionController::ParameterMissing, with: :render_bad_request

    def create
      google_sub = current_google_sub
      email = build_email_input

      rule_phishing = RuleBased::PhishingScorer.new(email).score
      rule_ai_style = RuleBased::AiStyleScorer.new(email[:body]).score
      rule_ai_gen_score = rule_ai_style == :unjudgeable ? nil : rule_ai_style[:score]
      rule_ai_reasons = rule_ai_style == :unjudgeable ? [] : rule_ai_style[:reasons]

      quota_manager = QuotaManager.new
      ai_result, ai_detail_used = run_ai_detail_judge(quota_manager, google_sub, email[:body])

      integrator = JudgementIntegrator.new
      final_phishing_score = integrator.integrate_phishing_score(rule_phishing[:score], ai_result&.fetch(:phishing_score, nil))
      final_ai_gen_score = integrator.integrate_ai_gen_score(
        rule_ai_gen_score: rule_ai_gen_score, ai_result_score: ai_result&.fetch(:ai_gen_score, nil),
      )
      category = integrator.categorize(final_phishing_score)
      reasons = rule_phishing[:reasons] + rule_ai_reasons

      judgement = JudgementRepository.new.save_hashed_result(
        google_sub: google_sub,
        body: email[:body],
        phishing_score: final_phishing_score,
        ai_gen_score: final_ai_gen_score,
        category_code: category.code,
        ai_detail_used: ai_detail_used,
        reasons: reasons,
      )

      render json: {
        id: judgement.id,
        category_code: category.code,
        category_label: category.label,
        phishing_score: judgement.phishing_score,
        ai_gen_score: judgement.ai_gen_score,
        reasons: reasons.map { |r| { code: r[:code], delta: r[:delta] } },
        ai_detail_used: ai_detail_used,
        ai_reason_text: ai_result&.fetch(:reason_text, nil),
        quota_available: quota_manager.can_use_today?(google_sub)
      }, status: :created
    end

    private

    def run_ai_detail_judge(quota_manager, google_sub, body)
      return [ nil, false ] unless quota_manager.can_use_today?(google_sub)

      begin
        result = AiDetailJudge.new.analyze(body)
        quota_manager.consume(google_sub)
        [ result, true ]
      rescue AiDetailJudge::ServiceNotConfiguredError, AiDetailJudge::ServiceUnavailableError => e
        Rails.logger.warn("[JudgementsController] AI詳細判定をルールベースへ縮退: #{e.class}: #{e.message}")
        [ nil, false ]
      end
    end

    def build_email_input
      permitted = params.permit(
        :subject, :body, :sender_display_name, :sender_domain,
        auth_headers: %i[spf dkim dmarc],
        links: %i[display_text href],
      )
      permitted.require(:body)
      permitted.require(:sender_domain)

      {
        subject: permitted[:subject].to_s,
        body: permitted[:body],
        sender_display_name: permitted[:sender_display_name].to_s,
        sender_domain: permitted[:sender_domain],
        auth_headers: permitted[:auth_headers]&.to_h&.symbolize_keys,
        links: (permitted[:links] || []).map { |link| link.to_h.symbolize_keys }
      }
    end

    def render_bad_request(error)
      render json: { error: error.message }, status: :bad_request
    end
  end
end
