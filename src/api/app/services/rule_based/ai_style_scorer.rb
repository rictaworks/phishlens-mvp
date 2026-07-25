# src/extension/src/scoring/ai-style-scorer.ts のRuby移植版。
# requirements.md 1.4-B準拠。
module RuleBased
  class AiStyleScorer
    class UnsupportedPatternError < StandardError; end

    MIN_JUDGEABLE_BODY_LENGTH = 200
    SCORE_MIN = 0
    SCORE_MAX = 100
    UNJUDGEABLE = :unjudgeable

    def initialize(body)
      @body = body
    end

    def score
      return UNJUDGEABLE if @body.length < MIN_JUDGEABLE_BODY_LENGTH

      stats = TextStatsCalculator.compute(@body)
      reasons = AiStylePattern.find_each.filter_map do |pattern|
        detector = PatternDetectors::DETECTORS[pattern.pattern_code]
        if detector.nil?
          raise UnsupportedPatternError, "未対応のAI文体特徴パターンです: #{pattern.pattern_code}"
        end

        { code: pattern.pattern_code.upcase, delta: pattern.weight } if detector.call(stats)
      end

      raw_score = reasons.sum { |r| r[:delta] }
      { score: raw_score.clamp(SCORE_MIN, SCORE_MAX), reasons: reasons }
    end
  end
end
