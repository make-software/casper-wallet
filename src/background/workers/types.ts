export interface WorkerErrorMessage {
  error: true;
}

export type WorkerResult<T> = T | WorkerErrorMessage;

export const isWorkerError = (data: unknown): data is WorkerErrorMessage =>
  typeof data === 'object' &&
  data !== null &&
  (data as WorkerErrorMessage).error === true;
