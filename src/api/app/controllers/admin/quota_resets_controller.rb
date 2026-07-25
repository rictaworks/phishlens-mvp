# requirements.md F7準拠。開発者がAI枠を手動リセットする。
module Admin
  class QuotaResetsController < BaseController
    rescue_from ActionController::ParameterMissing, with: :render_bad_request
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    def create
      google_sub = params.require(:google_sub)
      User.find_by!(google_sub: google_sub)
      quota = QuotaManager.new.manual_reset(google_sub)

      render json: {
        google_sub: quota.google_sub,
        used_count: quota.used_count,
        reset_at: quota.reset_at
      }, status: :created
    end

    private

    def render_bad_request(error)
      render json: { error: error.message }, status: :bad_request
    end

    def render_not_found(_error)
      render json: { error: "対象のユーザーが見つかりません" }, status: :not_found
    end
  end
end
