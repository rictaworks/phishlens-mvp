import {
  extractDomainFromUrl,
  extractDomainFromText,
  isPunycodeDomain,
  isIpAddressDomain,
  levenshteinDistance,
} from '../../src/scoring/utils';

describe('extractDomainFromUrl', () => {
  it('httpsのURLからホスト名を小文字で取得する', () => {
    expect(extractDomainFromUrl('https://Example.com/path')).toBe('example.com');
  });

  it('不正なURLはnullを返す', () => {
    expect(extractDomainFromUrl('not a url')).toBeNull();
  });
});

describe('extractDomainFromText', () => {
  it('URLらしき文字列を含むテキストからドメインを抽出する', () => {
    expect(extractDomainFromText('こちら amazon.co.jp をご確認ください')).toBe('amazon.co.jp');
  });

  it('ドメインらしき文字列を含まないテキストはnullを返す', () => {
    expect(extractDomainFromText('アカウントを確認する')).toBeNull();
  });
});

describe('isPunycodeDomain', () => {
  it('xn--を含むラベルがあればtrue', () => {
    expect(isPunycodeDomain('xn--80ak6aa92e.com')).toBe(true);
  });

  it('通常のドメインはfalse', () => {
    expect(isPunycodeDomain('example.com')).toBe(false);
  });
});

describe('isIpAddressDomain', () => {
  it('IPv4アドレスはtrue', () => {
    expect(isIpAddressDomain('192.168.1.1')).toBe(true);
  });

  it('通常のドメインはfalse', () => {
    expect(isIpAddressDomain('example.com')).toBe(false);
  });
});

describe('levenshteinDistance', () => {
  it('同一文字列は0', () => {
    expect(levenshteinDistance('amazon.co.jp', 'amazon.co.jp')).toBe(0);
  });

  it('1文字違いは1', () => {
    expect(levenshteinDistance('amazon.co.jp', 'amaz0n.co.jp')).toBe(1);
  });

  it('2文字違いは2', () => {
    expect(levenshteinDistance('amazon.co.jp', 'amaz0n.c0.jp')).toBe(2);
  });
});
