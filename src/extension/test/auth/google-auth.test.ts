import { getGoogleIdToken, GoogleAuthNotConfiguredError } from '../../src/auth/google-auth';

interface FakeChrome {
  runtime: {
    getManifest: () => { oauth2?: { client_id: string; scopes: string[] } };
    lastError?: { message: string };
  };
  identity: {
    getRedirectURL: () => string;
    launchWebAuthFlow: (
      options: { url: string; interactive: boolean },
      callback: (redirectUrl?: string) => void,
    ) => void;
  };
}

function installFakeChrome(overrides: Partial<FakeChrome> = {}): void {
  const defaultChrome: FakeChrome = {
    runtime: {
      getManifest: () => ({ oauth2: { client_id: 'real-client-id.apps.googleusercontent.com', scopes: ['openid'] } }),
    },
    identity: {
      getRedirectURL: () => 'https://abc123.chromiumapp.org/',
      launchWebAuthFlow: (_options, callback) => {
        callback('https://abc123.chromiumapp.org/#id_token=fake-id-token&state=xyz');
      },
    },
  };
  (globalThis as { chrome?: unknown }).chrome = { ...defaultChrome, ...overrides };
}

afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe('getGoogleIdToken', () => {
  it('client_idが未設定(プレースホルダのまま)ならGoogleAuthNotConfiguredErrorでreject', async () => {
    installFakeChrome({
      runtime: {
        getManifest: () => ({
          oauth2: { client_id: 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com', scopes: ['openid'] },
        }),
      },
    });

    await expect(getGoogleIdToken()).rejects.toBeInstanceOf(GoogleAuthNotConfiguredError);
  });

  it('認証に成功した場合はid_tokenでresolveする', async () => {
    installFakeChrome();

    await expect(getGoogleIdToken()).resolves.toBe('fake-id-token');
  });

  it('chrome.runtime.lastErrorがある場合はrejectする', async () => {
    installFakeChrome({
      identity: {
        getRedirectURL: () => 'https://abc123.chromiumapp.org/',
        launchWebAuthFlow: (_options, callback) => {
          callback(undefined);
        },
      },
      runtime: {
        getManifest: () => ({ oauth2: { client_id: 'real-client-id.apps.googleusercontent.com', scopes: ['openid'] } }),
        lastError: { message: 'ユーザーが認証をキャンセルしました' },
      },
    });

    await expect(getGoogleIdToken()).rejects.toThrow('ユーザーが認証をキャンセルしました');
  });

  it('リダイレクトURLにid_tokenが含まれない場合はrejectする', async () => {
    installFakeChrome({
      identity: {
        getRedirectURL: () => 'https://abc123.chromiumapp.org/',
        launchWebAuthFlow: (_options, callback) => {
          callback('https://abc123.chromiumapp.org/#state=xyz');
        },
      },
    });

    await expect(getGoogleIdToken()).rejects.toThrow('IDトークン');
  });
});
