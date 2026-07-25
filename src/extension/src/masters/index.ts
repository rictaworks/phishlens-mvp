import urgencyKeywordsData from '../../config/masters/urgency-keywords.json';
import brandDomainsData from '../../config/masters/brand-domains.json';
import shortenerDomainsData from '../../config/masters/shortener-domains.json';
import aiStylePatternsData from '../../config/masters/ai-style-patterns.json';
import judgementCategoriesData from '../../config/masters/judgement-categories.json';
import feedbackCategoriesData from '../../config/masters/feedback-categories.json';
import type {
  UrgencyKeyword,
  BrandDomain,
  ShortenerDomain,
  AiStylePattern,
  JudgementCategory,
  FeedbackCategory,
} from './types';

export const urgencyKeywords: UrgencyKeyword[] = urgencyKeywordsData as UrgencyKeyword[];
export const brandDomains: BrandDomain[] = brandDomainsData as BrandDomain[];
export const shortenerDomains: ShortenerDomain[] = shortenerDomainsData as ShortenerDomain[];
export const aiStylePatterns: AiStylePattern[] = aiStylePatternsData as AiStylePattern[];
export const judgementCategories: JudgementCategory[] = judgementCategoriesData as JudgementCategory[];
export const feedbackCategories: FeedbackCategory[] = feedbackCategoriesData as FeedbackCategory[];

export type {
  UrgencyKeyword,
  BrandDomain,
  ShortenerDomain,
  AiStylePattern,
  JudgementCategory,
  FeedbackCategory,
};
