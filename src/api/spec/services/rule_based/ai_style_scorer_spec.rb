require "rails_helper"

RSpec.describe RuleBased::AiStyleScorer do
  def pad(text, min_length = 220)
    return text if text.length >= min_length

    text + ("　" * (min_length - text.length))
  end

  def seed_pattern(code, weight = 10)
    AiStylePattern.find_or_create_by!(pattern_code: code) do |p|
      p.description = code
      p.weight = weight
    end
  end

  before do
    # このscorerはAiStylePatternテーブル全件を走査するため、
    # 未対応コードによるUnsupportedPatternErrorを避けて対象パターンのみ用意する。
    seed_pattern("no_exclamation_marks")
  end

  it "本文が200文字未満なら:unjudgeableを返す" do
    expect(described_class.new("お世話になっております。").score).to eq(:unjudgeable)
  end

  it "本文がちょうど200文字ならば判定不能ではない" do
    expect(described_class.new(pad("あ", 200)).score).not_to eq(:unjudgeable)
  end

  it "感嘆符が全くない場合はNO_EXCLAMATION_MARKSが加点される" do
    body = pad("本サービスのご利用ありがとうございます。今後ともよろしくお願いいたします。")
    result = described_class.new(body).score
    expect(result[:reasons]).to include(code: "NO_EXCLAMATION_MARKS", delta: 10)
  end

  it "感嘆符がある場合はNO_EXCLAMATION_MARKSが加点されない" do
    body = pad("本サービスのご利用ありがとうございます!今後ともよろしくお願いいたします!")
    result = described_class.new(body).score
    expect(result[:reasons]).not_to include(a_hash_including(code: "NO_EXCLAMATION_MARKS"))
  end

  it "未対応のpattern_codeがある場合は明示的な例外を送出する" do
    seed_pattern("unknown_pattern_code")
    body = pad("本サービスのご利用ありがとうございます。")
    expect { described_class.new(body).score }.to raise_error(RuleBased::AiStyleScorer::UnsupportedPatternError)
  end

  it "スコアは100を超えない" do
    seed_pattern("overly_polite_boilerplate", 15)
    seed_pattern("generic_greeting", 10)
    body = pad(
      "平素より格別のご高配を賜り、厚く御礼申し上げます。何卒よろしくお願い申し上げます。" \
      "いつもお世話になっております。",
    )
    result = described_class.new(body).score
    expect(result[:score]).to be <= 100
  end
end
