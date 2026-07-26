import { API_BASE_URL, RECAPTCHA_SITE_KEY, RecaptchaNotConfiguredError, isRecaptchaConfigured } from '../src/config';

describe('config', () => {
  it('API_BASE_URLはRailway本番URLを指す', () => {
    expect(API_BASE_URL).toBe('https://api-production-b0e7.up.railway.app');
  });

  it('RECAPTCHA_SITE_KEYが未設定(プレースホルダ)の間はisRecaptchaConfiguredがfalseを返す', () => {
    expect(RECAPTCHA_SITE_KEY.startsWith('REPLACE_WITH_')).toBe(true);
    expect(isRecaptchaConfigured()).toBe(false);
  });

  it('RecaptchaNotConfiguredErrorは設定手順を示すメッセージを持つ', () => {
    const error = new RecaptchaNotConfiguredError();
    expect(error.name).toBe('RecaptchaNotConfiguredError');
    expect(error.message).toContain('RECAPTCHA_SITE_KEY');
  });
});
