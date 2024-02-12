/**
 * Interface representing the structure of the RateAppState.
 *
 * @interface
 * @exports
 * @name RateAppState
 */
export interface RateAppState {
  /**
   * Indicates whether the application was rated in the store.
   *
   * @type {boolean}
   * @name ratedInStore
   */
  ratedInStore: boolean;

  /**
   * Stores the timestamp after which the user
   * will be asked for a rate app.
   *
   * Is null if the user has never been asked for a rate app.
   *
   * @type {number | null}
   * @name askForReviewAfter
   */
  askForReviewAfter: number | null;
}
