export interface UrgencyKeyword {
  id: number;
  keyword: string;
  lang: 'ja' | 'en';
}

export interface BrandDomain {
  id: number;
  brand_name: string;
  official_domain: string;
}

export interface ShortenerDomain {
  id: number;
  domain: string;
}

export interface AiStylePattern {
  id: number;
  pattern_code: string;
  description: string;
  weight: number;
}

export interface JudgementCategory {
  code: 'danger' | 'caution' | 'safe';
  label: string;
  threshold_min: number;
  icon: string;
}

export interface FeedbackCategory {
  code: 'agree' | 'dispute' | 'unknown';
  label: string;
}
