jest.mock('../src/auth/google-auth', () => ({
  getGoogleIdToken: jest.fn(),
}));
jest.mock('../src/api/judgement-client', () => ({
  requestJudgement: jest.fn(),
}));
jest.mock('../src/api/feedback-client', () => ({
  submitFeedback: jest.fn(),
}));

import { getGoogleIdToken } from '../src/auth/google-auth';
import { requestJudgement } from '../src/api/judgement-client';
import { submitFeedback } from '../src/api/feedback-client';
import { handleJudgeEmail, handleMessage, handleSubmitFeedback, type BackgroundRequest } from '../src/background';
import type { ScoringEmailInput } from '../src/scoring/types';
import type { JudgementApiResult } from '../src/api/judgement-client';

const email: ScoringEmailInput = {
  subject: '件名',
  body: '本文',
  senderDisplayName: '送信者',
  senderDomain: 'example.com',
  authHeaders: null,
  links: [],
};

const apiResult: JudgementApiResult = {
  judgementId: 1,
  categoryCode: 'safe',
  categoryLabel: '安全',
  phishingScore: 0,
  aiGenScore: null,
  reasons: [],
  aiDetailUsed: false,
  aiReasonText: null,
  quotaAvailable: true,
};

describe('handleJudgeEmail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('IDトークン取得・判定APIが成功したら{ok:true, result}を返す', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (requestJudgement as jest.Mock).mockResolvedValue(apiResult);

    const response = await handleJudgeEmail(email);

    expect(getGoogleIdToken).toHaveBeenCalledTimes(1);
    expect(requestJudgement).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: 'id-token', email }),
    );
    expect(response).toEqual({ ok: true, result: apiResult });
  });

  it('Errorが投げられた場合は{ok:false, error:メッセージ}を返す', async () => {
    (getGoogleIdToken as jest.Mock).mockRejectedValue(new Error('認証に失敗しました'));

    const response = await handleJudgeEmail(email);

    expect(response).toEqual({ ok: false, error: '認証に失敗しました' });
  });

  it('Error以外の値が投げられた場合は文字列化してerrorに詰める', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (requestJudgement as jest.Mock).mockRejectedValue('network down');

    const response = await handleJudgeEmail(email);

    expect(response).toEqual({ ok: false, error: 'network down' });
  });
});

describe('handleSubmitFeedback', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('成功時は{ok:true, result:null}を返す', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (submitFeedback as jest.Mock).mockResolvedValue(undefined);

    const response = await handleSubmitFeedback(1, 'agree', 'recaptcha-token');

    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        idToken: 'id-token',
        judgementId: 1,
        feedbackCode: 'agree',
        recaptchaToken: 'recaptcha-token',
      }),
    );
    expect(response).toEqual({ ok: true, result: null });
  });

  it('失敗時は{ok:false, error}を返す', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (submitFeedback as jest.Mock).mockRejectedValue(new Error('フィードバック送信に失敗しました(status=422)'));

    const response = await handleSubmitFeedback(1, 'dispute', 'recaptcha-token');

    expect(response).toEqual({ ok: false, error: 'フィードバック送信に失敗しました(status=422)' });
  });
});

/**
 * handleJudgeEmail/handleSubmitFeedbackは複数のawaitを連鎖するため、
 * Promise.resolve()を固定回数awaitするだけではマイクロタスクキューを使い切れない場合がある。
 * setTimeoutのコールバックはマクロタスクとして実行されるため、そこに到達するまでに溜まった
 * マイクロタスク(then連鎖)がすべて消化されていることを保証できる。
 */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('handleMessage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('JUDGE_EMAILメッセージを受け取ったらtrueを返し、非同期でsendResponseを呼ぶ', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (requestJudgement as jest.Mock).mockResolvedValue(apiResult);
    const sendResponse = jest.fn();

    const keepChannelOpen = handleMessage({ type: 'JUDGE_EMAIL', email }, sendResponse);

    expect(keepChannelOpen).toBe(true);
    expect(sendResponse).not.toHaveBeenCalled();

    await flushPromises();

    expect(sendResponse).toHaveBeenCalledWith({ ok: true, result: apiResult });
  });

  it('SUBMIT_FEEDBACKメッセージを受け取ったらtrueを返し、非同期でsendResponseを呼ぶ', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('id-token');
    (submitFeedback as jest.Mock).mockResolvedValue(undefined);
    const sendResponse = jest.fn();

    const keepChannelOpen = handleMessage(
      { type: 'SUBMIT_FEEDBACK', judgementId: 1, feedbackCode: 'agree', recaptchaToken: 'token' },
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);

    await flushPromises();

    expect(sendResponse).toHaveBeenCalledWith({ ok: true, result: null });
  });

  it('未知のメッセージ型はfalseを返しsendResponseを呼ばない', () => {
    const sendResponse = jest.fn();
    const unknownMessage = { type: 'UNKNOWN' } as unknown as BackgroundRequest;

    const keepChannelOpen = handleMessage(unknownMessage, sendResponse);

    expect(keepChannelOpen).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
