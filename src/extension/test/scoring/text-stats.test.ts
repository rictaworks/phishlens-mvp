import { computeTextStats, countOccurrences, variance } from '../../src/scoring/text-stats';

describe('variance', () => {
  it('全て同じ値なら0', () => {
    expect(variance([5, 5, 5])).toBe(0);
  });

  it('値がばらつく場合は0より大きい', () => {
    expect(variance([1, 10, 100])).toBeGreaterThan(0);
  });

  it('空配列は0', () => {
    expect(variance([])).toBe(0);
  });
});

describe('countOccurrences', () => {
  it('重複を含む出現回数を数える', () => {
    expect(countOccurrences('また明日、また来週', 'また')).toBe(2);
  });

  it('該当しなければ0', () => {
    expect(countOccurrences('こんにちは', 'さようなら')).toBe(0);
  });
});

describe('computeTextStats', () => {
  it('文・段落・記号の統計を計算する', () => {
    const stats = computeTextStats('これは1文目です。これは2文目ですか?\n\n次の段落です!');
    expect(stats.sentences.length).toBeGreaterThanOrEqual(2);
    expect(stats.questionCount).toBe(1);
    expect(stats.exclamationCount).toBe(1);
    expect(stats.hasDigit).toBe(true);
    expect(stats.paragraphs.length).toBe(2);
  });
});
