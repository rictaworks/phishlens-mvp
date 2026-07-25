import phraseListsData from '../../config/ai-style-phrase-lists.json';
import { countOccurrences, variance, type TextStats } from './text-stats';

interface PhraseLists {
  politeBoilerplatePhrases: string[];
  apologyPhrases: string[];
  conjunctions: string[];
  genericGreetings: string[];
  genericAddressTerms: string[];
  vagueCallToActionPhrases: string[];
  awkwardTranslationMarkers: string[];
  emotionWords: string[];
  firstPersonWords: string[];
}

const phraseLists = phraseListsData as PhraseLists;

const NAME_LIKE_PATTERN = /[一-龠ァ-ヴー]{2,4}様/g;
const LOW_VARIANCE_THRESHOLD = 10;
const UNIFORM_STRUCTURE_THRESHOLD = 30;
const UNIFORM_ENDING_RATIO = 0.8;
const REPEATED_CONJUNCTION_MIN_COUNT = 3;
const EXCESSIVE_BULLET_MIN_COUNT = 3;
const OVERLY_STRUCTURED_HEADING_MIN_COUNT = 2;
const LONG_PREAMBLE_SENTENCE_LENGTH = 60;
const GREETING_LEADING_WINDOW = 40;
const MULTI_PHRASE_MATCH_MIN = 2;

function countDistinctPhraseMatches(lowerBody: string, phrases: string[]): number {
  return phrases.filter((phrase) => countOccurrences(lowerBody, phrase) > 0).length;
}

function hasPersonalNameMention(stats: TextStats): boolean {
  const matches = stats.body.match(NAME_LIKE_PATTERN) ?? [];
  const genericTerms = new Set(phraseLists.genericAddressTerms.map((term) => term.toLowerCase()));
  return matches.some((match) => !genericTerms.has(match.toLowerCase()));
}

function mostCommonEndingRatio(sentences: string[]): number {
  if (sentences.length === 0) {
    return 0;
  }
  const endingCounts = new Map<string, number>();
  for (const sentence of sentences) {
    const ending = sentence.slice(-2);
    endingCounts.set(ending, (endingCounts.get(ending) ?? 0) + 1);
  }
  const maxCount = Math.max(...endingCounts.values());
  return maxCount / sentences.length;
}

export type PatternDetector = (stats: TextStats) => boolean;

export const patternDetectors: Record<string, PatternDetector> = {
  low_sentence_length_variance: (stats) =>
    stats.sentences.length >= 3 && variance(stats.sentenceLengths) < LOW_VARIANCE_THRESHOLD,

  overly_polite_boilerplate: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.politeBoilerplatePhrases) >=
    MULTI_PHRASE_MATCH_MIN,

  generic_lacking_specifics: (stats) => !stats.hasDigit,

  zero_typo_template_structure: (stats) =>
    stats.paragraphs.length >= 3 && variance(stats.paragraphLengths) < UNIFORM_STRUCTURE_THRESHOLD,

  absence_of_translation_awkwardness: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.awkwardTranslationMarkers) === 0,

  no_exclamation_marks: (stats) => stats.exclamationCount === 0,

  lacking_first_person: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.firstPersonWords) === 0,

  vague_dates_amounts: (stats) => !stats.hasDate && !stats.hasAmount,

  excessive_apology_phrases: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.apologyPhrases) >= MULTI_PHRASE_MATCH_MIN,

  excessive_bullet_points: (stats) => stats.bulletLineCount >= EXCESSIVE_BULLET_MIN_COUNT,

  repeated_conjunctions: (stats) =>
    phraseLists.conjunctions.some(
      (conjunction) => countOccurrences(stats.lowerBody, conjunction) >= REPEATED_CONJUNCTION_MIN_COUNT,
    ),

  generic_greeting: (stats) =>
    phraseLists.genericGreetings.some((greeting) =>
      stats.lowerBody.slice(0, GREETING_LEADING_WINDOW).includes(greeting.toLowerCase()),
    ),

  no_personal_name: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.genericAddressTerms) > 0 &&
    !hasPersonalNameMention(stats),

  uniform_sentence_endings: (stats) =>
    stats.sentences.length >= 3 && mostCommonEndingRatio(stats.sentences) >= UNIFORM_ENDING_RATIO,

  no_rhetorical_questions: (stats) => stats.questionCount === 0,

  no_specific_contact_person: (stats) => !stats.hasPhoneNumber && !hasPersonalNameMention(stats),

  overly_structured_headings: (stats) => stats.headingLineCount >= OVERLY_STRUCTURED_HEADING_MIN_COUNT,

  flat_emotional_tone: (stats) =>
    countDistinctPhraseMatches(stats.lowerBody, phraseLists.emotionWords) === 0,

  redundant_preamble: (stats) =>
    (stats.sentences[0]?.length ?? 0) > LONG_PREAMBLE_SENTENCE_LENGTH,

  vague_call_to_action: (stats) =>
    phraseLists.vagueCallToActionPhrases.some((phrase) => stats.lowerBody.includes(phrase.toLowerCase())) &&
    !stats.hasDate,
};
