import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

import { SETTINGS } from "../settings";

import { UserMongoModel } from "../resources/users/models/UserMongoModel";

export const tokenService = {
  async createAccessJWT(userId: ObjectId) {
    const token = jwt.sign({ userId }, SETTINGS.JWT_SECRET, {
      expiresIn: "40m",
    });
    return token;
  },

  createConfirmationToken(userId: ObjectId) {
    const confirmationToken = crypto.randomBytes(16).toString("hex");
    return confirmationToken;
  },

  async getUserIdByToken(token: string) {
    try {
      const result: any = jwt.verify(token, SETTINGS.JWT_SECRET);
      return new ObjectId(result.userId as string);
    } catch {
      return null;
    }
  },
};
