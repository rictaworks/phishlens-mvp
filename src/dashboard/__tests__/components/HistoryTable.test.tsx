import { render, screen } from '@testing-library/react';
import { HistoryTable } from '../../app/components/HistoryTable';
import type { JudgementHistoryRow } from '../../lib/types';

const rows: JudgementHistoryRow[] = [
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
    aiGenScore: null,
    quotaUsed: false,
    feedbackLabel: '—',
  },
];

describe('HistoryTable', () => {
  it('履歴行を表示する', () => {
    render(<HistoryTable rows={rows} />);

    expect(screen.getByText('2026-07-22 09:14')).toBeInTheDocument();
    expect(screen.getByText('危険')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('使用')).toBeInTheDocument();
    expect(screen.getByText('異議')).toBeInTheDocument();
    expect(screen.getByText('判定不能')).toBeInTheDocument();
  });

  it('履歴が0件なら空状態メッセージを表示する', () => {
    render(<HistoryTable rows={[]} />);

    expect(screen.getByTestId('history-empty')).toBeInTheDocument();
  });
});
