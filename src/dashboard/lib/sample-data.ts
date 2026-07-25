import type { DashboardKpis, JudgementHistoryRow } from './types';

// TODO: 実APIから取得する(ダッシュボード側のGoogleログイン実装後)。
// 現時点ではapp-ui/のモックと同じ形状のサンプルデータを表示する。
export const sampleKpis: DashboardKpis = {
  judgementCount: 128,
  quotaUsageRate: 62,
  feedbackRate: 34,
};

export const sampleHistory: JudgementHistoryRow[] = [
  {
    id: '1',
    judgedAt: '2026-07-22T09:14:00+09:00',
    categoryCode: 'danger',
    categoryLabel: '危険',
    phishingScore: 78,
    aiGenScore: 65,
    quotaUsed: true,
    feedbackLabel: '異議',
  },
  {
    id: '2',
    judgedAt: '2026-07-21T18:02:00+09:00',
    categoryCode: 'safe',
    categoryLabel: '安全',
    phishingScore: 6,
    aiGenScore: 12,
    quotaUsed: false,
    feedbackLabel: '—',
  },
  {
    id: '3',
    judgedAt: '2026-07-21T11:47:00+09:00',
    categoryCode: 'caution',
    categoryLabel: '注意',
    phishingScore: 38,
    aiGenScore: null,
    quotaUsed: false,
    feedbackLabel: '同意',
  },
  {
    id: '4',
    judgedAt: '2026-07-20T15:30:00+09:00',
    categoryCode: 'danger',
    categoryLabel: '危険',
    phishingScore: 82,
    aiGenScore: 71,
    quotaUsed: true,
    feedbackLabel: '同意',
  },
  {
    id: '5',
    judgedAt: '2026-07-19T08:55:00+09:00',
    categoryCode: 'safe',
    categoryLabel: '安全',
    phishingScore: 4,
    aiGenScore: 9,
    quotaUsed: false,
    feedbackLabel: '—',
  },
  {
    id: '6',
    judgedAt: '2026-07-18T20:11:00+09:00',
    categoryCode: 'caution',
    categoryLabel: '注意',
    phishingScore: 45,
    aiGenScore: 58,
    quotaUsed: true,
    feedbackLabel: '—',
  },
];
