import credentialRequestPhrasesData from '../../config/credential-request-phrases.json';
import { brandDomains, shortenerDomains, urgencyKeywords } from '../masters';
import {
  extractDomainFromText,
  extractDomainFromUrl,
  isIpAddressDomain,
  isPunycodeDomain,
  levenshteinDistance,
} from './utils';
import type { ScoreReason, ScoreResult, ScoringEmailInput } from './types';

interface CredentialRequestPhrase {
  id: number;
  phrase: string;
  lang: 'ja' | 'en';
}

const credentialRequestPhrases: CredentialRequestPhrase[] =
  credentialRequestPhrasesData as CredentialRequestPhrase[];

const URGENCY_KEYWORD_POINTS_PER_MATCH = 5;
const URGENCY_KEYWORD_POINTS_MAX = 20;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const BRAND_LOOKALIKE_MIN_DISTANCE = 1;
const BRAND_LOOKALIKE_MAX_DISTANCE = 2;

function stripSubdomain(domain: string): string {
  return domain.toLowerCase();
}

function isSameOrSubdomain(domain: string, officialDomain: string): boolean {
  const normalizedDomain = stripSubdomain(domain);
  const normalizedOfficial = stripSubdomain(officialDomain);
  return normalizedDomain === normalizedOfficial || normalizedDomain.endsWith(`.${normalizedOfficial}`);
}

export class PhishingScorer {
  constructor(private readonly email: ScoringEmailInput) {}

  evalAuthHeaders(): ScoreReason[] {
    const headers = this.email.authHeaders;
    if (!headers) {
      return [{ code: 'AUTH_HEADERS_UNAVAILABLE', delta: 0 }];
    }

    const values = [headers.spf, headers.dkim, headers.dmarc];
    if (values.every((value) => value === 'pass')) {
      return [{ code: 'AUTH_HEADERS_ALL_PASS', delta: -30 }];
    }
    if (values.some((value) => value === 'fail')) {
      return [{ code: 'AUTH_HEADERS_ANY_FAIL', delta: 30 }];
    }
    return [{ code: 'AUTH_HEADERS_MIXED', delta: 0 }];
  }

  evalUrls(): ScoreReason[] {
    const reasons: ScoreReason[] = [];
    const links = this.email.links;

    const hasMismatch = links.some((link) => {
      const displayDomain = extractDomainFromText(link.displayText);
      const hrefDomain = extractDomainFromUrl(link.href);
      return displayDomain !== null && hrefDomain !== null && displayDomain !== hrefDomain;
    });
    if (hasMismatch) {
      reasons.push({ code: 'URL_DISPLAY_HREF_MISMATCH', delta: 25 });
    }

    const hasShortener = links.some((link) => {
      const hrefDomain = extractDomainFromUrl(link.href);
      return hrefDomain !== null && shortenerDomains.some((s) => s.domain === hrefDomain);
    });
    if (hasShortener) {
      reasons.push({ code: 'URL_SHORTENER_DOMAIN', delta: 10 });
    }

    const hasPunycodeOrIp = links.some((link) => {
      const hrefDomain = extractDomainFromUrl(link.href);
      return hrefDomain !== null && (isPunycodeDomain(hrefDomain) || isIpAddressDomain(hrefDomain));
    });
    if (hasPunycodeOrIp) {
      reasons.push({ code: 'URL_PUNYCODE_OR_IP', delta: 25 });
    }

    const hasBrandLookalike = links.some((link) => {
      const hrefDomain = extractDomainFromUrl(link.href);
      if (hrefDomain === null) {
        return false;
      }
      return brandDomains.some((brand) => {
        if (hrefDomain === brand.official_domain) {
          return false;
        }
        const distance = levenshteinDistance(hrefDomain, brand.official_domain);
        return distance >= BRAND_LOOKALIKE_MIN_DISTANCE && distance <= BRAND_LOOKALIKE_MAX_DISTANCE;
      });
    });
    if (hasBrandLookalike) {
      reasons.push({ code: 'URL_BRAND_LOOKALIKE_DOMAIN', delta: 30 });
    }

    return reasons;
  }

  evalUrgency(): ScoreReason[] {
    const text = `${this.email.subject} ${this.email.body}`.toLowerCase();
    const matchCount = urgencyKeywords.filter((keyword) => text.includes(keyword.keyword.toLowerCase()))
      .length;
    if (matchCount === 0) {
      return [];
    }
    const delta = Math.min(matchCount * URGENCY_KEYWORD_POINTS_PER_MATCH, URGENCY_KEYWORD_POINTS_MAX);
    return [{ code: 'URGENCY_KEYWORDS_MATCHED', delta }];
  }

  evalCredentialRequest(): ScoreReason[] {
    const text = `${this.email.subject} ${this.email.body}`.toLowerCase();
    const matched = credentialRequestPhrases.some((phrase) => text.includes(phrase.phrase.toLowerCase()));
    return matched ? [{ code: 'CREDENTIAL_REQUEST_DETECTED', delta: 20 }] : [];
  }

  evalBrandMismatch(): ScoreReason[] {
    const displayName = this.email.senderDisplayName.toLowerCase();
    const matchedBrand = brandDomains.find((brand) => displayName.includes(brand.brand_name.toLowerCase()));
    if (!matchedBrand) {
      return [];
    }
    if (isSameOrSubdomain(this.email.senderDomain, matchedBrand.official_domain)) {
      return [];
    }
    return [{ code: 'SENDER_BRAND_DOMAIN_MISMATCH', delta: 25 }];
  }

  score(): ScoreResult {
    const reasons = [
      ...this.evalAuthHeaders(),
      ...this.evalUrls(),
      ...this.evalUrgency(),
      ...this.evalCredentialRequest(),
      ...this.evalBrandMismatch(),
    ];
    const rawScore = reasons.reduce((total, reason) => total + reason.delta, 0);
    const score = Math.min(SCORE_MAX, Math.max(SCORE_MIN, rawScore));
    return { score, reasons };
  }
}
