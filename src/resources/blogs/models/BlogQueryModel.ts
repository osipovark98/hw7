import { QueryModel } from "../../../utils/models/QueryModel";
import { SortByBlog } from "../../../utils/models/SortByBlog";

export interface BlogQueryModel extends QueryModel {
  searchNameTerm: string;
  sortBy: SortByBlog;
}
