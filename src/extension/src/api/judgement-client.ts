import type { AuthHeaders, EmailLink, ScoringEmailInput } from '../scoring/types';
import type { CategoryCode } from '../overlay/types';

export interface RequestJudgementParams {
  apiBaseUrl: string;
  idToken: string;
  email: ScoringEmailInput;
}

export interface JudgementReason {
  code: string;
  delta: number;
}

export interface JudgementApiResult {
  judgementId: number;
  categoryCode: CategoryCode;
  categoryLabel: string;
  phishingScore: number;
  aiGenScore: number | null;
  reasons: JudgementReason[];
  aiDetailUsed: boolean;
  aiReasonText: string | null;
  quotaAvailable: boolean;
}

interface JudgementApiResponseBody {
  id: number;
  category_code: CategoryCode;
  category_label: string;
  phishing_score: number;
  ai_gen_score: number | null;
  reasons: Array<{ code: string; delta: number }>;
  ai_detail_used: boolean;
  ai_reason_text: string | null;
  quota_available: boolean;
}

interface JudgementApiErrorBody {
  error?: string;
}

export class JudgementRequestError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `判定リクエストに失敗しました(status=${status})`);
    this.name = 'JudgementRequestError';
    this.status = status;
  }
}

function buildAuthHeadersPayload(authHeaders: AuthHeaders | null): AuthHeaders | undefined {
  return authHeaders === null ? undefined : authHeaders;
}

function buildLinksPayload(links: EmailLink[]): Array<{ display_text: string; href: string }> {
  return links.map((link) => ({ display_text: link.displayText, href: link.href }));
}

async function parseErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as JudgementApiErrorBody;
    return body.error;
  } catch {
    return undefined;
  }
}

function normalizeResponseBody(payload: JudgementApiResponseBody): JudgementApiResult {
  return {
    judgementId: payload.id,
    categoryCode: payload.category_code,
    categoryLabel: payload.category_label,
    phishingScore: payload.phishing_score,
    aiGenScore: payload.ai_gen_score,
    reasons: payload.reasons,
    aiDetailUsed: payload.ai_detail_used,
    aiReasonText: payload.ai_reason_text,
    quotaAvailable: payload.quota_available,
  };
}

/**
 * Issue #37準拠。Rails側 POST /api/judgements(#9・#38)を呼び出し、
 * 抽出したメールデータの権威ある判定結果を取得する。
 */
export async function requestJudgement(params: RequestJudgementParams): Promise<JudgementApiResult> {
  const { apiBaseUrl, idToken, email } = params;

  const response = await fetch(`${apiBaseUrl}/api/judgements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      subject: email.subject,
      body: email.body,
      sender_display_name: email.senderDisplayName,
      sender_domain: email.senderDomain,
      auth_headers: buildAuthHeadersPayload(email.authHeaders),
      links: buildLinksPayload(email.links),
    }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new JudgementRequestError(response.status, message);
  }

  const payload = (await response.json()) as JudgementApiResponseBody;
  return normalizeResponseBody(payload);
}
