import { KpiTile } from './components/KpiTile';
import { HistoryTable } from './components/HistoryTable';
import { sampleHistory, sampleKpis } from '../lib/sample-data';

export default function HomePage() {
  return (
    <main>
      <h1>PhishLens ダッシュボード</h1>
      <section aria-label="KPI" className="kpi-row">
        <KpiTile label="判定実行数" value={String(sampleKpis.judgementCount)} />
        <KpiTile label="AI枠消費率" value={`${sampleKpis.quotaUsageRate}%`} />
        <KpiTile label="フィードバック率" value={`${sampleKpis.feedbackRate}%`} />
      </section>
      <section aria-label="判定履歴">
        <HistoryTable rows={sampleHistory} />
      </section>
      <p className="privacy-note">
        本文・件名・送信元アドレスは保存されません。履歴にはスコア・区分・根拠コード・本文ハッシュのみ保持されます。
      </p>
    </main>
  );
}
