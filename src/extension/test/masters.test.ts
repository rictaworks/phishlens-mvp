import {
  urgencyKeywords,
  brandDomains,
  shortenerDomains,
  aiStylePatterns,
  judgementCategories,
  feedbackCategories,
} from '../src/masters';

describe('urgencyKeywords', () => {
  it('30件、日英を含む', () => {
    expect(urgencyKeywords).toHaveLength(30);
    expect(urgencyKeywords.some((k) => k.lang === 'ja')).toBe(true);
    expect(urgencyKeywords.some((k) => k.lang === 'en')).toBe(true);
  });

  it('idが重複しない', () => {
    const ids = urgencyKeywords.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('brandDomains', () => {
  it('50件', () => {
    expect(brandDomains).toHaveLength(50);
  });

  it('各要素がbrand_nameとofficial_domainを持つ', () => {
    for (const brand of brandDomains) {
      expect(typeof brand.brand_name).toBe('string');
      expect(brand.brand_name.length).toBeGreaterThan(0);
      expect(typeof brand.official_domain).toBe('string');
      expect(brand.official_domain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/i);
    }
  });
});

describe('shortenerDomains', () => {
  it('20件', () => {
    expect(shortenerDomains).toHaveLength(20);
  });
});

describe('aiStylePatterns', () => {
  it('20件、weightは10〜20の範囲', () => {
    expect(aiStylePatterns).toHaveLength(20);
    for (const pattern of aiStylePatterns) {
      expect(pattern.weight).toBeGreaterThanOrEqual(10);
      expect(pattern.weight).toBeLessThanOrEqual(20);
    }
  });
});

describe('judgementCategories', () => {
  it('危険/注意/安全の3件', () => {
    expect(judgementCategories).toHaveLength(3);
    expect(judgementCategories.map((c) => c.code).sort()).toEqual(['caution', 'danger', 'safe']);
  });
});

describe('feedbackCategories', () => {
  it('同意/異議/不明の3件', () => {
    expect(feedbackCategories).toHaveLength(3);
    expect(feedbackCategories.map((c) => c.code).sort()).toEqual(['agree', 'dispute', 'unknown']);
  });
});
