import { dismissAppEvent, resetAppEventsDismission } from './actions';
import { reducer } from './reducer';

describe('app-events reducer', () => {
  it('has empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      dismissedEventIds: []
    });
  });
  it('adds dismissed ids without duplicates', () => {
    const s1 = reducer({ dismissedEventIds: [1] }, dismissAppEvent(2));
    expect(s1).toEqual({ dismissedEventIds: [1, 2] });
    expect(reducer(s1, dismissAppEvent(2))).toEqual({
      dismissedEventIds: [1, 2]
    });
  });
  it('resets', () => {
    expect(
      reducer({ dismissedEventIds: [1, 2] }, resetAppEventsDismission())
    ).toEqual({ dismissedEventIds: [] });
  });
});
