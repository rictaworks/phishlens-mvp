import type { JudgementCategoryCode, IsoDateTimeString, Sha256Hex } from "./common";
import type { JudgementTimestamps, MessageSnapshot, RuleBasedScore } from "./analysis";

export interface JudgementCreateRequest {
  messageSnapshot: MessageSnapshot;
  ruleBasedScore: RuleBasedScore;
  requestedAt: IsoDateTimeString;
}

export interface JudgementReasonItem {
  reasonCode: string;
  scoreDelta: number;
}

export interface JudgementResult {
  judgementId: number;
  googleSub: string;
  messageSha256: Sha256Hex;
  phishingScore: number;
  aiGeneratedScore: number | null;
  categoryCode: JudgementCategoryCode;
  aiDetailUsed: boolean;
  aiDetailStatus: "used" | "already_used" | "unavailable" | "error";
  reasonItems: JudgementReasonItem[];
  timestamps: JudgementTimestamps;
}

export interface JudgementHistoryItem {
  judgementId: number;
  messageSha256: Sha256Hex;
  phishingScore: number;
  aiGeneratedScore: number | null;
  categoryCode: JudgementCategoryCode;
  aiDetailUsed: boolean;
  reasonCodes: string[];
  judgedAt: IsoDateTimeString;
}

export interface JudgementHistoryResponse {
  items: JudgementHistoryItem[];
  nextCursor: string | null;
}
