jest.mock('../src/extraction/email-extractor', () => {
  const actual = jest.requireActual('../src/extraction/email-extractor');
  return {
    ...actual,
    EmailExtractor: jest.fn(),
  };
});
jest.mock('../src/content/recaptcha-client', () => ({
  getRecaptchaToken: jest.fn(),
}));

import { EmailExtractionError, EmailExtractor } from '../src/extraction/email-extractor';
import { getRecaptchaToken } from '../src/content/recaptcha-client';
import {
  EmailJudgementController,
  buildRuleBasedResult,
  categorize,
  normalizeApiResult,
} from '../src/content';
import type { ScoringEmailInput } from '../src/scoring/types';
import type { JudgementApiResult } from '../src/api/judgement-client';

describe('categorize', () => {
  it.each([
    [0, 'safe'],
    [29, 'safe'],
    [30, 'caution'],
    [59, 'caution'],
    [60, 'danger'],
    [100, 'danger'],
  ])('score=%iはcategory=%sを返す(境界値)', (score, expected) => {
    expect(categorize(score as number)).toBe(expected);
  });
});

describe('buildRuleBasedResult', () => {
  it('AI判定不能な短文の場合、quotaUsed/feedbackGivenは常にfalseでカテゴリはスコアと整合する', () => {
    const email: ScoringEmailInput = {
      subject: '件名',
      body: '本文',
      senderDisplayName: '送信者',
      senderDomain: 'example.com',
      authHeaders: null,
      links: [],
    };

    const result = buildRuleBasedResult(email);

    expect(result.aiGenScore).toBe('unjudgeable');
    expect(result.quotaUsed).toBe(false);
    expect(result.feedbackGiven).toBe(false);
    expect(result.categoryCode).toBe(categorize(result.phishingScore));
  });
});

describe('normalizeApiResult', () => {
  const base: JudgementApiResult = {
    judgementId: 1,
    categoryCode: 'danger',
    categoryLabel: '危険',
    phishingScore: 80,
    aiGenScore: null,
    reasons: [{ code: 'URL_SHORTENER_DOMAIN', delta: 10 }],
    aiDetailUsed: false,
    aiReasonText: null,
    quotaAvailable: true,
  };

  it('aiGenScoreがnullの場合はunjudgeableに変換する', () => {
    expect(normalizeApiResult(base).aiGenScore).toBe('unjudgeable');
  });

  it('quotaAvailableを反転させてquotaUsedにする', () => {
    expect(normalizeApiResult({ ...base, quotaAvailable: true }).quotaUsed).toBe(false);
    expect(normalizeApiResult({ ...base, quotaAvailable: false }).quotaUsed).toBe(true);
  });

  it('reasonsはlabelForReasonCodeで日本語ラベルへ変換される', () => {
    expect(normalizeApiResult(base).reasons).toEqual(['短縮URLが使用されています']);
  });

  it('feedbackGivenは常にfalseで初期化する', () => {
    expect(normalizeApiResult(base).feedbackGiven).toBe(false);
  });
});

