import { aiStylePatterns } from '../masters';
import { patternDetectors } from './pattern-detectors';
import { computeTextStats } from './text-stats';
import type { ScoreReason, ScoreResult } from './types';

const MIN_JUDGEABLE_BODY_LENGTH = 200;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

export type AiStyleScoreResult = ScoreResult | 'unjudgeable';

export class AiStyleScorer {
  constructor(private readonly body: string) {}

  score(): AiStyleScoreResult {
    if (this.body.length < MIN_JUDGEABLE_BODY_LENGTH) {
      return 'unjudgeable';
    }

    const stats = computeTextStats(this.body);
    const reasons: ScoreReason[] = [];

    for (const pattern of aiStylePatterns) {
      const detector = patternDetectors[pattern.pattern_code];
      if (detector === undefined) {
        throw new Error(`未対応のAI文体特徴パターンです: ${pattern.pattern_code}`);
      }
      if (detector(stats)) {
        reasons.push({ code: pattern.pattern_code.toUpperCase(), delta: pattern.weight });
      }
    }

    const rawScore = reasons.reduce((total, reason) => total + reason.delta, 0);
    const score = Math.min(SCORE_MAX, Math.max(SCORE_MIN, rawScore));
    return { score, reasons };
  }
}
