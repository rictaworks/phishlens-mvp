# Be sure to restart your server when you modify this file.
#
# CORS_ALLOWED_ORIGINS(カンマ区切り)が未設定の場合は許可オリジン0件となり、
# ブラウザ拡張/ダッシュボードからのクロスオリジンリクエストは明示的に拒否される
# (規約により無条件のワイルドカード許可はしない)。
allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "").split(",").map(&:strip).reject(&:empty?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/*",
             headers: :any,
             methods: %i[get post options],
             credentials: false
  end
end
