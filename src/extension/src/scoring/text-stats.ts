const SENTENCE_DELIMITER_PATTERN = /[。！？.!?]+/;
const BULLET_LINE_PATTERN = /^\s*[・\-*]/;
const HEADING_LINE_PATTERN = /^\s*(【.+】|\d+[.)、])/;
const DATE_PATTERN = /\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}/;
const AMOUNT_PATTERN = /[¥$]\s*\d|\d+\s*円/;
const PHONE_PATTERN = /\d{2,4}-\d{2,4}-\d{4}/;

export interface TextStats {
  body: string;
  lowerBody: string;
  sentences: string[];
  sentenceLengths: number[];
  paragraphs: string[];
  paragraphLengths: number[];
  exclamationCount: number;
  questionCount: number;
  hasDigit: boolean;
  hasDate: boolean;
  hasAmount: boolean;
  hasPhoneNumber: boolean;
  bulletLineCount: number;
  headingLineCount: number;
}

export function variance(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map((value) => (value - mean) ** 2);
  return squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
}

export function countOccurrences(lowerText: string, phrase: string): number {
  const lowerPhrase = phrase.toLowerCase();
  if (lowerPhrase.length === 0) {
    return 0;
  }
  let count = 0;
  let index = lowerText.indexOf(lowerPhrase);
  while (index !== -1) {
    count += 1;
    index = lowerText.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
  return count;
}

export function computeTextStats(body: string): TextStats {
  const sentences = body
    .split(SENTENCE_DELIMITER_PATTERN)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  const paragraphs = body
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const lines = body.split(/\n/);

  return {
    body,
    lowerBody: body.toLowerCase(),
    sentences,
    sentenceLengths: sentences.map((sentence) => sentence.length),
    paragraphs,
    paragraphLengths: paragraphs.map((paragraph) => paragraph.length),
    exclamationCount: (body.match(/[!!]/g) ?? []).length,
    questionCount: (body.match(/[??]/g) ?? []).length,
    hasDigit: /\d/.test(body),
    hasDate: DATE_PATTERN.test(body),
    hasAmount: AMOUNT_PATTERN.test(body),
    hasPhoneNumber: PHONE_PATTERN.test(body),
    bulletLineCount: lines.filter((line) => BULLET_LINE_PATTERN.test(line)).length,
    headingLineCount: lines.filter((line) => HEADING_LINE_PATTERN.test(line)).length,
  };
}
