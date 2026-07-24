import type { FeedbackCategoryCode, IsoDateTimeString } from "./common";

export interface FeedbackCreateRequest {
  judgementId: number;
  feedbackCode: FeedbackCategoryCode;
  recaptchaToken: string;
}

export interface FeedbackCreateResponse {
  feedbackId: number;
  submittedAt: IsoDateTimeString;
}

