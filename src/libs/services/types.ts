export interface Payload<T> {
  payload: T;
}

export interface ErrorResponse {
  error: {
    message: string;
    description: string;
    code: string;
  };
}
