export type E2EActionType = 'set-to-popup-state';

export interface E2EEventParams {
  type: E2EActionType;
  payload: any;
}
