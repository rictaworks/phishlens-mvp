import type { IsoDateTimeString, LanguageCode } from "./common";

export interface UrgencyKeywordMasterItem {
  keyword: string;
  language: LanguageCode;
}

export interface BrandDomainMasterItem {
  brandName: string;
  officialDomain: string;
}

export interface ShortenerDomainMasterItem {
  domain: string;
}

export interface AiStylePatternMasterItem {
  patternCode: string;
  description: string;
  weight: 10 | 15 | 20;
}

export interface MasterDataSet {
  urgencyKeywords: UrgencyKeywordMasterItem[];
  brandDomains: BrandDomainMasterItem[];
  shortenerDomains: ShortenerDomainMasterItem[];
  aiStylePatterns: AiStylePatternMasterItem[];
}

export interface MasterDataResponse {
  generatedAt: IsoDateTimeString;
  data: MasterDataSet;
}

