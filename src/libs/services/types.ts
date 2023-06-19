export interface DataWithPayload<T> {
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
