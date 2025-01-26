import { ObjectId } from "mongodb";

import { client } from "../../db/db";

import { UserInputModel } from "./models/UserInputModel";
import { UserMongoModel } from "./models/UserMongoModel";
import { UserQueryModel } from "./models/UserQueryModel";
import { UserViewModel } from "./models/UserViewModel";

export const getUsersRepository = {
  async findUsers(query: UserQueryModel, operator: "or" | "and") {
    const {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      searchEmailTerm,
      searchLoginTerm,
    } = query;

    const mongoUsers = await client
      .db("homework")
      .collection<UserViewModel>("users")
      .find(
        {
          [`$${operator}`]: [
            { email: { $regex: `${searchEmailTerm}`, $options: "i" } },
            { login: { $regex: `${searchLoginTerm}`, $options: "i" } },
          ],
        },
        { projection: { hash: false, salt: false } }
      )
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return mongoUsers;
  },

  async findMongoUserById(id: string | ObjectId) {
    const mongoUser = await client
      .db("homework")
      .collection<UserMongoModel>("users")
      .findOne({ _id: typeof id === "string" ? new ObjectId(id) : id });
    return mongoUser;
  },

  async findViewUserById(id: string | ObjectId) {
    const mongoUser = await client
      .db("homework")
      .collection<UserViewModel>("users")
      .findOne({ _id: typeof id === "string" ? new ObjectId(id) : id });
    return mongoUser;
  },

  async insertUser(inputObject: Omit<UserMongoModel, "_id">) {
    const insertUserResult = client
      .db("homework")
      .collection("users")
      .insertOne(inputObject);
    return insertUserResult;
  },

  async deleteUserById(id: string) {
    const deleteUserResult = await client
      .db("homework")
      .collection<UserViewModel>("users")
      .deleteOne({ _id: new ObjectId(id) });
    return deleteUserResult;
  },

  async countUsers(
    searchEmailTerm: string,
    searchLoginTerm: string,
    operator: "or" | "and" = "or"
  ) {
    const mongoUsersCount = await client
      .db("homework")
      .collection<UserViewModel>("users")
      .countDocuments({
        [`$${operator}`]: [
          { email: { $regex: `${searchEmailTerm}`, $options: "i" } },
          { login: { $regex: `${searchLoginTerm}`, $options: "i" } },
        ],
      });
    return mongoUsersCount;
  },
};
