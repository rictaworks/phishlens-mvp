jest.mock('../../src/config', () => {
  const actual = jest.requireActual('../../src/config');
  return {
    ...actual,
    isRecaptchaConfigured: jest.fn(),
  };
});

import { isRecaptchaConfigured, RecaptchaNotConfiguredError } from '../../src/config';
import { getRecaptchaToken } from '../../src/content/recaptcha-client';

const RESPONSE_EVENT = 'phishlens-recaptcha-token-response';

/**
 * recaptcha-client.tsが注入する<script>はjsdom上でも実際に実行される(runScripts既定動作)。
 * そのため、window.grecaptchaへ本物同様のスタブを差し込み、注入スクリプトの実ロジック
 * (grecaptcha.ready→execute→CustomEvent応答)経由でテストする。イベントを直接偽装すると
 * 注入済みスクリプトのリスナーと二重に反応してレースする(2026-07-26に実際に観測)。
 */
interface FakeGrecaptcha {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

function installGrecaptcha(execute: FakeGrecaptcha['execute']): void {
  (window as unknown as { grecaptcha: FakeGrecaptcha }).grecaptcha = {
    ready: (callback) => callback(),
    execute,
  };
}

describe('getRecaptchaToken', () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = '';
    delete (window as { grecaptcha?: unknown }).grecaptcha;
  });

  it('サイトキー未設定時はRecaptchaNotConfiguredErrorでrejectし、DOMへスクリプトを注入しない', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(false);

    await expect(getRecaptchaToken('agree')).rejects.toBeInstanceOf(RecaptchaNotConfiguredError);
    expect(document.getElementById('phishlens-recaptcha-loader')).toBeNull();
  });

  it('設定済みの場合はページへスクリプトを注入し、トークン応答イベントでresolveする', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(true);
    installGrecaptcha(() => Promise.resolve('fake-token'));

    await expect(getRecaptchaToken('agree')).resolves.toBe('fake-token');
    expect(document.getElementById('phishlens-recaptcha-loader')).not.toBeNull();
    expect(document.getElementById('phishlens-recaptcha-executor')).not.toBeNull();
  });

  it('2回目以降の呼び出しではスクリプトを再注入しない', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(true);
    installGrecaptcha(() => Promise.resolve('first-token'));
    await getRecaptchaToken('agree');

    const loaderAfterFirst = document.getElementById('phishlens-recaptcha-loader');

    installGrecaptcha(() => Promise.resolve('second-token'));
    await getRecaptchaToken('dispute');

    expect(document.getElementById('phishlens-recaptcha-loader')).toBe(loaderAfterFirst);
    expect(document.querySelectorAll('#phishlens-recaptcha-loader')).toHaveLength(1);
  });

  it('grecaptchaが読み込まれていない場合は専用メッセージでrejectする', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(true);

    await expect(getRecaptchaToken('dispute')).rejects.toThrow('grecaptchaが読み込まれていません');
  });

  it('grecaptcha.executeが失敗した場合はそのエラーメッセージでrejectする', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(true);
    installGrecaptcha(() => Promise.reject(new Error('execute failed')));

    await expect(getRecaptchaToken('agree')).rejects.toThrow('execute failed');
  });

  it('requestIdが一致しない応答は無視する', async () => {
    (isRecaptchaConfigured as jest.Mock).mockReturnValue(true);
    installGrecaptcha(() => Promise.resolve('correct-token'));

    const promise = getRecaptchaToken('agree');
    window.dispatchEvent(
      new CustomEvent(RESPONSE_EVENT, { detail: { requestId: 'unrelated-id', token: 'wrong-token' } }),
    );
    window.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail: { requestId: 'unrelated-id-2' } }));

    await expect(promise).resolves.toBe('correct-token');
  });
});
