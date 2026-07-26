import { GoogleIdentityAuth, GoogleIdentityScriptNotLoadedError } from '../../../lib/auth/google-identity';

describe('GoogleIdentityAuth', () => {
  afterEach(() => {
    delete (window as { google?: unknown }).google;
  });

  describe('initialize', () => {
    it('スクリプト未読込(window.google未定義)ならGoogleIdentityScriptNotLoadedErrorを送出する', () => {
      const auth = new GoogleIdentityAuth();
      expect(() => auth.initialize('client-id', () => {})).toThrow(GoogleIdentityScriptNotLoadedError);
    });

    it('window.google.accounts.id.initializeをclient_idとcallbackで1回だけ呼ぶ', () => {
      const initialize = jest.fn();
      (window as any).google = { accounts: { id: { initialize, renderButton: jest.fn() } } };

      const auth = new GoogleIdentityAuth();
      const onCredential = jest.fn();
      auth.initialize('client-id', onCredential);
      auth.initialize('client-id', onCredential);

      expect(initialize).toHaveBeenCalledTimes(1);
      expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-id' }));
    });

    it('GISからのcredentialコールバックを受け取るとonCredentialにidトークンを渡す', () => {
      let registeredCallback: ((response: { credential: string }) => void) | undefined;
      const initialize = jest.fn((config: { callback: (response: { credential: string }) => void }) => {
        registeredCallback = config.callback;
      });
      (window as any).google = { accounts: { id: { initialize, renderButton: jest.fn() } } };

      const auth = new GoogleIdentityAuth();
      const onCredential = jest.fn();
      auth.initialize('client-id', onCredential);
      registeredCallback?.({ credential: 'id-token-value' });

      expect(onCredential).toHaveBeenCalledWith('id-token-value');
    });
  });

  describe('renderButton', () => {
    it('スクリプト未読込ならGoogleIdentityScriptNotLoadedErrorを送出する', () => {
      const auth = new GoogleIdentityAuth();
      const container = document.createElement('div');
      expect(() => auth.renderButton(container)).toThrow(GoogleIdentityScriptNotLoadedError);
    });

    it('window.google.accounts.id.renderButtonにコンテナを渡す', () => {
      const renderButton = jest.fn();
      (window as any).google = { accounts: { id: { initialize: jest.fn(), renderButton } } };

      const auth = new GoogleIdentityAuth();
      const container = document.createElement('div');
      auth.renderButton(container);

      expect(renderButton).toHaveBeenCalledWith(container, expect.any(Object));
    });
  });
});
