import { ObjectId } from "mongodb";

export type UserMongoModel = {
  _id: ObjectId;
  login: string;
  email: string;
  salt: string;
  hash: string;
  isConfirmed: boolean;
  createdAt: string;
};
