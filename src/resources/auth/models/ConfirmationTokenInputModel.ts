import { ObjectId } from "mongodb";

export type ConfirmationTokenInputModel = {
  userId: ObjectId;
  token: string;
  expirationDate: Date;
};
