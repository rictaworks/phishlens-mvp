module RuleBased
  TextStats = Struct.new(
    :body, :lower_body, :sentences, :sentence_lengths, :paragraphs, :paragraph_lengths,
    :exclamation_count, :question_count, :has_digit, :has_date, :has_amount, :has_phone_number,
    :bullet_line_count, :heading_line_count,
    keyword_init: true,
  )
end
