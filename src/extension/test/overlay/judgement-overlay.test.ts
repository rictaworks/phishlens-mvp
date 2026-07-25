import { JudgementOverlay } from '../../src/overlay/judgement-overlay';
import type { OverlayCallbacks, OverlayState } from '../../src/overlay/types';

function createCallbacks(): OverlayCallbacks & Record<string, jest.Mock> {
  return {
    onJudge: jest.fn(),
    onClose: jest.fn(),
    onAgree: jest.fn(),
    onDispute: jest.fn(),
  };
}

function shadowOf(host: HTMLElement): ShadowRoot {
  const shadow = host.shadowRoot;
  if (shadow === null) {
    throw new Error('shadow root is not attached');
  }
  return shadow;
}

describe('JudgementOverlay 未判定状態', () => {
  it('判定するボタンを表示する', () => {
    const host = document.createElement('div');
    const overlay = new JudgementOverlay(host, createCallbacks());
    const state: OverlayState = { judged: false, result: null };

    overlay.render(state);

    const button = shadowOf(host).querySelector('[data-testid="judge-button"]');
    expect(button?.textContent).toContain('判定する');
    expect(shadowOf(host).querySelector('[data-testid="result-panel"]')).toBeNull();
  });

  it('判定するボタンをクリックするとonJudgeが呼ばれる', () => {
    const host = document.createElement('div');
    const callbacks = createCallbacks();
    const overlay = new JudgementOverlay(host, callbacks);
    overlay.render({ judged: false, result: null });

    const button = shadowOf(host).querySelector<HTMLButtonElement>('[data-testid="judge-button"]');
    button?.click();

    expect(callbacks.onJudge).toHaveBeenCalledTimes(1);
  });
});

describe('JudgementOverlay 判定結果表示', () => {
  const judgedState: OverlayState = {
    judged: true,
    result: {
      categoryCode: 'danger',
      phishingScore: 78,
      aiGenScore: 65,
      reasons: [
        '送信者表示名がブランドマスタに一致するが送信ドメイン不一致 (+25)',
        'SPF/DKIM/DMARCのいずれかがfail (+30)',
      ],
      quotaUsed: false,
      feedbackGiven: false,
    },
  };

  it('再判定するボタンとカテゴリ・スコア・根拠を表示する', () => {
    const host = document.createElement('div');
    const overlay = new JudgementOverlay(host, createCallbacks());

    overlay.render(judgedState);

    const shadow = shadowOf(host);
    expect(shadow.querySelector('[data-testid="judge-button"]')?.textContent).toContain('再判定する');
    expect(shadow.querySelector('[data-testid="category-label"]')?.textContent).toContain('危険');
    expect(shadow.querySelector('[data-testid="phishing-score"]')?.textContent).toContain('78');
    expect(shadow.querySelector('[data-testid="ai-score"]')?.textContent).toContain('65');
    expect(shadow.querySelectorAll('[data-testid="reason-item"]')).toHaveLength(2);
    expect(shadow.querySelector('[data-testid="quota-status"]')?.textContent).toContain('本日残り1回');
  });

  it('AI生成スコアが判定不能の場合はその旨を表示する', () => {
    const host = document.createElement('div');
    const overlay = new JudgementOverlay(host, createCallbacks());
    overlay.render({
      ...judgedState,
      result: { ...judgedState.result!, aiGenScore: 'unjudgeable' },
    });

    expect(shadowOf(host).querySelector('[data-testid="ai-score"]')?.textContent).toContain('判定不能');
  });

  it('AI枠使用済みの場合はその旨を表示する', () => {
    const host = document.createElement('div');
    const overlay = new JudgementOverlay(host, createCallbacks());
    overlay.render({ ...judgedState, result: { ...judgedState.result!, quotaUsed: true } });

    expect(shadowOf(host).querySelector('[data-testid="quota-status"]')?.textContent).toContain(
      '利用済み',
    );
  });

  it('同意するボタンをクリックするとonAgreeが呼ばれる', () => {
    const host = document.createElement('div');
    const callbacks = createCallbacks();
    const overlay = new JudgementOverlay(host, callbacks);
    overlay.render(judgedState);

    shadowOf(host).querySelector<HTMLButtonElement>('[data-testid="agree-button"]')?.click();

    expect(callbacks.onAgree).toHaveBeenCalledTimes(1);
  });

  it('異議ありボタンをクリックするとonDisputeが呼ばれる', () => {
    const host = document.createElement('div');
    const callbacks = createCallbacks();
    const overlay = new JudgementOverlay(host, callbacks);
    overlay.render(judgedState);

    shadowOf(host).querySelector<HTMLButtonElement>('[data-testid="dispute-button"]')?.click();

    expect(callbacks.onDispute).toHaveBeenCalledTimes(1);
  });

  it('フィードバック送信済みなら確認メッセージを表示する', () => {
    const host = document.createElement('div');
    const overlay = new JudgementOverlay(host, createCallbacks());
    overlay.render({ ...judgedState, result: { ...judgedState.result!, feedbackGiven: true } });

    expect(shadowOf(host).querySelector('[data-testid="feedback-confirmation"]')).not.toBeNull();
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    const host = document.createElement('div');
    const callbacks = createCallbacks();
    const overlay = new JudgementOverlay(host, callbacks);
    overlay.render(judgedState);

    shadowOf(host).querySelector<HTMLButtonElement>('[data-testid="close-button"]')?.click();

    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });
});
