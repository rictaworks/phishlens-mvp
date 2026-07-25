# requirements.md F7準拠。マスタ(126件)のCRUDをBASIC認証配下で提供する。
module Admin
  class MastersController < BaseController
    REGISTRY = {
      "urgency_keywords" => { model: UrgencyKeyword, params: %i[keyword lang] },
      "brand_domains" => { model: BrandDomain, params: %i[brand_name official_domain] },
      "shortener_domains" => { model: ShortenerDomain, params: %i[domain] },
      "ai_style_patterns" => { model: AiStylePattern, params: %i[pattern_code description weight] },
      "judgement_categories" => { model: JudgementCategory, params: %i[label threshold_min] },
      "feedback_categories" => { model: FeedbackCategory, params: %i[label] }
    }.freeze

    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable
    rescue_from ActionController::ParameterMissing, with: :render_bad_request

    before_action :set_master_config

    def index
      render json: @model_class.all
    end

    def create
      record = @model_class.create!(permitted_params)
      render json: record, status: :created
    end

    def update
      record = @model_class.find(params[:id])
      record.update!(permitted_params)
      render json: record
    end

    def destroy
      record = @model_class.find(params[:id])
      record.destroy!
      head :no_content
    end

    private

    def set_master_config
      config = REGISTRY[params[:master_type]]
      raise ActiveRecord::RecordNotFound, "未知のマスタ種別です: #{params[:master_type]}" if config.nil?

      @model_class = config[:model]
      @permitted_keys = config[:params]
    end

    def permitted_params
      params.require(:master).permit(*@permitted_keys)
    end

    def render_not_found(error)
      render json: { error: error.message }, status: :not_found
    end

    def render_unprocessable(error)
      render json: { error: error.message }, status: :unprocessable_content
    end

    def render_bad_request(error)
      render json: { error: error.message }, status: :bad_request
    end
  end
end
