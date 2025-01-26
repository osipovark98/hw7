import { QueryModel } from "../../../utils/models/QueryModel";

export interface UserQueryModel extends QueryModel {
  searchEmailTerm: string;
  searchLoginTerm: string;
}
