import {
  API_BASE_URL,
  GOOGLE_OAUTH_CLIENT_ID,
  GoogleAuthNotConfiguredError,
  isApiBaseUrlConfigured,
  isGoogleAuthConfigured,
} from '../../lib/config';

describe('config', () => {
  it('NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_IDが未設定(プレースホルダ)の間はisGoogleAuthConfiguredがfalseを返す', () => {
    expect(GOOGLE_OAUTH_CLIENT_ID.startsWith('REPLACE_WITH_')).toBe(true);
    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it('GoogleAuthNotConfiguredErrorは設定手順を示すメッセージを持つ', () => {
    const error = new GoogleAuthNotConfiguredError();
    expect(error.name).toBe('GoogleAuthNotConfiguredError');
    expect(error.message).toContain('NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID');
  });

  it('NEXT_PUBLIC_API_BASE_URLが未設定の間はisApiBaseUrlConfiguredがfalseを返す', () => {
    expect(API_BASE_URL).toBe('');
    expect(isApiBaseUrlConfigured()).toBe(false);
  });
});
