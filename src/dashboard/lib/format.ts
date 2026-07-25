const JST_TIME_ZONE = 'Asia/Tokyo';

const judgedAtFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: JST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatJudgedAt(iso: string): string {
  return judgedAtFormatter.format(new Date(iso));
}

export function formatAiGenScore(score: number | null): string {
  return score === null ? '判定不能' : String(score);
}
