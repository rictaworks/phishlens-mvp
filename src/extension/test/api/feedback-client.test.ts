import { FeedbackSubmissionError, submitFeedback } from '../../src/api/feedback-client';

describe('submitFeedback', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('/api/feedbacksへ認証ヘッダ付きでPOSTする', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 201 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await submitFeedback({
      apiBaseUrl: 'https://api.example.com',
      idToken: 'id-token',
      judgementId: 42,
      feedbackCode: 'agree',
      recaptchaToken: 'recaptcha-token',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/feedbacks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer id-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          judgement_id: 42,
          feedback_code: 'agree',
          recaptcha_token: 'recaptcha-token',
        }),
      }),
    );
  });

  it('応答が失敗ならFeedbackSubmissionErrorを投げる', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 422 }) as unknown as typeof fetch;

    await expect(
      submitFeedback({
        apiBaseUrl: 'https://api.example.com',
        idToken: 'id-token',
        judgementId: 42,
        feedbackCode: 'dispute',
        recaptchaToken: 'bad-token',
      }),
    ).rejects.toBeInstanceOf(FeedbackSubmissionError);
  });
});
