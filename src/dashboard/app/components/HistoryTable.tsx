import type { JudgementHistoryRow } from '../../lib/types';
import { formatAiGenScore, formatJudgedAt } from '../../lib/format';
import { CategoryBadge } from './CategoryBadge';

interface HistoryTableProps {
  rows: JudgementHistoryRow[];
}

export function HistoryTable({ rows }: HistoryTableProps) {
  if (rows.length === 0) {
    return <p data-testid="history-empty">判定履歴はまだありません。</p>;
  }

  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>区分</th>
          <th>フィッシング</th>
          <th>AI生成</th>
          <th>枠利用</th>
          <th>フィードバック</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{formatJudgedAt(row.judgedAt)}</td>
            <td>
              <CategoryBadge categoryCode={row.categoryCode} label={row.categoryLabel} />
            </td>
            <td>{row.phishingScore}</td>
            <td>{formatAiGenScore(row.aiGenScore)}</td>
            <td>{row.quotaUsed ? '使用' : '未使用'}</td>
            <td>{row.feedbackLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
