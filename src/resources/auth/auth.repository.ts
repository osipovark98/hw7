import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

import { client } from "../../db/db";

import { ConfirmationQueryModel } from "./models/ConfirmationQueryModel";
import { ConfirmationTokenInputModel } from "./models/ConfirmationTokenInputModel";
import { LoginInputModel } from "./models/LoginInputModel";
import { RegistrationResendModel } from "./models/RegistrationResendModel";
import { UserMongoModel } from "../users/models/UserMongoModel";

export const getAuthRepository = {
  async emailAuth(authObject: LoginInputModel): Promise<UserMongoModel | null> {
    const { loginOrEmail: email, password } = authObject;
    const user = await client
      .db("homework")
      .collection<UserMongoModel>("users")
      .findOne({
        email: email,
      });
    if (!user) return null;
    const hash = await bcrypt.hash(password, user.salt);
    if (hash === user.hash) return user;
    return null;
  },

  async loginAuth(authObject: LoginInputModel) {
    const { loginOrEmail: login, password } = authObject;
    const user = await client
      .db("homework")
      .collection<UserMongoModel>("users")
      .findOne({
        login: login,
      });
    if (!user) return null;
    const hash = await bcrypt.hash(password, user.salt);
    if (hash === user.hash) return user;
    return null;
  },

  async findTokenInfo(query: ConfirmationQueryModel) {
    const { code } = query;
    const user = await client
      .db("homework")
      .collection<ConfirmationTokenInputModel & { _id: ObjectId }>("tokens")
      .findOne({
        token: code,
      });
    if (!user) return null;
    return user;
  },

  async deleteTokenInfo(query: ConfirmationQueryModel) {
    const { code } = query;
    const user = await client
      .db("homework")
      .collection<ConfirmationTokenInputModel & { _id: ObjectId }>("tokens")
      .deleteOne({
        token: code,
      });
    if (!user) return null;
    return user;
  },

  async insertConfirmationToken(input: ConfirmationTokenInputModel) {
    const insertResult = await client
      .db("homework")
      .collection<ConfirmationTokenInputModel>("tokens")
      .insertOne(input);
    return insertResult;
  },

  async updateUser(input: UserMongoModel) {
    const updateUserResult = await client
      .db("homework")
      .collection<UserMongoModel>("users")
      .updateOne({ _id: input._id }, { $set: input });
    return updateUserResult;
  },

  async findUserByEmail(/*input: RegistrationResendModel*/ email: string) {
    /*const { email } = input;*/
    const user = await client
      .db("homework")
      .collection<UserMongoModel>("users")
      .findOne({
        email: email,
      });
    if (!user) return null;
    return user;
  },
};
