# src/extension/src/scoring/text-stats.ts のRuby移植版。
module RuleBased
  module TextStatsCalculator
    SENTENCE_DELIMITER_PATTERN = /[。!!??.]+/
    BULLET_LINE_PATTERN = /\A\s*[・\-*]/
    HEADING_LINE_PATTERN = /\A\s*(【.+】|\d+[.)、])/
    DATE_PATTERN = %r{\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}/\d{1,2}}
    AMOUNT_PATTERN = /[¥$]\s*\d|\d+\s*円/
    PHONE_PATTERN = /\d{2,4}-\d{2,4}-\d{4}/

    module_function

    def variance(values)
      return 0 if values.empty?

      mean = values.sum.to_f / values.length
      squared_diffs = values.map { |v| (v - mean)**2 }
      squared_diffs.sum / values.length
    end

    def count_occurrences(lower_text, phrase)
      lower_phrase = phrase.downcase
      return 0 if lower_phrase.empty?

      lower_text.scan(lower_phrase).length
    end

    def compute(body)
      sentences = body.split(SENTENCE_DELIMITER_PATTERN).map(&:strip).reject(&:empty?)
      paragraphs = body.split(/\n+/).map(&:strip).reject(&:empty?)
      lines = body.split("\n")

      TextStats.new(
        body: body,
        lower_body: body.downcase,
        sentences: sentences,
        sentence_lengths: sentences.map(&:length),
        paragraphs: paragraphs,
        paragraph_lengths: paragraphs.map(&:length),
        exclamation_count: body.scan(/[!!]/).length,
        question_count: body.scan(/[??]/).length,
        has_digit: body.match?(/\d/),
        has_date: DATE_PATTERN.match?(body),
        has_amount: AMOUNT_PATTERN.match?(body),
        has_phone_number: PHONE_PATTERN.match?(body),
        bullet_line_count: lines.count { |line| BULLET_LINE_PATTERN.match?(line) },
        heading_line_count: lines.count { |line| HEADING_LINE_PATTERN.match?(line) },
      )
    end
  end
end
