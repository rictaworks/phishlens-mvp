import type { IsoDateTimeString, LanguageCode, Sha256Hex, TriStateSignal } from "./common";

export interface HeaderSignals {
  spf: TriStateSignal;
  dkim: TriStateSignal;
  dmarc: TriStateSignal;
}

export interface LinkEvidence {
  displayText: string;
  hrefDomain: string;
  displayTextDomain?: string;
  isDomainMismatch: boolean;
  isShortenerDomain: boolean;
  isPunycodeOrIpAddress: boolean;
}

export interface MessageSnapshot {
  subjectSha256: Sha256Hex;
  bodySha256: Sha256Hex;
  bodyCharacterCount: number;
  language: LanguageCode;
  senderDisplayName?: string;
  senderDomain?: string;
  headerSignals: HeaderSignals;
  links: LinkEvidence[];
  hasAttachments: boolean;
}

export interface RuleBasedReason {
  reasonCode: string;
  scoreDelta: number;
}

export interface RuleBasedScore {
  phishingScore: number;
  aiGeneratedScore: number | null;
  reasons: RuleBasedReason[];
}

export interface JudgementTimestamps {
  judgedAt: IsoDateTimeString;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

