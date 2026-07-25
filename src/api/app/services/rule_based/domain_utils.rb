require "uri"

# src/extension/src/scoring/utils.ts のRuby移植版。
# ReDoS対策として、正規表現は単一文字クラスへの単純な+のみを用いる。
module RuleBased
  module DomainUtils
    DOMAIN_TOKEN_PATTERN = /[a-z0-9.\-]+/i
    DOMAIN_TLD_PATTERN = /\A[a-z]{2,}\z/i
    IPV4_PATTERN = /\A(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\z/

    module_function

    def extract_domain_from_url(url)
      uri = URI.parse(url)
      host = uri.host
      host&.downcase
    rescue URI::InvalidURIError
      nil
    end

    def extract_domain_from_text(text)
      tokens = text.scan(DOMAIN_TOKEN_PATTERN)
      domain = tokens.find { |token| looks_like_domain?(token) }
      domain&.downcase
    end

    def punycode_domain?(domain)
      domain.downcase.split(".").any? { |label| label.start_with?("xn--") }
    end

    def ip_address_domain?(domain)
      match = IPV4_PATTERN.match(domain)
      return false unless match

      match.captures.all? { |octet| octet.to_i <= 255 }
    end

    def levenshtein_distance(a, b)
      rows = a.length + 1
      cols = b.length + 1
      table = Array.new(rows) { Array.new(cols, 0) }

      (0...rows).each { |i| table[i][0] = i }
      (0...cols).each { |j| table[0][j] = j }

      (1...rows).each do |i|
        (1...cols).each do |j|
          cost = a[i - 1] == b[j - 1] ? 0 : 1
          table[i][j] = [
            table[i - 1][j] + 1,
            table[i][j - 1] + 1,
            table[i - 1][j - 1] + cost
          ].min
        end
      end

      table[rows - 1][cols - 1]
    end

    def looks_like_domain?(token)
      labels = token.split(".")
      return false if labels.length < 2

      tld = labels.last
      return false unless DOMAIN_TLD_PATTERN.match?(tld)

      labels.all? { |label| !label.empty? && !label.start_with?("-") && !label.end_with?("-") }
    end
    private_class_method :looks_like_domain?
  end
end
