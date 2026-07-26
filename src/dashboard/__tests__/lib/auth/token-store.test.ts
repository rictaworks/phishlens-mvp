import { clearIdToken, getIdToken, isTokenExpired, setIdToken } from '../../../lib/auth/token-store';

function buildJwt(payload: Record<string, unknown>): string {
  const base64UrlEncode = (value: string) =>
    Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('token-store', () => {
  afterEach(() => {
    clearIdToken();
  });

  it('setIdToken/getIdTokenでsessionStorageに保存・取得できる', () => {
    setIdToken('sample-token');
    expect(getIdToken()).toBe('sample-token');
  });

  it('clearIdTokenでトークンを削除する', () => {
    setIdToken('sample-token');
    clearIdToken();
    expect(getIdToken()).toBeNull();
  });

  it('未保存の場合はnullを返す', () => {
    expect(getIdToken()).toBeNull();
  });

  describe('isTokenExpired', () => {
    it('exp claimが未来なら false', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      expect(isTokenExpired(buildJwt({ exp: futureExp }))).toBe(false);
    });

    it('exp claimが過去なら true', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      expect(isTokenExpired(buildJwt({ exp: pastExp }))).toBe(true);
    });

    it('exp claimが無い/不正な形式なら true(安全側)', () => {
      expect(isTokenExpired(buildJwt({}))).toBe(true);
      expect(isTokenExpired('not-a-jwt')).toBe(true);
    });
  });
});
