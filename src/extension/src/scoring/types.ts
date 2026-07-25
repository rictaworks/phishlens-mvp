export type AuthHeaderResult = 'pass' | 'fail' | 'unknown';

export interface AuthHeaders {
  spf: AuthHeaderResult;
  dkim: AuthHeaderResult;
  dmarc: AuthHeaderResult;
}

export interface EmailLink {
  displayText: string;
  href: string;
}

export interface ScoringEmailInput {
  subject: string;
  body: string;
  senderDisplayName: string;
  senderDomain: string;
  /** ヘッダが取得できなかった場合は null */
  authHeaders: AuthHeaders | null;
  links: EmailLink[];
}

export interface ScoreReason {
  code: string;
  delta: number;
}

export interface ScoreResult {
  score: number;
  reasons: ScoreReason[];
}
