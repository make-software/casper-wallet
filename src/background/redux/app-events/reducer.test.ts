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
      errors: [],
      nextErrorId: 0
    });
  });
  it('adds dismissed ids without duplicates', () => {
    const s1 = reducer(
      { dismissedEventIds: [1], errors: [], nextErrorId: 0 },
      dismissAppEvent(2)
    );
    expect(s1).toEqual({
      dismissedEventIds: [1, 2],
      errors: [],
      nextErrorId: 0
    });
    expect(reducer(s1, dismissAppEvent(2))).toEqual({
      dismissedEventIds: [1, 2],
      errors: [],
      nextErrorId: 0
    });
  });
  it('resets', () => {
    expect(
      reducer(
        { dismissedEventIds: [1, 2], errors: [], nextErrorId: 5 },
        resetAppEventsDismission()
      )
    ).toEqual({ dismissedEventIds: [], errors: [], nextErrorId: 0 });
  });

  describe('sagaError', () => {
    it('assigns ids from the monotonic counter and increments it', () => {
      const s1 = reducer(
        { dismissedEventIds: [], errors: [], nextErrorId: 0 },
        sagaError({ source: 'sagaA', message: 'boom' })
      );
      expect(s1.errors).toEqual([{ id: 0, source: 'sagaA', message: 'boom' }]);
      expect(s1.nextErrorId).toBe(1);

      const s2 = reducer(s1, sagaError({ source: 'sagaB', message: 'bang' }));
      expect(s2.errors).toEqual([
        { id: 0, source: 'sagaA', message: 'boom' },
        { id: 1, source: 'sagaB', message: 'bang' }
      ]);
      expect(s2.nextErrorId).toBe(2);
    });

    it('keeps the code field when provided, and omits it when absent', () => {
      const s1 = reducer(
        { dismissedEventIds: [], errors: [], nextErrorId: 0 },
        sagaError({ source: 'sagaA', message: 'boom', code: 'ERR_CODE' })
      );
      expect(s1.errors[0].code).toBe('ERR_CODE');

      const s2 = reducer(
        { dismissedEventIds: [], errors: [], nextErrorId: 0 },
        sagaError({ source: 'sagaA', message: 'boom' })
      );
      expect(s2.errors[0].code).toBeUndefined();
    });

    it('caps the list at the last 10 entries, dropping the oldest, while the counter keeps climbing', () => {
      let state: AppEventsState = {
        dismissedEventIds: [],
        errors: [],
        nextErrorId: 0
      };
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
      expect(state.nextErrorId).toBe(11);
    });

    it('never reuses a dismissed id, even when it was the highest one (anti-reuse race)', () => {
      let state: AppEventsState = {
        dismissedEventIds: [],
        errors: [],
        nextErrorId: 0
      };
      // add 2 errors -> ids 0, 1
      state = reducer(state, sagaError({ source: 'sagaA', message: 'a' }));
      state = reducer(state, sagaError({ source: 'sagaB', message: 'b' }));
      expect(state.errors.map(e => e.id)).toEqual([0, 1]);

      // dismiss the highest id (1) — an in-flight dismiss for a
      // subsequently-created error must never target this id again
      state = reducer(state, dismissSagaError(1));
      expect(state.errors.map(e => e.id)).toEqual([0]);

      // a new error must get id 2, NOT the freed-up id 1
      state = reducer(state, sagaError({ source: 'sagaC', message: 'c' }));
      expect(state.errors.map(e => e.id)).toEqual([0, 2]);
      expect(state.nextErrorId).toBe(3);
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
        ],
        nextErrorId: 3
      };
      const result = reducer(seeded, dismissSagaError(1));
      expect(result.errors).toEqual([
        { id: 0, source: 'sagaA', message: 'a' },
        { id: 2, source: 'sagaC', message: 'c' }
      ]);
    });
  });
});
