import { act, render, screen } from '@testing-library/react';
import { GoogleSignInButton } from '../../app/components/GoogleSignInButton';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function dispatchScriptLoad() {
  const script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
  script?.dispatchEvent(new Event('load'));
}

describe('GoogleSignInButton', () => {
  let initialize: jest.Mock;
  let renderButton: jest.Mock;

  beforeEach(() => {
    document.querySelectorAll(`script[src="${GIS_SCRIPT_SRC}"]`).forEach((el) => el.remove());
    initialize = jest.fn();
    renderButton = jest.fn();
    (window as any).google = { accounts: { id: { initialize, renderButton } } };
  });

  afterEach(() => {
    delete (window as { google?: unknown }).google;
  });

  it('GISスクリプトを1つだけ挿入する', () => {
    render(<GoogleSignInButton clientId="client-id" onCredential={() => {}} />);

    expect(document.querySelectorAll(`script[src="${GIS_SCRIPT_SRC}"]`).length).toBe(1);
  });

  it('スクリプト読込完了後、initializeとrenderButtonをコンテナに対して呼ぶ', () => {
    render(<GoogleSignInButton clientId="client-id" onCredential={() => {}} />);

    act(() => {
      dispatchScriptLoad();
    });

    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-id' }));
    expect(renderButton).toHaveBeenCalledWith(screen.getByTestId('google-signin-button'), expect.any(Object));
  });

  it('GISのcredentialコールバックをonCredentialへ橋渡しする', () => {
    const onCredential = jest.fn();
    render(<GoogleSignInButton clientId="client-id" onCredential={onCredential} />);

    act(() => {
      dispatchScriptLoad();
    });

    const registeredCallback = initialize.mock.calls[0][0].callback;
    registeredCallback({ credential: 'id-token-value' });

    expect(onCredential).toHaveBeenCalledWith('id-token-value');
  });
});
