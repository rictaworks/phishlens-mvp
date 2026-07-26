import { API_BASE_URL, RECAPTCHA_SITE_KEY, RecaptchaNotConfiguredError, isRecaptchaConfigured } from '../src/config';

describe('config', () => {
  it('API_BASE_URLはRailway本番URLを指す', () => {
    expect(API_BASE_URL).toBe('https://api-production-b0e7.up.railway.app');
  });

  it('RECAPTCHA_SITE_KEYが設定済みの場合isRecaptchaConfiguredがtrueを返す', () => {
    expect(RECAPTCHA_SITE_KEY.startsWith('REPLACE_WITH_')).toBe(false);
    expect(isRecaptchaConfigured()).toBe(true);
  });

  it('RecaptchaNotConfiguredErrorは設定手順を示すメッセージを持つ', () => {
    const error = new RecaptchaNotConfiguredError();
    expect(error.name).toBe('RecaptchaNotConfiguredError');
    expect(error.message).toContain('RECAPTCHA_SITE_KEY');
  });
});
