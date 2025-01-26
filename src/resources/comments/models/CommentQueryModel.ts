import { QueryModel } from "../../../utils/models/QueryModel";
import { SortByComment } from "../../../utils/models/SortByComment";

export interface CommentQueryModel extends QueryModel {
  sortBy: SortByComment;
}
