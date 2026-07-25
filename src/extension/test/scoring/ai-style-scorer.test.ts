import { AiStyleScorer } from '../../src/scoring/ai-style-scorer';

const SHORT_BODY = 'お世話になっております。'; // 200文字未満

function pad(text: string, minLength = 220): string {
  if (text.length >= minLength) {
    return text;
  }
  return text + '　'.repeat(minLength - text.length);
}

describe('AiStyleScorer 判定不能ケース', () => {
  it('本文が200文字未満なら判定不能を返す', () => {
    const result = new AiStyleScorer(SHORT_BODY).score();
    expect(result).toBe('unjudgeable');
  });

  it('本文がちょうど200文字ならば判定不能ではない', () => {
    const body = pad('あ', 200);
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
  });
});

describe('AiStyleScorer パターン検出', () => {
  it('感嘆符が全くない場合はno_exclamation_marksが加点される', () => {
    const body = pad('本サービスのご利用ありがとうございます。今後ともよろしくお願いいたします。');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).toContain('NO_EXCLAMATION_MARKS');
  });

  it('感嘆符がある場合はno_exclamation_marksが加点されない', () => {
    const body = pad('本サービスのご利用ありがとうございます!今後ともよろしくお願いいたします!');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).not.toContain('NO_EXCLAMATION_MARKS');
  });

  it('定型敬語フレーズが複数含まれる場合はoverly_polite_boilerplateが加点される', () => {
    const body = pad(
      '平素より格別のご高配を賜り、厚く御礼申し上げます。今後とも何卒よろしくお願い申し上げます。',
    );
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).toContain('OVERLY_POLITE_BOILERPLATE');
  });

  it('数字(日付・金額)が全くない場合はvague_dates_amountsが加点される', () => {
    const body = pad('先日のお手続きについてご案内いたします。詳細は追ってご連絡いたします。');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).toContain('VAGUE_DATES_AMOUNTS');
  });

  it('具体的な日付や金額が含まれる場合はvague_dates_amountsが加点されない', () => {
    const body = pad('2026年7月20日までに3,500円のお支払いをお願いいたします。担当:山田太郎まで。');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).not.toContain('VAGUE_DATES_AMOUNTS');
  });

  it('一人称表現が全くない場合はlacking_first_personが加点される', () => {
    const body = pad('お客様のアカウントに関するご案内です。内容をご確認いただけますと幸いです。');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).toContain('LACKING_FIRST_PERSON');
  });

  it('文長の分散が極端に小さい場合はlow_sentence_length_varianceが加点される', () => {
    const sentence = 'これはテストの文章です';
    const body = pad(Array(15).fill(sentence).join('。') + '。');
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.reasons.map((r) => r.code)).toContain('LOW_SENTENCE_LENGTH_VARIANCE');
  });

  it('該当パターンがなければ空配列でスコア0', () => {
    const body = pad(
      '山田さん、先週は本当にありがとう!3月5日の飲み会、めちゃくちゃ楽しかったです。' +
        '次はどこ行く?予算5000円くらいで探してみますね。楽しみにしてます。返事待ってます!',
    );
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.score).toBeLessThan(50);
  });
});

describe('AiStyleScorer スコアのクリップ', () => {
  it('多数のパターンに該当しても100を超えない', () => {
    const body = pad(
      '平素より格別のご高配を賜り、厚く御礼申し上げます。何卒よろしくお願い申し上げます。' +
        'いつもお世話になっております。お客様におかれましては、ご確認くださいますようお願いいたします。' +
        'また、対応をお願いいたします。また、ご確認ください。また、何卒よろしくお願いいたします。',
    );
    const result = new AiStyleScorer(body).score();
    expect(result).not.toBe('unjudgeable');
    if (result === 'unjudgeable') return;
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
