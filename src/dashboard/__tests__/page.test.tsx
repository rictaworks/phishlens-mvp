import { act, render, screen, waitFor } from '@testing-library/react';
import HomePage from '../app/page';
import { DashboardApiError, fetchHistory, fetchKpis } from '../lib/api-client';
import { clearIdToken, getIdToken, isTokenExpired } from '../lib/auth/token-store';
import { isApiBaseUrlConfigured, isGoogleAuthConfigured } from '../lib/config';

jest.mock('../lib/api-client', () => ({
  ...jest.requireActual('../lib/api-client'),
  fetchHistory: jest.fn(),
  fetchKpis: jest.fn(),
}));
jest.mock('../lib/auth/token-store');
jest.mock('../lib/config', () => ({
  ...jest.requireActual('../lib/config'),
  isGoogleAuthConfigured: jest.fn(),
  isApiBaseUrlConfigured: jest.fn(),
}));
jest.mock('../app/components/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onCredential }: { onCredential: (idToken: string) => void }) => (
    <button type="button" onClick={() => onCredential('fresh-id-token')}>
      Googleでログイン(モック)
    </button>
  ),
}));

const mockedFetchHistory = fetchHistory as jest.Mock;
const mockedFetchKpis = fetchKpis as jest.Mock;
const mockedGetIdToken = getIdToken as jest.Mock;
const mockedIsTokenExpired = isTokenExpired as jest.Mock;
const mockedClearIdToken = clearIdToken as jest.Mock;
const mockedIsGoogleAuthConfigured = isGoogleAuthConfigured as jest.Mock;
const mockedIsApiBaseUrlConfigured = isApiBaseUrlConfigured as jest.Mock;

const sampleKpis = { judgementCount: 128, quotaUsageRate: 62, feedbackRate: 34 };
const sampleHistory = [
  {
    id: '1',
    judgedAt: '2026-07-22T09:14:00+09:00',
    categoryCode: 'danger' as const,
    categoryLabel: '危険',
    phishingScore: 78,
    aiGenScore: 65,
    quotaUsed: true,
    feedbackLabel: '異議',
    bodySha256: 'abc',
    reasons: [],
  },
];

describe('HomePage', () => {
  beforeEach(() => {
    mockedIsGoogleAuthConfigured.mockReturnValue(true);
    mockedIsApiBaseUrlConfigured.mockReturnValue(true);
    mockedGetIdToken.mockReturnValue(null);
    mockedIsTokenExpired.mockReturnValue(true);
    mockedFetchKpis.mockResolvedValue(sampleKpis);
    mockedFetchHistory.mockResolvedValue(sampleHistory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('見出しを表示する', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'PhishLens ダッシュボード' })).toBeInTheDocument();
  });

  it('未サインイン時はサインインボタンを表示する', () => {
    render(<HomePage />);
    expect(screen.getByText('Googleでログイン(モック)')).toBeInTheDocument();
  });

  it('サインイン後、読み込み中を経てKPI・履歴を表示する', async () => {
    render(<HomePage />);

    await act(async () => {
      screen.getByText('Googleでログイン(モック)').click();
    });

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument());
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('34%')).toBeInTheDocument();
    expect(screen.getByText('危険')).toBeInTheDocument();
  });

  it('保存済みの有効なトークンがあれば自動的に読み込む', async () => {
    mockedGetIdToken.mockReturnValue('saved-token');
    mockedIsTokenExpired.mockReturnValue(false);

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument());
    expect(mockedFetchKpis).toHaveBeenCalledWith(expect.objectContaining({ idToken: 'saved-token' }));
  });

  it('APIエラー時はエラーメッセージと再試行ボタンを表示する', async () => {
    mockedFetchKpis.mockRejectedValue(new Error('ネットワークエラー'));

    render(<HomePage />);
    await act(async () => {
      screen.getByText('Googleでログイン(モック)').click();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument());
    expect(screen.getByText('ネットワークエラー')).toBeInTheDocument();
  });

  it('再試行ボタンでデータ取得を再実行する', async () => {
    mockedFetchKpis.mockRejectedValueOnce(new Error('ネットワークエラー'));

    render(<HomePage />);
    await act(async () => {
      screen.getByText('Googleでログイン(モック)').click();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button', { name: '再試行' }).click();
    });

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument());
  });

  it('401エラー時はトークンを破棄しサインイン画面へ戻す', async () => {
    mockedFetchKpis.mockRejectedValue(new DashboardApiError(401, '認証エラー'));

    render(<HomePage />);
    await act(async () => {
      screen.getByText('Googleでログイン(モック)').click();
    });

    await waitFor(() => expect(mockedClearIdToken).toHaveBeenCalled());
    expect(screen.getByText('Googleでログイン(モック)')).toBeInTheDocument();
  });

  it('Google認証未設定なら設定手順メッセージを表示する', () => {
    mockedIsGoogleAuthConfigured.mockReturnValue(false);

    render(<HomePage />);

    expect(screen.queryByText('Googleでログイン(モック)')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
