export type CategoryCode = 'danger' | 'caution' | 'safe';

export interface JudgementReason {
  code: string;
  delta: number;
}

export interface JudgementHistoryRow {
  id: string;
  judgedAt: string;
  categoryCode: CategoryCode;
  categoryLabel: string;
  phishingScore: number;
  aiGenScore: number | null;
  quotaUsed: boolean;
  feedbackLabel: string;
  bodySha256: string;
  reasons: JudgementReason[];
}

export interface DashboardKpis {
  judgementCount: number;
  quotaUsageRate: number;
  feedbackRate: number;
}
