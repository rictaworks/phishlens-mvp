export type CategoryCode = 'danger' | 'caution' | 'safe';

export interface OverlayResultState {
  categoryCode: CategoryCode;
  phishingScore: number;
  aiGenScore: number | 'unjudgeable';
  reasons: string[];
  quotaUsed: boolean;
  feedbackGiven: boolean;
}

export interface OverlayState {
  judged: boolean;
  result: OverlayResultState | null;
}

export interface OverlayCallbacks {
  onJudge: () => void;
  onClose: () => void;
  onAgree: () => void;
  onDispute: () => void;
}