/**
 * handleJudge/handleFeedbackは複数のawaitを連鎖するため、Promise.resolve()を固定回数
 * awaitするだけではマイクロタスクキューを使い切れない場合がある。setTimeoutのコールバックは
 * マクロタスクとして実行されるため、そこに到達するまでのマイクロタスク(then連鎖)を確実に消化できる。
 */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('EmailJudgementController', () => {
  const email: ScoringEmailInput = {
    subject: '件名',
    body: '本文',
    senderDisplayName: '送信者',
    senderDomain: 'example.com',
    authHeaders: null,
    links: [],
  };

  const apiResult: JudgementApiResult = {
    judgementId: 42,
    categoryCode: 'danger',
    categoryLabel: '危険',
    phishingScore: 80,
    aiGenScore: 50,
    reasons: [{ code: 'URL_SHORTENER_DOMAIN', delta: 10 }],
    aiDetailUsed: true,
    aiReasonText: null,
    quotaAvailable: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  function installFakeChrome(
    handler: (message: { type: string; [key: string]: unknown }) => unknown,
  ): jest.Mock {
    const sendMessage = jest.fn((message: { type: string }, callback: (response: unknown) => void) => {
      callback(handler(message));
    });
    (globalThis as { chrome?: unknown }).chrome = {
      runtime: { lastError: undefined, sendMessage, getURL: (path: string) => path },
    };
    return sendMessage;
  }

  function setupController(): { host: HTMLElement } {
    (EmailExtractor as jest.Mock).mockImplementation(() => ({ extract: () => email }));
    const host = document.createElement('div');
    new EmailJudgementController(document.createElement('div'), host);
    return { host };
  }

  function clickTestId(host: HTMLElement, testid: string): void {
    const el = host.shadowRoot?.querySelector(`[data-testid="${testid}"]`) as HTMLElement | null;
    if (el === null || el === undefined) {
      throw new Error(`testid not found: ${testid}`);
    }
    el.click();
  }

  it('判定ボタン押下でAPI成功時、結果パネルへ判定結果が反映される', async () => {
    installFakeChrome(() => ({ ok: true, result: apiResult }));
    const { host } = setupController();

    clickTestId(host, 'judge-button');
    await flushPromises();

    expect(host.shadowRoot?.querySelector('[data-testid="category-label"]')?.textContent).toBe(
      '判定結果: 危険',
    );
    expect(host.shadowRoot?.querySelector('[data-testid="phishing-score"]')?.textContent).toBe(
      'フィッシングスコア: 80/100',
    );
  });

  it('API呼び出し失敗時はルールベース判定に縮退して結果を表示する', async () => {
    installFakeChrome(() => ({ ok: false, error: 'network down' }));
    const { host } = setupController();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    clickTestId(host, 'judge-button');
    await flushPromises();

    expect(host.shadowRoot?.querySelector('[data-testid="result-panel"]')).not.toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('メール抽出に失敗した場合はエラーをログしオーバーレイの状態を変更しない', async () => {
    (EmailExtractor as jest.Mock).mockImplementation(() => ({
      extract: () => {
        throw new EmailExtractionError('件名要素が見つかりません(Gmail DOM構造を確認してください)');
      },
    }));
    installFakeChrome(() => ({ ok: true, result: apiResult }));
    const host = document.createElement('div');
    new EmailJudgementController(document.createElement('div'), host);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    clickTestId(host, 'judge-button');
    await flushPromises();

    expect(host.shadowRoot?.querySelector('[data-testid="result-panel"]')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('閉じるボタン押下で判定状態をリセットする', async () => {
    installFakeChrome(() => ({ ok: true, result: apiResult }));
    const { host } = setupController();

    clickTestId(host, 'judge-button');
    await flushPromises();
    expect(host.shadowRoot?.querySelector('[data-testid="result-panel"]')).not.toBeNull();

    clickTestId(host, 'close-button');

    expect(host.shadowRoot?.querySelector('[data-testid="result-panel"]')).toBeNull();
  });

  it('同意するボタン押下でreCAPTCHAトークン取得後フィードバックAPIを呼び、送信済み表示になる', async () => {
    (getRecaptchaToken as jest.Mock).mockResolvedValue('recaptcha-token');
    const sendMessage = installFakeChrome((message) => {
      if (message.type === 'JUDGE_EMAIL') {
        return { ok: true, result: apiResult };
      }
      if (message.type === 'SUBMIT_FEEDBACK') {
        return { ok: true, result: null };
      }
      throw new Error(`unexpected message type: ${message.type}`);
    });
    const { host } = setupController();

    clickTestId(host, 'judge-button');
    await flushPromises();

    clickTestId(host, 'agree-button');
    await flushPromises();

    expect(getRecaptchaToken).toHaveBeenCalledWith('agree');
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUBMIT_FEEDBACK',
        judgementId: 42,
        feedbackCode: 'agree',
        recaptchaToken: 'recaptcha-token',
      }),
      expect.any(Function),
    );
    expect(host.shadowRoot?.querySelector('[data-testid="feedback-confirmation"]')).not.toBeNull();
  });

  it('judgementIdが無い(ルールベース縮退)場合はフィードバックを送信しない', async () => {
    installFakeChrome(() => ({ ok: false, error: 'network down' }));
    const { host } = setupController();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    clickTestId(host, 'judge-button');
    await flushPromises();

    clickTestId(host, 'agree-button');
    await flushPromises();

    expect(getRecaptchaToken).not.toHaveBeenCalled();
  });

  it('異議ありボタン押下でもフィードバックコードdisputeで同様に送信される', async () => {
    (getRecaptchaToken as jest.Mock).mockResolvedValue('recaptcha-token');
    const sendMessage = installFakeChrome((message) => {
      if (message.type === 'JUDGE_EMAIL') {
        return { ok: true, result: apiResult };
      }
      if (message.type === 'SUBMIT_FEEDBACK') {
        return { ok: true, result: null };
      }
      throw new Error(`unexpected message type: ${message.type}`);
    });
    const { host } = setupController();

    clickTestId(host, 'judge-button');
    await flushPromises();

    clickTestId(host, 'dispute-button');
    await flushPromises();

    expect(getRecaptchaToken).toHaveBeenCalledWith('dispute');
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SUBMIT_FEEDBACK', feedbackCode: 'dispute' }),
      expect.any(Function),
    );
  });
});
