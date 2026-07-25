import { judgementCategories } from '../masters';
import type { OverlayCallbacks, OverlayResultState, OverlayState } from './types';

const FONT_AWESOME_STYLESHEET_PATH = 'dist/vendor/fontawesome/css/all.min.css';

function resolveExtensionAssetUrl(path: string): string | null {
  const runtime = (globalThis as { chrome?: { runtime?: { getURL?: (p: string) => string } } }).chrome
    ?.runtime;
  if (runtime?.getURL === undefined) {
    return null;
  }
  return runtime.getURL(path);
}

function categoryByCode(code: OverlayResultState['categoryCode']) {
  const category = judgementCategories.find((c) => c.code === code);
  if (category === undefined) {
    throw new Error(`未知の判定区分コードです: ${code}`);
  }
  return category;
}

function formatAiScore(aiGenScore: OverlayResultState['aiGenScore']): string {
  return aiGenScore === 'unjudgeable' ? '判定不能' : `${aiGenScore} / 100`;
}

export class JudgementOverlay {
  private readonly shadowRoot: ShadowRoot;

  constructor(host: HTMLElement, private readonly callbacks: OverlayCallbacks) {
    this.shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const fontAwesomeUrl = resolveExtensionAssetUrl(FONT_AWESOME_STYLESHEET_PATH);
    if (fontAwesomeUrl !== null) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontAwesomeUrl;
      this.shadowRoot.appendChild(link);
    }
  }

  render(state: OverlayState): void {
    const existingLink = this.shadowRoot.querySelector('link');
    this.shadowRoot.innerHTML = '';
    if (existingLink !== null) {
      this.shadowRoot.appendChild(existingLink);
    }

    const root = document.createElement('div');
    root.className = 'phishlens-overlay';
    root.appendChild(this.buildJudgeButton(state.judged));
    if (state.judged && state.result !== null) {
      root.appendChild(this.buildResultPanel(state.result));
    }
    this.shadowRoot.appendChild(root);
  }

  private buildJudgeButton(judged: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.dataset.testid = 'judge-button';
    const icon = document.createElement('i');
    icon.className = judged ? 'fa-solid fa-arrows-rotate' : 'fa-solid fa-magnifying-glass';
    button.appendChild(icon);
    button.appendChild(document.createTextNode(judged ? ' 再判定する' : ' 判定する'));
    button.addEventListener('click', () => this.callbacks.onJudge());
    return button;
  }

  private buildResultPanel(result: OverlayResultState): HTMLElement {
    const category = categoryByCode(result.categoryCode);

    const panel = document.createElement('div');
    panel.dataset.testid = 'result-panel';

    const header = document.createElement('div');
    const categoryLabel = document.createElement('span');
    categoryLabel.dataset.testid = 'category-label';
    categoryLabel.textContent = `判定結果: ${category.label}`;
    header.appendChild(categoryLabel);

    const closeButton = document.createElement('button');
    closeButton.dataset.testid = 'close-button';
    closeButton.textContent = '閉じる';
    closeButton.addEventListener('click', () => this.callbacks.onClose());
    header.appendChild(closeButton);
    panel.appendChild(header);

    const phishingScore = document.createElement('div');
    phishingScore.dataset.testid = 'phishing-score';
    phishingScore.textContent = `フィッシングスコア: ${result.phishingScore}/100`;
    panel.appendChild(phishingScore);

    const aiScore = document.createElement('div');
    aiScore.dataset.testid = 'ai-score';
    aiScore.textContent = `AI生成スコア: ${formatAiScore(result.aiGenScore)}`;
    panel.appendChild(aiScore);

    const reasonList = document.createElement('ul');
    for (const reason of result.reasons) {
      const item = document.createElement('li');
      item.dataset.testid = 'reason-item';
      item.textContent = reason;
      reasonList.appendChild(item);
    }
    panel.appendChild(reasonList);

    const quotaStatus = document.createElement('div');
    quotaStatus.dataset.testid = 'quota-status';
    quotaStatus.textContent = result.quotaUsed
      ? '本日のAI詳細判定は利用済みです'
      : 'AI詳細判定 本日残り1回';
    panel.appendChild(quotaStatus);

    panel.appendChild(this.buildFeedbackSection(result));

    return panel;
  }

  private buildFeedbackSection(result: OverlayResultState): HTMLElement {
    const section = document.createElement('div');

    const agreeButton = document.createElement('button');
    agreeButton.dataset.testid = 'agree-button';
    agreeButton.textContent = '同意する';
    agreeButton.addEventListener('click', () => this.callbacks.onAgree());
    section.appendChild(agreeButton);

    const disputeButton = document.createElement('button');
    disputeButton.dataset.testid = 'dispute-button';
    disputeButton.textContent = '異議あり';
    disputeButton.addEventListener('click', () => this.callbacks.onDispute());
    section.appendChild(disputeButton);

    if (result.feedbackGiven) {
      const confirmation = document.createElement('div');
      confirmation.dataset.testid = 'feedback-confirmation';
      confirmation.textContent = 'フィードバックを送信しました';
      section.appendChild(confirmation);
    }

    return section;
  }
}
