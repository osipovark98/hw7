import { SortDirection } from "./SortDirection";

export interface QueryModel {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: SortDirection;
}
