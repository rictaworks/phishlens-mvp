// 単一文字クラスの単純な+のみを使い、入れ子の量指定子によるReDoSを避ける。
const DOMAIN_TOKEN_PATTERN = /[a-z0-9.-]+/gi;
const DOMAIN_TLD_PATTERN = /^[a-z]{2,}$/i;
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function extractDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function looksLikeDomain(token: string): boolean {
  const labels = token.split('.');
  if (labels.length < 2) {
    return false;
  }
  const tld = labels[labels.length - 1];
  if (!DOMAIN_TLD_PATTERN.test(tld)) {
    return false;
  }
  return labels.every((label) => label.length > 0 && !label.startsWith('-') && !label.endsWith('-'));
}

export function extractDomainFromText(text: string): string | null {
  const tokens = text.match(DOMAIN_TOKEN_PATTERN) ?? [];
  const domain = tokens.find((token) => looksLikeDomain(token));
  return domain ? domain.toLowerCase() : null;
}

export function isPunycodeDomain(domain: string): boolean {
  return domain
    .toLowerCase()
    .split('.')
    .some((label) => label.startsWith('xn--'));
}

export function isIpAddressDomain(domain: string): boolean {
  const match = domain.match(IPV4_PATTERN);
  if (!match) {
    return false;
  }
  return match.slice(1).every((octet) => Number(octet) <= 255);
}

export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    table[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    table[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      table[i][j] = Math.min(
        table[i - 1][j] + 1,
        table[i][j - 1] + 1,
        table[i - 1][j - 1] + cost,
      );
    }
  }

  return table[rows - 1][cols - 1];
}
