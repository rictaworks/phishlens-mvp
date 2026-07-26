import { DashboardApiError, fetchHistory, fetchKpis } from '../../lib/api-client';

const API_BASE_URL = 'https://api.example.test';
const ID_TOKEN = 'id-token-value';

describe('api-client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('fetchHistory', () => {
    it('GET /api/judgementsを呼びsnake_caseをcamelCaseへ変換する', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          judgements: [
            {
              id: 42,
              judged_at: '2026-07-22T09:14:00+09:00',
              category_code: 'danger',
              category_label: '危険',
              phishing_score: 78,
              ai_gen_score: 65,
              ai_detail_used: true,
              feedback_label: '異議',
              body_sha256: 'abc123',
              reasons: [{ code: 'AUTH_HEADERS_ANY_FAIL', delta: 30 }],
            },
          ],
        }),
      });

      const rows = await fetchHistory({ apiBaseUrl: API_BASE_URL, idToken: ID_TOKEN });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/judgements`,
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${ID_TOKEN}` }) }),
      );
      expect(rows).toEqual([
        {
          id: '42',
          judgedAt: '2026-07-22T09:14:00+09:00',
          categoryCode: 'danger',
          categoryLabel: '危険',
          phishingScore: 78,
          aiGenScore: 65,
          quotaUsed: true,
          feedbackLabel: '異議',
          bodySha256: 'abc123',
          reasons: [{ code: 'AUTH_HEADERS_ANY_FAIL', delta: 30 }],
        },
      ]);
    });

    it('feedback_labelがnullなら「—」に変換する', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          judgements: [
            {
              id: 1,
              judged_at: '2026-07-22T09:14:00+09:00',
              category_code: 'safe',
              category_label: '安全',
              phishing_score: 5,
              ai_gen_score: null,
              ai_detail_used: false,
              feedback_label: null,
              body_sha256: 'abc123',
              reasons: [],
            },
          ],
        }),
      });

      const rows = await fetchHistory({ apiBaseUrl: API_BASE_URL, idToken: ID_TOKEN });
      expect(rows[0].feedbackLabel).toBe('—');
    });

    it('レスポンスが非2xxならDashboardApiErrorを送出する', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: '認証エラー' }),
      });

      await expect(fetchHistory({ apiBaseUrl: API_BASE_URL, idToken: ID_TOKEN })).rejects.toThrow(DashboardApiError);
    });
  });

  describe('fetchKpis', () => {
    it('GET /api/judgements/kpisを呼びsnake_caseをcamelCaseへ変換する', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ judgement_count: 128, quota_usage_rate: 62, feedback_rate: 34 }),
      });

      const kpis = await fetchKpis({ apiBaseUrl: API_BASE_URL, idToken: ID_TOKEN });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/judgements/kpis`,
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${ID_TOKEN}` }) }),
      );
      expect(kpis).toEqual({ judgementCount: 128, quotaUsageRate: 62, feedbackRate: 34 });
    });

    it('レスポンスが非2xxならDashboardApiErrorを送出する' , async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('no body'); },
      });

      await expect(fetchKpis({ apiBaseUrl: API_BASE_URL, idToken: ID_TOKEN })).rejects.toThrow(DashboardApiError);
    });
  });
});
