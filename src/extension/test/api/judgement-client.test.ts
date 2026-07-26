import { JudgementRequestError, requestJudgement } from '../../src/api/judgement-client';
import type { ScoringEmailInput } from '../../src/scoring/types';

function buildEmail(overrides: Partial<ScoringEmailInput> = {}): ScoringEmailInput {
  return {
    subject: '件名',
    body: '本文',
    senderDisplayName: '送信者',
    senderDomain: 'example.com',
    authHeaders: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    links: [{ displayText: 'example', href: 'https://example.com' }],
    ...overrides,
  };
}

describe('requestJudgement', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('/api/judgementsへ認証ヘッダ・スネークケースのボディでPOSTし、応答をキャメルケースへ正規化する', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        category_code: 'danger',
        category_label: '危険',
        phishing_score: 80,
        ai_gen_score: 50,
        reasons: [{ code: 'URL_SHORTENER_DOMAIN', delta: 10 }],
        ai_detail_used: true,
        ai_reason_text: 'reason',
        quota_available: false,
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await requestJudgement({
      apiBaseUrl: 'https://api.example.com',
      idToken: 'id-token',
      email: buildEmail(),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/judgements',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer id-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          subject: '件名',
          body: '本文',
          sender_display_name: '送信者',
          sender_domain: 'example.com',
          auth_headers: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
          links: [{ display_text: 'example', href: 'https://example.com' }],
        }),
      }),
    );

    expect(result).toEqual({
      judgementId: 1,
      categoryCode: 'danger',
      categoryLabel: '危険',
      phishingScore: 80,
      aiGenScore: 50,
      reasons: [{ code: 'URL_SHORTENER_DOMAIN', delta: 10 }],
      aiDetailUsed: true,
      aiReasonText: 'reason',
      quotaAvailable: false,
    });
  });

  it('authHeadersがnullの場合はauth_headersを送信しない(undefined)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 2,
        category_code: 'safe',
        category_label: '安全',
        phishing_score: 0,
        ai_gen_score: null,
        reasons: [],
        ai_detail_used: false,
        ai_reason_text: null,
        quota_available: true,
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await requestJudgement({
      apiBaseUrl: 'https://api.example.com',
      idToken: 'id-token',
      email: buildEmail({ authHeaders: null }),
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(requestInit.body) as { auth_headers?: unknown };
    expect(body.auth_headers).toBeUndefined();
  });

  it('応答が失敗ならJudgementRequestErrorを投げる(エラーメッセージがあれば使用)', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: '認証に失敗しました' }),
    }) as unknown as typeof fetch;

    await expect(
      requestJudgement({ apiBaseUrl: 'https://api.example.com', idToken: 'bad', email: buildEmail() }),
    ).rejects.toMatchObject({ status: 401, message: '認証に失敗しました' });
  });

  it('エラーレスポンスのJSONパースに失敗した場合はデフォルトメッセージのJudgementRequestErrorを投げる', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json');
      },
    }) as unknown as typeof fetch;

    await expect(
      requestJudgement({ apiBaseUrl: 'https://api.example.com', idToken: 'bad', email: buildEmail() }),
    ).rejects.toBeInstanceOf(JudgementRequestError);
  });
});
