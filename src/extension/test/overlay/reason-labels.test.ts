import { labelForReasonCode } from '../../src/overlay/reason-labels';

describe('labelForReasonCode', () => {
  it('固定のフィッシング根拠コードを日本語ラベルへ変換する', () => {
    expect(labelForReasonCode('URL_SHORTENER_DOMAIN')).toBe('短縮URLが使用されています');
    expect(labelForReasonCode('SENDER_BRAND_DOMAIN_MISMATCH')).toBe(
      '送信者表示名とドメインが一致しないブランドなりすましの疑いがあります',
    );
    expect(labelForReasonCode('AUTH_HEADERS_UNAVAILABLE')).toBe('送信者認証ヘッダを取得できませんでした');
  });

  it('AI文体マスタ由来のコードはマスタのdescriptionを大文字小文字を問わず返す', () => {
    expect(labelForReasonCode('NO_EXCLAMATION_MARKS')).toBe('感嘆符が一切使用されていない');
  });

  it('未知のコードはコード自体をフォールバックとして返す', () => {
    expect(labelForReasonCode('UNKNOWN_CODE_X')).toBe('UNKNOWN_CODE_X');
  });
});
