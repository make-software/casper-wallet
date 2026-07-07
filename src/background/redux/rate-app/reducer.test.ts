import {
  askForReviewAfterChanged,
  ratedInStoreChanged,
  resetRateApp
} from './actions';
import { reducer } from './reducer';

const initial = { ratedInStore: false, askForReviewAfter: null };

describe('rate-app reducer', () => {
  it('has correct initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initial);
  });
  it('sets ratedInStore', () => {
    expect(reducer(initial, ratedInStoreChanged(true))).toEqual({
      ratedInStore: true,
      askForReviewAfter: null
    });
  });
  it('sets askForReviewAfter', () => {
    expect(reducer(initial, askForReviewAfterChanged(42))).toEqual({
      ratedInStore: false,
      askForReviewAfter: 42
    });
  });
  it('resets', () => {
    expect(
      reducer({ ratedInStore: true, askForReviewAfter: 1 }, resetRateApp())
    ).toEqual(initial);
  });
});
