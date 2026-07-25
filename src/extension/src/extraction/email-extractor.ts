import gmailSelectorsData from '../../config/gmail-selectors.json';
import type { ScoringEmailInput } from '../scoring/types';

interface GmailSelectors {
  subject: string;
  senderContainer: string;
  body: string;
  links: string;
}

const gmailSelectors = gmailSelectorsData as GmailSelectors;

export class EmailExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailExtractionError';
  }
}

export class EmailExtractor {
  extract(root: ParentNode): ScoringEmailInput {
    const subjectEl = root.querySelector(gmailSelectors.subject);
    if (subjectEl === null) {
      throw new EmailExtractionError('件名要素が見つかりません(Gmail DOM構造を確認してください)');
    }

    const senderEl = root.querySelector(gmailSelectors.senderContainer);
    if (senderEl === null) {
      throw new EmailExtractionError('送信者要素が見つかりません(Gmail DOM構造を確認してください)');
    }

    const bodyEl = root.querySelector(gmailSelectors.body);
    if (bodyEl === null) {
      throw new EmailExtractionError('本文要素が見つかりません(Gmail DOM構造を確認してください)');
    }

    const senderEmail = senderEl.getAttribute('email') ?? '';
    const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1] : '';

    const links = Array.from(bodyEl.querySelectorAll<HTMLAnchorElement>(gmailSelectors.links)).map(
      (anchor) => ({
        displayText: anchor.textContent?.trim() ?? '',
        href: anchor.getAttribute('href') ?? '',
      }),
    );

    return {
      subject: subjectEl.textContent?.trim() ?? '',
      body: bodyEl.textContent?.trim() ?? '',
      senderDisplayName: senderEl.getAttribute('name') ?? senderEl.textContent?.trim() ?? '',
      senderDomain,
      // GmailのDOM描画にはSPF/DKIM/DMARCの合否が含まれないため、MVPでは常にnull(取得不能)を返す。
      // requirements.md 1.4-Aの「ヘッダ取得不能なら0点」に該当する。
      authHeaders: null,
      links,
    };
  }
}
