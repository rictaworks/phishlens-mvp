import { formatAiGenScore, formatJudgedAt } from '../../lib/format';

describe('formatJudgedAt', () => {
  it('ISO日時をYYYY-MM-DD HH:mm形式に変換する', () => {
    expect(formatJudgedAt('2026-07-22T09:14:00+09:00')).toBe('2026-07-22 09:14');
  });
});

describe('formatAiGenScore', () => {
  it('数値であればそのまま返す', () => {
    expect(formatAiGenScore(65)).toBe('65');
  });

  it('nullなら判定不能を返す', () => {
    expect(formatAiGenScore(null)).toBe('判定不能');
  });
});
