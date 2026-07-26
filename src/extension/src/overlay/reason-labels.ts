import { aiStylePatterns } from '../masters';

/**
 * Issue #37準拠。PhishingScorer/AiStyleScorer(クライアント側)およびRails API(サーバー側)が
 * 返す根拠コード(reasons[].code)を、JudgementOverlayが表示する日本語文字列にマッピングする。
 *
 * フィッシングスコアの根拠コードは固定の算出ロジック由来(phishing-scorer.ts参照)のため静的に定義する。
 * AI生成スコアの根拠コードはマスタデータ(ai-style-patterns.json)のpattern_code由来のため、
 * マスタのdescriptionをそのままラベルとして引く。
 */
const PHISHING_REASON_LABELS: Readonly<Record<string, string>> = {
  AUTH_HEADERS_UNAVAILABLE: '送信者認証ヘッダを取得できませんでした',
  AUTH_HEADERS_ALL_PASS: '送信者認証(SPF/DKIM/DMARC)はすべて成功しています',
  AUTH_HEADERS_ANY_FAIL: '送信者認証(SPF/DKIM/DMARC)のいずれかが失敗しています',
  AUTH_HEADERS_MIXED: '送信者認証の結果が一部不明です',
  URL_DISPLAY_HREF_MISMATCH: '表示テキストとリンク先URLのドメインが一致していません',
  URL_SHORTENER_DOMAIN: '短縮URLが使用されています',
  URL_PUNYCODE_OR_IP: 'punycodeまたはIPアドレス直打ちのURLが含まれています',
  URL_BRAND_LOOKALIKE_DOMAIN: 'ブランドドメインに酷似した偽装URLが含まれています',
  URGENCY_KEYWORDS_MATCHED: '緊急性・脅迫を煽る表現が含まれています',
  CREDENTIAL_REQUEST_DETECTED: '認証情報・個人情報の入力を要求する表現が含まれています',
  SENDER_BRAND_DOMAIN_MISMATCH: '送信者表示名とドメインが一致しないブランドなりすましの疑いがあります',
};

function findAiStylePatternLabel(code: string): string | undefined {
  const pattern = aiStylePatterns.find((candidate) => candidate.pattern_code.toUpperCase() === code);
  return pattern?.description;
}

/**
 * 未知の根拠コード(将来的なAPI側の追加等)についてはコード自体をフォールバック表示する。
 */
export function labelForReasonCode(code: string): string {
  return PHISHING_REASON_LABELS[code] ?? findAiStylePatternLabel(code) ?? code;
}
