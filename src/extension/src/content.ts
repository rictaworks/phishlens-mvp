import { EmailExtractionError, EmailExtractor } from './extraction/email-extractor';
import { PhishingScorer } from './scoring/phishing-scorer';
import { AiStyleScorer } from './scoring/ai-style-scorer';
import { judgementCategories } from './masters';
import { JudgementOverlay } from './overlay/judgement-overlay';
import { labelForReasonCode } from './overlay/reason-labels';
import { getRecaptchaToken } from './content/recaptcha-client';
import type { CategoryCode, OverlayCallbacks, OverlayResultState, OverlayState } from './overlay/types';
import type { ScoringEmailInput } from './scoring/types';
import type { JudgementApiResult } from './api/judgement-client';
import type { BackgroundRequest, BackgroundResponse } from './background';

/**
 * Issue #37準拠。Gmail(mail.google.com)上で動作するcontent script。
 * メール詳細画面に判定ボタン/結果パネルのオーバーレイ(JudgementOverlay)を表示し、
 * background.tsへのメッセージ送信を介してRails APIの判定・フィードバック送信を行う。
 *
 * judgement-client.tsのコメントの通りサーバー側の判定が権威ある結果であり、
 * ここで使うPhishingScorer/AiStyleScorer(ローカルのルールベース判定)は
 * API呼び出しが失敗した場合(オフライン・API障害等)にのみ使う縮退フォールバックである。
 */

const OVERLAY_HOST_ID = 'phishlens-overlay-host';

function sendBackgroundMessage<T>(message: BackgroundRequest): Promise<BackgroundResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse<T>) => {
      if (chrome.runtime.lastError !== undefined) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError.message ?? '拡張機能のバックグラウンド処理との通信に失敗しました',
        });
        return;
      }
      resolve(response);
    });
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * requirements.mdのカテゴリ閾値(judgement-categories.json)に基づき、
 * フィッシングスコアからカテゴリ区分を求める。JudgementIntegrator#categorize(Rails側)と等価のロジック。
 */
export function categorize(phishingScore: number): CategoryCode {
  const sorted = [...judgementCategories].sort((a, b) => b.threshold_min - a.threshold_min);
  const matched = sorted.find((category) => phishingScore >= category.threshold_min);
  return matched?.code ?? 'safe';
}

/**
 * API呼び出しが失敗した場合の縮退フォールバック。ローカルのPhishingScorer/AiStyleScorerのみで
 * 判定結果を組み立てる(quotaUsedは常にfalse、feedbackGivenは常にfalse=フィードバック不可)。
 */
export function buildRuleBasedResult(email: ScoringEmailInput): OverlayResultState {
  const phishingResult = new PhishingScorer(email).score();
  const aiStyleResult = new AiStyleScorer(email.body).score();
  const aiGenScore = aiStyleResult === 'unjudgeable' ? ('unjudgeable' as const) : aiStyleResult.score;
  const reasonCodes = [
    ...phishingResult.reasons.map((reason) => reason.code),
    ...(aiStyleResult === 'unjudgeable' ? [] : aiStyleResult.reasons.map((reason) => reason.code)),
  ];

  return {
    categoryCode: categorize(phishingResult.score),
    phishingScore: phishingResult.score,
    aiGenScore,
    reasons: reasonCodes.map(labelForReasonCode),
    quotaUsed: false,
    feedbackGiven: false,
  };
}

/**
 * Rails APIのレスポンス(JudgementApiResult)をOverlayResultStateへ変換する。
 */
export function normalizeApiResult(apiResult: JudgementApiResult): OverlayResultState {
  return {
    categoryCode: apiResult.categoryCode,
    phishingScore: apiResult.phishingScore,
    aiGenScore: apiResult.aiGenScore === null ? 'unjudgeable' : apiResult.aiGenScore,
    reasons: apiResult.reasons.map((reason) => labelForReasonCode(reason.code)),
    quotaUsed: !apiResult.quotaAvailable,
    feedbackGiven: false,
  };
}

/**
 * 1つの浮動ホスト要素に紐づく単一のJudgementOverlayインスタンスを保持し、
 * 判定・フィードバック送信のリクエスト/レスポンスに応じて状態遷移させるコントローラ。
 */
export class EmailJudgementController {
  private readonly overlay: JudgementOverlay;
  private state: OverlayState = { judged: false, result: null };
  private judgementId: number | null = null;
  private feedbackInFlight = false;

  constructor(private readonly emailRoot: ParentNode, host: HTMLElement) {
    const callbacks: OverlayCallbacks = {
      onJudge: () => {
        void this.handleJudge();
      },
      onClose: () => this.handleClose(),
      onAgree: () => {
        void this.handleFeedback('agree');
      },
      onDispute: () => {
        void this.handleFeedback('dispute');
      },
    };
    this.overlay = new JudgementOverlay(host, callbacks);
    this.render();
  }

  private render(): void {
    this.overlay.render(this.state);
  }

  private async handleJudge(): Promise<void> {
    let email: ScoringEmailInput;
    try {
      email = new EmailExtractor().extract(this.emailRoot);
    } catch (error) {
      if (error instanceof EmailExtractionError) {
        // eslint-disable-next-line no-console
        console.error(`[PhishLens] ${error.message}`);
        return;
      }
      throw error;
    }

    const response = await sendBackgroundMessage<JudgementApiResult>({ type: 'JUDGE_EMAIL', email });

    if (response.ok) {
      this.judgementId = response.result.judgementId;
      this.state = { judged: true, result: normalizeApiResult(response.result) };
    } else {
      // eslint-disable-next-line no-console
      console.error(`[PhishLens] 判定APIの呼び出しに失敗したためルールベース判定に縮退します: ${response.error}`);
      this.judgementId = null;
      this.state = { judged: true, result: buildRuleBasedResult(email) };
    }
    this.render();
  }

  private handleClose(): void {
    this.state = { judged: false, result: null };
    this.judgementId = null;
    this.render();
  }

  private async handleFeedback(feedbackCode: 'agree' | 'dispute'): Promise<void> {
    if (this.feedbackInFlight || this.judgementId === null || this.state.result === null) {
      return;
    }
    const judgementId = this.judgementId;
    this.feedbackInFlight = true;
    try {
      const recaptchaToken = await getRecaptchaToken(feedbackCode);
      const response = await sendBackgroundMessage<null>({
        type: 'SUBMIT_FEEDBACK',
        judgementId,
        feedbackCode,
        recaptchaToken,
      });

      if (response.ok) {
        this.state = { ...this.state, result: { ...this.state.result, feedbackGiven: true } };
        this.render();
      } else {
        // eslint-disable-next-line no-console
        console.error(`[PhishLens] フィードバック送信に失敗しました: ${response.error}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[PhishLens] フィードバック送信に失敗しました: ${toErrorMessage(error)}`);
    } finally {
      this.feedbackInFlight = false;
    }
  }
}

function ensureOverlayHost(): HTMLElement {
  const existing = document.getElementById(OVERLAY_HOST_ID);
  if (existing !== null) {
    return existing;
  }
  const host = document.createElement('div');
  host.id = OVERLAY_HOST_ID;
  host.style.position = 'fixed';
  host.style.bottom = '24px';
  host.style.right = '24px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);
  return host;
}

function init(): void {
  new EmailJudgementController(document, ensureOverlayHost());
}

init();
