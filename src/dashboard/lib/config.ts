const PLACEHOLDER_PREFIX = 'REPLACE_WITH_';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const GOOGLE_OAUTH_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? `${PLACEHOLDER_PREFIX}GOOGLE_OAUTH_CLIENT_ID`;

export function isGoogleAuthConfigured(): boolean {
  return !GOOGLE_OAUTH_CLIENT_ID.startsWith(PLACEHOLDER_PREFIX);
}

export function isApiBaseUrlConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

export class GoogleAuthNotConfiguredError extends Error {
  constructor() {
    super(
      'Google OAuthクライアントIDが未設定です。src/dashboard/.env.localのNEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_IDを設定してください。',
    );
    this.name = 'GoogleAuthNotConfiguredError';
  }
}

export class ApiBaseUrlNotConfiguredError extends Error {
  constructor() {
    super('APIのベースURLが未設定です。src/dashboard/.env.localのNEXT_PUBLIC_API_BASE_URLを設定してください。');
    this.name = 'ApiBaseUrlNotConfiguredError';
  }
}
