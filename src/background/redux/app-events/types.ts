export interface SagaError {
  id: number;
  source: string;
  message: string;
  code?: string;
}

export interface AppEventsState {
  dismissedEventIds: number[];
  errors: SagaError[];
  nextErrorId: number;
}
