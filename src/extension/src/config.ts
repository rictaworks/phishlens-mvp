/**
 * 拡張全体の設定値。Issue #37準拠。
 * API_BASE_URLはRailway本番URLのハードコード定数とする(将来的にchrome.storage管理へ拡張可能な形)。
 */
export const API_BASE_URL = 'https://api-production-b0e7.up.railway.app';

const PLACEHOLDER_PREFIX = 'REPLACE_WITH_';

/**
 * reCAPTCHA v3のサイトキー。未設定の間はPLACEHOLDER_PREFIXで始まる値のままにしておく
 * (manifest.jsonのoauth2.client_idと同じ「未設定はプレースホルダ」規約)。
 * Issue #46: Google reCAPTCHA管理コンソールで登録した本番用サイトキーに設定済み。
 */
export const RECAPTCHA_SITE_KEY = '6LeL6GYtAAAAACPwHrkzvSlShKnphtLNSVgOjx-3';

export function isRecaptchaConfigured(): boolean {
  return !RECAPTCHA_SITE_KEY.startsWith(PLACEHOLDER_PREFIX);
}

export class RecaptchaNotConfiguredError extends Error {
  constructor() {
    super('reCAPTCHAサイトキーが未設定です。src/config.tsのRECAPTCHA_SITE_KEYを設定してください。');
    this.name = 'RecaptchaNotConfiguredError';
  }
}
