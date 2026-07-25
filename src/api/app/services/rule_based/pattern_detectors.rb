require "json"

# src/extension/src/scoring/pattern-detectors.ts のRuby移植版。
module RuleBased
  module PatternDetectors
    PHRASE_LISTS_PATH = Rails.root.join("..", "extension", "config", "ai-style-phrase-lists.json")
    PHRASE_LISTS = JSON.parse(File.read(PHRASE_LISTS_PATH)).freeze

    NAME_LIKE_PATTERN = /[一-龠ァ-ヴー]{2,4}様/
    LOW_VARIANCE_THRESHOLD = 10
    UNIFORM_STRUCTURE_THRESHOLD = 30
    UNIFORM_ENDING_RATIO = 0.8
    REPEATED_CONJUNCTION_MIN_COUNT = 3
    EXCESSIVE_BULLET_MIN_COUNT = 3
    OVERLY_STRUCTURED_HEADING_MIN_COUNT = 2
    LONG_PREAMBLE_SENTENCE_LENGTH = 60
    GREETING_LEADING_WINDOW = 40
    MULTI_PHRASE_MATCH_MIN = 2

    module_function

    def count_distinct_phrase_matches(lower_body, phrases)
      phrases.count { |phrase| TextStatsCalculator.count_occurrences(lower_body, phrase).positive? }
    end

    def personal_name_mention?(stats)
      matches = stats.body.scan(NAME_LIKE_PATTERN)
      generic_terms = PHRASE_LISTS["genericAddressTerms"].map(&:downcase)
      matches.any? { |match| !generic_terms.include?(match.downcase) }
    end

    def most_common_ending_ratio(sentences)
      return 0 if sentences.empty?

      ending_counts = Hash.new(0)
      sentences.each { |s| ending_counts[s[-2..]] += 1 }
      ending_counts.values.max.to_f / sentences.length
    end

    DETECTORS = {
      "low_sentence_length_variance" => lambda { |stats|
        stats.sentences.length >= 3 && TextStatsCalculator.variance(stats.sentence_lengths) < LOW_VARIANCE_THRESHOLD
      },
      "overly_polite_boilerplate" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["politeBoilerplatePhrases"]) >= MULTI_PHRASE_MATCH_MIN
      },
      "generic_lacking_specifics" => ->(stats) { !stats.has_digit },
      "zero_typo_template_structure" => lambda { |stats|
        stats.paragraphs.length >= 3 && TextStatsCalculator.variance(stats.paragraph_lengths) < UNIFORM_STRUCTURE_THRESHOLD
      },
      "absence_of_translation_awkwardness" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["awkwardTranslationMarkers"]).zero?
      },
      "no_exclamation_marks" => ->(stats) { stats.exclamation_count.zero? },
      "lacking_first_person" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["firstPersonWords"]).zero?
      },
      "vague_dates_amounts" => ->(stats) { !stats.has_date && !stats.has_amount },
      "excessive_apology_phrases" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["apologyPhrases"]) >= MULTI_PHRASE_MATCH_MIN
      },
      "excessive_bullet_points" => ->(stats) { stats.bullet_line_count >= EXCESSIVE_BULLET_MIN_COUNT },
      "repeated_conjunctions" => lambda { |stats|
        PHRASE_LISTS["conjunctions"].any? do |c|
          TextStatsCalculator.count_occurrences(stats.lower_body, c) >= REPEATED_CONJUNCTION_MIN_COUNT
        end
      },
      "generic_greeting" => lambda { |stats|
        PHRASE_LISTS["genericGreetings"].any? do |g|
          stats.lower_body[0, GREETING_LEADING_WINDOW].to_s.include?(g.downcase)
        end
      },
      "no_personal_name" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["genericAddressTerms"]).positive? &&
          !personal_name_mention?(stats)
      },
      "uniform_sentence_endings" => lambda { |stats|
        stats.sentences.length >= 3 && most_common_ending_ratio(stats.sentences) >= UNIFORM_ENDING_RATIO
      },
      "no_rhetorical_questions" => ->(stats) { stats.question_count.zero? },
      "no_specific_contact_person" => ->(stats) { !stats.has_phone_number && !personal_name_mention?(stats) },
      "overly_structured_headings" => ->(stats) { stats.heading_line_count >= OVERLY_STRUCTURED_HEADING_MIN_COUNT },
      "flat_emotional_tone" => lambda { |stats|
        count_distinct_phrase_matches(stats.lower_body, PHRASE_LISTS["emotionWords"]).zero?
      },
      "redundant_preamble" => ->(stats) { (stats.sentences.first&.length || 0) > LONG_PREAMBLE_SENTENCE_LENGTH },
      "vague_call_to_action" => lambda { |stats|
        PHRASE_LISTS["vagueCallToActionPhrases"].any? { |p| stats.lower_body.include?(p.downcase) } && !stats.has_date
      }
    }.freeze
  end
end
