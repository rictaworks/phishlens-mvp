export interface SubmitFeedbackParams {
  apiBaseUrl: string;
  idToken: string;
  judgementId: number;
  feedbackCode: 'agree' | 'dispute';
  recaptchaToken: string;
}

export class FeedbackSubmissionError extends Error {
  constructor(status: number) {
    super(`フィードバック送信に失敗しました(status=${status})`);
    this.name = 'FeedbackSubmissionError';
  }
}

export async function submitFeedback(params: SubmitFeedbackParams): Promise<void> {
  const response = await fetch(`${params.apiBaseUrl}/api/feedbacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      judgement_id: params.judgementId,
      feedback_code: params.feedbackCode,
      recaptcha_token: params.recaptchaToken,
    }),
  });

  if (!response.ok) {
    throw new FeedbackSubmissionError(response.status);
  }
}
