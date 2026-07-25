import { EmailExtractor, EmailExtractionError } from '../../src/extraction/email-extractor';

function buildDom(html: string): Document {
  document.body.innerHTML = html;
  return document;
}

describe('EmailExtractor 抽出成功', () => {
  it('件名・送信者・本文・リンクを抽出する', () => {
    const dom = buildDom(`
      <h2 class="hP">【重要】アカウントの確認が必要です</h2>
      <span class="gD" email="security-support@amaz0n-verify.com" name="Amazon"></span>
      <div class="a3s aiL">
        お客様のアカウントで不審なログインが検出されました。
        <a href="https://amaz0n-verify.com/login">アカウントを確認する</a>
      </div>
    `);

    const extracted = new EmailExtractor().extract(dom);

    expect(extracted.subject).toBe('【重要】アカウントの確認が必要です');
    expect(extracted.senderDisplayName).toBe('Amazon');
    expect(extracted.senderDomain).toBe('amaz0n-verify.com');
    expect(extracted.body).toContain('不審なログインが検出されました');
    expect(extracted.links).toEqual([
      { displayText: 'アカウントを確認する', href: 'https://amaz0n-verify.com/login' },
    ]);
    expect(extracted.authHeaders).toBeNull();
  });

  it('送信者のname属性がない場合はテキスト内容を表示名として使う', () => {
    const dom = buildDom(`
      <h2 class="hP">件名</h2>
      <span class="gD" email="staff@example.com">経理部</span>
      <div class="a3s aiL">本文です。</div>
    `);

    const extracted = new EmailExtractor().extract(dom);
    expect(extracted.senderDisplayName).toBe('経理部');
  });
});

describe('EmailExtractor 抽出失敗', () => {
  it('件名要素が見つからない場合は明示的な例外を投げる', () => {
    const dom = buildDom(`
      <span class="gD" email="a@example.com" name="A"></span>
      <div class="a3s aiL">本文</div>
    `);

    expect(() => new EmailExtractor().extract(dom)).toThrow(EmailExtractionError);
  });

  it('本文要素が見つからない場合は明示的な例外を投げる', () => {
    const dom = buildDom(`
      <h2 class="hP">件名</h2>
      <span class="gD" email="a@example.com" name="A"></span>
    `);

    expect(() => new EmailExtractor().extract(dom)).toThrow(EmailExtractionError);
  });

  it('送信者要素が見つからない場合は明示的な例外を投げる', () => {
    const dom = buildDom(`
      <h2 class="hP">件名</h2>
      <div class="a3s aiL">本文</div>
    `);

    expect(() => new EmailExtractor().extract(dom)).toThrow(EmailExtractionError);
  });
});
