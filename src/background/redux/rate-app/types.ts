export interface RateAppState {
  ratedInStore: boolean;

  /** Timestamp after which the user is asked to rate the app; null if never asked. */
  askForReviewAfter: number | null;
}
