'use client';

import { useCallback, useEffect, useState } from 'react';
import { KpiTile } from './components/KpiTile';
import { HistoryTable } from './components/HistoryTable';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { DashboardApiError, fetchHistory, fetchKpis } from '../lib/api-client';
import { clearIdToken, getIdToken, isTokenExpired, setIdToken } from '../lib/auth/token-store';
import {
  API_BASE_URL,
  GOOGLE_OAUTH_CLIENT_ID,
  GoogleAuthNotConfiguredError,
  isApiBaseUrlConfigured,
  isGoogleAuthConfigured,
} from '../lib/config';
import type { DashboardKpis, JudgementHistoryRow } from '../lib/types';

type DashboardState =
  | { status: 'signed-out' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; kpis: DashboardKpis; history: JudgementHistoryRow[] };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '不明なエラーが発生しました';
}

export default function HomePage() {
  const [state, setState] = useState<DashboardState>({ status: 'signed-out' });
  const [activeIdToken, setActiveIdToken] = useState<string | null>(null);

  const loadData = useCallback(async (idToken: string) => {
    setState({ status: 'loading' });

    try {
      const [kpis, history] = await Promise.all([
        fetchKpis({ apiBaseUrl: API_BASE_URL, idToken }),
        fetchHistory({ apiBaseUrl: API_BASE_URL, idToken }),
      ]);
      setState({ status: 'ready', kpis, history });
    } catch (error) {
      if (error instanceof DashboardApiError && error.status === 401) {
        clearIdToken();
        setActiveIdToken(null);
        setState({ status: 'signed-out' });
        return;
      }
      setState({ status: 'error', message: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    const token = getIdToken();
    if (token !== null && !isTokenExpired(token)) {
      setActiveIdToken(token);
      void loadData(token);
    }
  }, [loadData]);

  const handleCredential = useCallback(
    (idToken: string) => {
      setIdToken(idToken);
      setActiveIdToken(idToken);
      void loadData(idToken);
    },
    [loadData],
  );

  const handleRetry = useCallback(() => {
    if (activeIdToken === null) {
      setState({ status: 'signed-out' });
      return;
    }
    void loadData(activeIdToken);
  }, [activeIdToken, loadData]);

  const configured = isGoogleAuthConfigured() && isApiBaseUrlConfigured();

  return (
    <main>
      <h1>PhishLens ダッシュボード</h1>

      {state.status === 'signed-out' && (
        <section aria-label="サインイン">
          <p>Googleアカウントでログインすると判定履歴とKPIを確認できます。</p>
          {configured ? (
            <GoogleSignInButton clientId={GOOGLE_OAUTH_CLIENT_ID} onCredential={handleCredential} />
          ) : (
            <p role="alert">{new GoogleAuthNotConfiguredError().message}</p>
          )}
        </section>
      )}

      {state.status === 'loading' && <p role="status">読み込み中...</p>}

      {state.status === 'error' && (
        <section role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={handleRetry}>
            再試行
          </button>
        </section>
      )}

      {state.status === 'ready' && (
        <>
          <section aria-label="KPI" className="kpi-row">
            <KpiTile label="判定実行数" value={String(state.kpis.judgementCount)} />
            <KpiTile label="AI枠消費率" value={`${state.kpis.quotaUsageRate}%`} />
            <KpiTile label="フィードバック率" value={`${state.kpis.feedbackRate}%`} />
          </section>
          <section aria-label="判定履歴">
            <HistoryTable rows={state.history} />
          </section>
        </>
      )}

      <p className="privacy-note">
        本文・件名・送信元アドレスは保存されません。履歴にはスコア・区分・根拠コード・本文ハッシュのみ保持されます。
      </p>
    </main>
  );
}
