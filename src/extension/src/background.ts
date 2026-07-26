import { getGoogleIdToken } from './auth/google-auth';
import { requestJudgement, type JudgementApiResult } from './api/judgement-client';
import { submitFeedback } from './api/feedback-client';
import { API_BASE_URL } from './config';
import type { ScoringEmailInput } from './scoring/types';

/**
 * Issue #37準拠。service worker context。
 * chrome.identity.launchWebAuthFlowはcontent script contextから実行できないため、
 * IDトークン取得とAPI呼び出しはすべてこのbackground.tsで行い、
 * content.tsとはchrome.runtime.sendMessage/onMessageで通信する。
 */
export type BackgroundRequest =
  | { type: 'JUDGE_EMAIL'; email: ScoringEmailInput }
  | {
      type: 'SUBMIT_FEEDBACK';
      judgementId: number;
      feedbackCode: 'agree' | 'dispute';
      recaptchaToken: string;
    };

export type BackgroundResponse<T> = { ok: true; result: T } | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleJudgeEmail(
  email: ScoringEmailInput,
): Promise<BackgroundResponse<JudgementApiResult>> {
  try {
    const idToken = await getGoogleIdToken();
    const result = await requestJudgement({ apiBaseUrl: API_BASE_URL, idToken, email });
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function handleSubmitFeedback(
  judgementId: number,
  feedbackCode: 'agree' | 'dispute',
  recaptchaToken: string,
): Promise<BackgroundResponse<null>> {
  try {
    const idToken = await getGoogleIdToken();
    await submitFeedback({ apiBaseUrl: API_BASE_URL, idToken, judgementId, feedbackCode, recaptchaToken });
    return { ok: true, result: null };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export function handleMessage(
  message: BackgroundRequest,
  sendResponse: (response: BackgroundResponse<unknown>) => void,
): boolean {
  if (message.type === 'JUDGE_EMAIL') {
    handleJudgeEmail(message.email).then(sendResponse);
    return true;
  }
  if (message.type === 'SUBMIT_FEEDBACK') {
    handleSubmitFeedback(message.judgementId, message.feedbackCode, message.recaptchaToken).then(sendResponse);
    return true;
  }
  return false;
}

chrome.runtime.onMessage.addListener((message: BackgroundRequest, _sender, sendResponse) =>
  handleMessage(message, sendResponse),
);
