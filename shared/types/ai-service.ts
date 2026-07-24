import type { IsoDateTimeString } from "./common";
import type { MessageSnapshot } from "./analysis";

export interface AiJudgeRequest {
  messageSnapshot: MessageSnapshot;
  transientPlainText: {
    subject: string;
    body: string;
  };
  requestedAt: IsoDateTimeString;
}

export interface AiJudgeResponse {
  phishingIntentScore: number;
  aiGeneratedScore: number | null;
  reasons: string[];
  evidenceQuotes: string[];
  modelVersion: string;
}

