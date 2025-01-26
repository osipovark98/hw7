import { QueryModel } from "../../../utils/models/QueryModel";
import { SortByPost } from "../../../utils/models/SortByPost";

export interface PostQueryModel extends QueryModel {
  sortBy: SortByPost;
}
