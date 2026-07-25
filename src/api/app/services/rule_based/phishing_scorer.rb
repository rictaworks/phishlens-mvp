require "json"

# src/extension/src/scoring/phishing-scorer.ts のRuby移植版。
# requirements.md 1.4-A準拠。サーバ側でクライアント計算のスコアを信頼せず、
# 抽出データから独自に再計算する(OWASP A04対策)。
module RuleBased
  class PhishingScorer
    Reason = Struct.new(:code, :delta) do
      def to_h
        { code: code, delta: delta }
      end
    end

    CREDENTIAL_REQUEST_PHRASES_PATH = Rails.root.join(
      "..", "extension", "config", "credential-request-phrases.json",
    )
    CREDENTIAL_REQUEST_PHRASES = JSON.parse(File.read(CREDENTIAL_REQUEST_PHRASES_PATH)).freeze

    URGENCY_KEYWORD_POINTS_PER_MATCH = 5
    URGENCY_KEYWORD_POINTS_MAX = 20
    SCORE_MIN = 0
    SCORE_MAX = 100
    BRAND_LOOKALIKE_MIN_DISTANCE = 1
    BRAND_LOOKALIKE_MAX_DISTANCE = 2

    def initialize(email)
      @email = email
    end

    def eval_auth_headers
      headers = @email[:auth_headers]
      return [ Reason.new("AUTH_HEADERS_UNAVAILABLE", 0) ] if headers.nil?

      values = [ headers[:spf], headers[:dkim], headers[:dmarc] ]
      if values.all? { |v| v == "pass" }
        [ Reason.new("AUTH_HEADERS_ALL_PASS", -30) ]
      elsif values.any? { |v| v == "fail" }
        [ Reason.new("AUTH_HEADERS_ANY_FAIL", 30) ]
      else
        [ Reason.new("AUTH_HEADERS_MIXED", 0) ]
      end
    end

    def eval_urls
      reasons = []
      links = @email[:links] || []

      if links.any? { |link| mismatched_display_href?(link) }
        reasons << Reason.new("URL_DISPLAY_HREF_MISMATCH", 25)
      end

      if links.any? { |link| shortener_domain?(link) }
        reasons << Reason.new("URL_SHORTENER_DOMAIN", 10)
      end

      if links.any? { |link| punycode_or_ip?(link) }
        reasons << Reason.new("URL_PUNYCODE_OR_IP", 25)
      end

      if links.any? { |link| brand_lookalike?(link) }
        reasons << Reason.new("URL_BRAND_LOOKALIKE_DOMAIN", 30)
      end

      reasons
    end

    def eval_urgency
      text = "#{@email[:subject]} #{@email[:body]}".downcase
      match_count = urgency_keywords.count { |keyword| text.include?(keyword.downcase) }
      return [] if match_count.zero?

      delta = [ match_count * URGENCY_KEYWORD_POINTS_PER_MATCH, URGENCY_KEYWORD_POINTS_MAX ].min
      [ Reason.new("URGENCY_KEYWORDS_MATCHED", delta) ]
    end

    def eval_credential_request
      text = "#{@email[:subject]} #{@email[:body]}".downcase
      matched = CREDENTIAL_REQUEST_PHRASES.any? { |p| text.include?(p["phrase"].downcase) }
      matched ? [ Reason.new("CREDENTIAL_REQUEST_DETECTED", 20) ] : []
    end

    def eval_brand_mismatch
      display_name = (@email[:sender_display_name] || "").downcase
      matched_brand = brand_domains.find { |brand| display_name.include?(brand.brand_name.downcase) }
      return [] if matched_brand.nil?
      return [] if same_or_subdomain?(@email[:sender_domain].to_s, matched_brand.official_domain)

      [ Reason.new("SENDER_BRAND_DOMAIN_MISMATCH", 25) ]
    end

    def score
      reasons = eval_auth_headers + eval_urls + eval_urgency + eval_credential_request + eval_brand_mismatch
      raw_score = reasons.sum(&:delta)
      { score: raw_score.clamp(SCORE_MIN, SCORE_MAX), reasons: reasons.map(&:to_h) }
    end

    private

    def mismatched_display_href?(link)
      display_domain = DomainUtils.extract_domain_from_text(link[:display_text].to_s)
      href_domain = DomainUtils.extract_domain_from_url(link[:href].to_s)
      !display_domain.nil? && !href_domain.nil? && display_domain != href_domain
    end

    def shortener_domain?(link)
      href_domain = DomainUtils.extract_domain_from_url(link[:href].to_s)
      !href_domain.nil? && shortener_domains.include?(href_domain)
    end

    def punycode_or_ip?(link)
      href_domain = DomainUtils.extract_domain_from_url(link[:href].to_s)
      return false if href_domain.nil?

      DomainUtils.punycode_domain?(href_domain) || DomainUtils.ip_address_domain?(href_domain)
    end

    def brand_lookalike?(link)
      href_domain = DomainUtils.extract_domain_from_url(link[:href].to_s)
      return false if href_domain.nil?

      brand_domains.any? do |brand|
        next false if href_domain == brand.official_domain

        distance = DomainUtils.levenshtein_distance(href_domain, brand.official_domain)
        distance >= BRAND_LOOKALIKE_MIN_DISTANCE && distance <= BRAND_LOOKALIKE_MAX_DISTANCE
      end
    end

    def same_or_subdomain?(domain, official_domain)
      normalized_domain = domain.downcase
      normalized_official = official_domain.downcase
      normalized_domain == normalized_official || normalized_domain.end_with?(".#{normalized_official}")
    end

    def urgency_keywords
      @urgency_keywords ||= UrgencyKeyword.pluck(:keyword)
    end

    def brand_domains
      @brand_domains ||= BrandDomain.all.to_a
    end

    def shortener_domains
      @shortener_domains ||= ShortenerDomain.pluck(:domain)
    end
  end
end
