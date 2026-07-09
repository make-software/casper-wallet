import {
  dismissAppEvent,
  dismissSagaError,
  resetAppEventsDismission,
  sagaError
} from './actions';
import { reducer } from './reducer';
import { AppEventsState } from './types';

describe('app-events reducer', () => {
  it('has empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      dismissedEventIds: [],
      errors: []
    });
  });
  it('adds dismissed ids without duplicates', () => {
    const s1 = reducer(
      { dismissedEventIds: [1], errors: [] },
      dismissAppEvent(2)
    );
    expect(s1).toEqual({ dismissedEventIds: [1, 2], errors: [] });
    expect(reducer(s1, dismissAppEvent(2))).toEqual({
      dismissedEventIds: [1, 2],
      errors: []
    });
  });
  it('resets', () => {
    expect(
      reducer(
        { dismissedEventIds: [1, 2], errors: [] },
        resetAppEventsDismission()
      )
    ).toEqual({ dismissedEventIds: [], errors: [] });
  });

  describe('sagaError', () => {
    it('appends an entry with an incrementing id', () => {
      const s1 = reducer(
        { dismissedEventIds: [], errors: [] },
        sagaError({ source: 'sagaA', message: 'boom' })
      );
      expect(s1.errors).toEqual([{ id: 0, source: 'sagaA', message: 'boom' }]);

      const s2 = reducer(s1, sagaError({ source: 'sagaB', message: 'bang' }));
      expect(s2.errors).toEqual([
        { id: 0, source: 'sagaA', message: 'boom' },
        { id: 1, source: 'sagaB', message: 'bang' }
      ]);
    });

    it('keeps the code field when provided, and omits it when absent', () => {
      const s1 = reducer(
        { dismissedEventIds: [], errors: [] },
        sagaError({ source: 'sagaA', message: 'boom', code: 'ERR_CODE' })
      );
      expect(s1.errors[0].code).toBe('ERR_CODE');

      const s2 = reducer(
        { dismissedEventIds: [], errors: [] },
        sagaError({ source: 'sagaA', message: 'boom' })
      );
      expect(s2.errors[0].code).toBeUndefined();
    });

    it('caps the list at the last 10 entries, dropping the oldest', () => {
      let state: AppEventsState = { dismissedEventIds: [], errors: [] };
      for (let i = 0; i < 11; i++) {
        state = reducer(
          state,
          sagaError({ source: 'saga', message: `error-${i}` })
        );
      }
      expect(state.errors).toHaveLength(10);
      expect(state.errors[0]).toEqual({
        id: 1,
        source: 'saga',
        message: 'error-1'
      });
      expect(state.errors[9]).toEqual({
        id: 10,
        source: 'saga',
        message: 'error-10'
      });
      expect(state.errors.find(e => e.id === 0)).toBeUndefined();
    });
  });

  describe('dismissSagaError', () => {
    it('removes the entry with the given id and leaves the rest', () => {
      const seeded = {
        dismissedEventIds: [],
        errors: [
          { id: 0, source: 'sagaA', message: 'a' },
          { id: 1, source: 'sagaB', message: 'b' },
          { id: 2, source: 'sagaC', message: 'c' }
        ]
      };
      const result = reducer(seeded, dismissSagaError(1));
      expect(result.errors).toEqual([
        { id: 0, source: 'sagaA', message: 'a' },
        { id: 2, source: 'sagaC', message: 'c' }
      ]);
    });
  });
});
