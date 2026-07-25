export type CategoryCode = 'danger' | 'caution' | 'safe';

export interface JudgementHistoryRow {
  id: string;
  judgedAt: string;
  categoryCode: CategoryCode;
  categoryLabel: string;
  phishingScore: number;
  aiGenScore: number | null;
  quotaUsed: boolean;
  feedbackLabel: string;
}

export interface DashboardKpis {
  judgementCount: number;
  quotaUsageRate: number;
  feedbackRate: number;
}
