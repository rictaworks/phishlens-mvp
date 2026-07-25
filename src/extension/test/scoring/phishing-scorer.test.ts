import { PhishingScorer } from '../../src/scoring/phishing-scorer';
import type { ScoringEmailInput } from '../../src/scoring/types';

function baseEmail(overrides: Partial<ScoringEmailInput> = {}): ScoringEmailInput {
  return {
    subject: '定期のお知らせ',
    body: 'いつもご利用ありがとうございます。',
    senderDisplayName: 'カスタマーサポート',
    senderDomain: 'example.com',
    authHeaders: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    links: [],
    ...overrides,
  };
}

describe('PhishingScorer 認証ヘッダ評価', () => {
  it('SPF/DKIM/DMARCすべてpassなら-30点', () => {
    const result = new PhishingScorer(baseEmail()).score();
    expect(result.reasons).toContainEqual({ code: 'AUTH_HEADERS_ALL_PASS', delta: -30 });
  });

  it('いずれかfailなら+30点', () => {
    const email = baseEmail({ authHeaders: { spf: 'pass', dkim: 'fail', dmarc: 'pass' } });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'AUTH_HEADERS_ANY_FAIL', delta: 30 });
  });

  it('ヘッダ取得不能なら0点', () => {
    const email = baseEmail({ authHeaders: null });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'AUTH_HEADERS_UNAVAILABLE', delta: 0 });
  });
});

describe('PhishingScorer URL評価', () => {
  it('表示テキストとhrefのドメイン不一致で+25点', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: 'https://amazon.co.jp/account', href: 'https://amaz0n-verify.com/login' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URL_DISPLAY_HREF_MISMATCH', delta: 25 });
  });

  it('短縮URLドメイン該当で+10点', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: '詳細はこちら', href: 'https://bit.ly/abc123' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URL_SHORTENER_DOMAIN', delta: 10 });
  });

  it('punycodeドメインで+25点', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: '確認する', href: 'https://xn--80ak6aa92e.com/login' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URL_PUNYCODE_OR_IP', delta: 25 });
  });

  it('IPアドレス直打ちURLで+25点', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: '確認する', href: 'http://192.168.1.10/login' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URL_PUNYCODE_OR_IP', delta: 25 });
  });

  it('ブランドドメインと編集距離1-2の類似偽ドメインで+30点', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: '確認する', href: 'https://amaz0n.co.jp/login' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URL_BRAND_LOOKALIKE_DOMAIN', delta: 30 });
  });

  it('ブランドドメインと完全一致するリンクは類似偽装として扱わない', () => {
    const email = baseEmail({
      authHeaders: null,
      links: [{ displayText: '確認する', href: 'https://amazon.co.jp/login' }],
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).not.toContainEqual(
      expect.objectContaining({ code: 'URL_BRAND_LOOKALIKE_DOMAIN' }),
    );
  });
});

describe('PhishingScorer 緊急性キーワード評価', () => {
  it('1件該当で+5点', () => {
    const email = baseEmail({ authHeaders: null, body: '至急ご確認ください。' });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URGENCY_KEYWORDS_MATCHED', delta: 5 });
  });

  it('上限は+20点', () => {
    const email = baseEmail({
      authHeaders: null,
      body: '至急、緊急、直ちに、今すぐ、最終通知、重要なお知らせをご確認ください。',
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'URGENCY_KEYWORDS_MATCHED', delta: 20 });
  });
});

describe('PhishingScorer 認証情報要求表現評価', () => {
  it('該当表現があれば+20点', () => {
    const email = baseEmail({ authHeaders: null, body: '本人確認のためパスワードを入力してください。' });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'CREDENTIAL_REQUEST_DETECTED', delta: 20 });
  });
});

describe('PhishingScorer 送信者ブランド不一致評価', () => {
  it('表示名がブランドマスタに一致し送信ドメインが不一致なら+25点', () => {
    const email = baseEmail({
      authHeaders: null,
      senderDisplayName: 'Amazon',
      senderDomain: 'amaz0n-verify.com',
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).toContainEqual({ code: 'SENDER_BRAND_DOMAIN_MISMATCH', delta: 25 });
  });

  it('送信ドメインが公式ドメインと一致すれば加点しない', () => {
    const email = baseEmail({
      authHeaders: null,
      senderDisplayName: 'Amazon',
      senderDomain: 'amazon.co.jp',
    });
    const result = new PhishingScorer(email).score();
    expect(result.reasons).not.toContainEqual(
      expect.objectContaining({ code: 'SENDER_BRAND_DOMAIN_MISMATCH' }),
    );
  });
});

describe('PhishingScorer 合計スコアのクリップ', () => {
  it('100点を超える場合は100にクリップする', () => {
    const email: ScoringEmailInput = {
      subject: '【重要】至急、緊急のご連絡',
      body: '至急、緊急、直ちに、今すぐ、最終通知のご連絡です。本人確認のためパスワードを入力してください。',
      senderDisplayName: 'Amazon',
      senderDomain: 'amaz0n-verify.com',
      authHeaders: { spf: 'fail', dkim: 'fail', dmarc: 'fail' },
      links: [
        { displayText: 'https://amazon.co.jp/account', href: 'https://amaz0n.co.jp/login' },
      ],
    };
    const result = new PhishingScorer(email).score();
    expect(result.score).toBe(100);
  });

  it('0点を下回る場合は0にクリップする', () => {
    const result = new PhishingScorer(baseEmail()).score();
    expect(result.score).toBe(0);
  });
});
