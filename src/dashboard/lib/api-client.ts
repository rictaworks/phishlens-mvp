import { formatFeedbackLabel } from './format';
import type { CategoryCode, DashboardKpis, JudgementHistoryRow, JudgementReason } from './types';

interface ApiClientRequestParams {
  apiBaseUrl: string;
  idToken: string;
}

interface JudgementHistoryResponseRow {
  id: number;
  judged_at: string;
  category_code: CategoryCode;
  category_label: string;
  phishing_score: number;
  ai_gen_score: number | null;
  ai_detail_used: boolean;
  feedback_label: string | null;
  body_sha256: string;
  reasons: JudgementReason[];
}

interface JudgementHistoryResponseBody {
  judgements: JudgementHistoryResponseRow[];
}

interface DashboardKpisResponseBody {
  judgement_count: number;
  quota_usage_rate: number;
  feedback_rate: number;
}

interface ApiErrorResponseBody {
  error?: string;
}

export class DashboardApiError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `APIリクエストに失敗しました(status=${status})`);
    this.name = 'DashboardApiError';
    this.status = status;
  }
}

async function parseErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as ApiErrorResponseBody;
    return body.error;
  } catch {
    return undefined;
  }
}

async function getJson<T>(url: string, idToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new DashboardApiError(response.status, message);
  }

  return (await response.json()) as T;
}

function normalizeHistoryRow(row: JudgementHistoryResponseRow): JudgementHistoryRow {
  return {
    id: String(row.id),
    judgedAt: row.judged_at,
    categoryCode: row.category_code,
    categoryLabel: row.category_label,
    phishingScore: row.phishing_score,
    aiGenScore: row.ai_gen_score,
    quotaUsed: row.ai_detail_used,
    feedbackLabel: formatFeedbackLabel(row.feedback_label),
    bodySha256: row.body_sha256,
    reasons: row.reasons,
  };
}

function normalizeKpis(body: DashboardKpisResponseBody): DashboardKpis {
  return {
    judgementCount: body.judgement_count,
    quotaUsageRate: body.quota_usage_rate,
    feedbackRate: body.feedback_rate,
  };
}

export async function fetchHistory(params: ApiClientRequestParams): Promise<JudgementHistoryRow[]> {
  const body = await getJson<JudgementHistoryResponseBody>(`${params.apiBaseUrl}/api/judgements`, params.idToken);
  return body.judgements.map(normalizeHistoryRow);
}

export async function fetchKpis(params: ApiClientRequestParams): Promise<DashboardKpis> {
  const body = await getJson<DashboardKpisResponseBody>(`${params.apiBaseUrl}/api/judgements/kpis`, params.idToken);
  return normalizeKpis(body);
}
