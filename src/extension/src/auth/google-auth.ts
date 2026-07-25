const OAUTH_PLACEHOLDER_PREFIX = 'REPLACE_WITH_';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_SCOPE = 'openid';

export class GoogleAuthNotConfiguredError extends Error {
  constructor() {
    super('Google OAuthクライアントIDが未設定です。manifest.jsonのoauth2.client_idを設定してください。');
    this.name = 'GoogleAuthNotConfiguredError';
  }
}

function extractIdTokenFromRedirectUrl(redirectUrl: string): string | null {
  const url = new URL(redirectUrl);
  const fragment = url.hash.startsWith('#') ? url.hash.slice(1) : '';
  const params = new URLSearchParams(fragment || url.search.slice(1));
  return params.get('id_token');
}

function resolveConfiguredClientId(): string {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id;
  if (clientId === undefined || clientId.startsWith(OAUTH_PLACEHOLDER_PREFIX)) {
    throw new GoogleAuthNotConfiguredError();
  }
  return clientId;
}

function buildAuthUrl(clientId: string, redirectUri: string, nonce: string): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', OAUTH_SCOPE);
  url.searchParams.set('nonce', nonce);
  return url.toString();
}

export function getGoogleIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    let clientId: string;
    try {
      clientId = resolveConfiguredClientId();
    } catch (error) {
      reject(error);
      return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const nonce = crypto.randomUUID();
    const authUrl = buildAuthUrl(clientId, redirectUri, nonce);

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError !== undefined || redirectUrl === undefined) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'Google認証に失敗しました'));
        return;
      }

      const idToken = extractIdTokenFromRedirectUrl(redirectUrl);
      if (idToken === null) {
        reject(new Error('リダイレクトURLにIDトークンが含まれていません'));
        return;
      }

      resolve(idToken);
    });
  });
}
