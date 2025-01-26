import { ObjectId } from "mongodb";

import { client } from "../../db/db";

import { CommentInputModel } from "./models/CommentInputModel";
import { CommentMongoModel } from "./models/CommentMongoModel";
import { CommentQueryModel } from "./models/CommentQueryModel";
import { CommentViewModel } from "./models/CommentViewModel";

export const getCommentsRepository = {
  async insertComment(input: Omit<CommentMongoModel, "id">) {
    const insertCommentResult = await client
      .db("homework")
      .collection<Omit<CommentMongoModel, "id">>("comments")
      .insertOne(input);
    return insertCommentResult;
  },

  async findCommentById(id: string) {
    const mongoComment = await client
      .db("homework")
      .collection<CommentViewModel>("comments")
      .findOne({ _id: new ObjectId(id) }, { projection: { postId: 0 } });
    console.log(mongoComment);
    return mongoComment;
  },

  async updateCommentById(id: string, input: CommentInputModel) {
    const updateCommentResult = await client
      .db("homework")
      .collection<CommentViewModel>("comments")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...input } });
    return updateCommentResult;
  },

  async deleteCommentById(id: string) {
    const deleteCommentResult = await client
      .db("homework")
      .collection<CommentViewModel>("comments")
      .deleteOne({ _id: new ObjectId(id) });
    return deleteCommentResult;
  },

  async countCommentsByPostId(id: string) {
    const countCommentsResult = await client
      .db("homework")
      .collection<CommentViewModel>("comments")
      .countDocuments({ postId: id });
    return countCommentsResult;
  },

  async findCommentsByPostId(id: string, query: CommentQueryModel) {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const findCommentsResult = await client
      .db("homework")
      .collection<CommentViewModel>("comments")
      .find({ postId: id }, { projection: { postId: 0 } })
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return findCommentsResult;
  },
};
