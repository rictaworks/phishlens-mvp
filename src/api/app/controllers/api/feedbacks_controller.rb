module Api
  # requirements.md F6準拠。判定結果への同意/異議フィードバックをreCAPTCHA必須で受け付ける。
  class FeedbacksController < ApplicationController
    include Authenticatable

    rescue_from ActionController::ParameterMissing, with: :render_bad_request
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable
    rescue_from RecaptchaVerifier::NotConfiguredError, with: :render_recaptcha_unavailable
    rescue_from RecaptchaVerifier::VerificationFailedError, with: :render_recaptcha_failed

    def create
      google_sub = current_google_sub
      permitted = build_permitted_params

      RecaptchaVerifier.new.verify!(permitted[:recaptcha_token], remote_ip: request.remote_ip)

      judgement = Judgement.find_by!(id: permitted[:judgement_id], google_sub: google_sub)
      feedback = Feedback.create!(
        judgement: judgement,
        google_sub: google_sub,
        feedback_code: permitted[:feedback_code],
        created_at: Time.current,
      )

      render json: { id: feedback.id, feedback_code: feedback.feedback_code }, status: :created
    end

    private

    def build_permitted_params
      permitted = params.permit(:judgement_id, :feedback_code, :recaptcha_token)
      permitted.require(:judgement_id)
      permitted.require(:feedback_code)
      permitted.require(:recaptcha_token)
      permitted
    end

    def render_bad_request(error)
      render json: { error: error.message }, status: :bad_request
    end

    def render_not_found(_error)
      render json: { error: "対象の判定結果が見つかりません" }, status: :not_found
    end

    def render_unprocessable(error)
      render json: { error: error.message }, status: :unprocessable_content
    end

    def render_recaptcha_unavailable(error)
      render json: { error: error.message }, status: :service_unavailable
    end

    def render_recaptcha_failed(error)
      render json: { error: error.message }, status: :unprocessable_content
    end
  end
end
