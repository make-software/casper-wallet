export interface Payload<T> {
  payload: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  itemCount: number;
  pageCount: number;
  pages: any[];
}

export interface DataResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: {
    message: string;
    description: string;
    code: string;
  };
}
