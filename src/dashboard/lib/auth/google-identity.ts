export class GoogleIdentityScriptNotLoadedError extends Error {
  constructor() {
    super('Google Identity Servicesスクリプトが読み込まれていません。');
    this.name = 'GoogleIdentityScriptNotLoadedError';
  }
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const BUTTON_OPTIONS = { theme: 'outline', size: 'large', text: 'signin_with' } as const;

/**
 * Google Identity Services(GIS) accounts.id SDKの薄いラッパー。
 * 拡張がchrome.identityで取得するのと同じGoogle IDトークン(JWT)を、
 * 通常のWebページから取得するための標準的な手段(#45)。
 */
export class GoogleIdentityAuth {
  private initialized = false;

  initialize(clientId: string, onCredential: (idToken: string) => void): void {
    if (this.initialized) {
      return;
    }
    if (window.google === undefined) {
      throw new GoogleIdentityScriptNotLoadedError();
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
    });
    this.initialized = true;
  }

  renderButton(container: HTMLElement): void {
    if (window.google === undefined) {
      throw new GoogleIdentityScriptNotLoadedError();
    }

    window.google.accounts.id.renderButton(container, BUTTON_OPTIONS);
  }
}
