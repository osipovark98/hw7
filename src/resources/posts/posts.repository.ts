import { ObjectId } from "mongodb";

import { client } from "../../db/db";
import { PostInputModel } from "./models/PostInputModel";
import { PostQueryModel } from "./models/PostQueryModel";
import { PostViewModel } from "./models/PostViewModel";

export const getPostsRepository = {
  async findPosts(query: PostQueryModel) {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const mongoPosts = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .find({})
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return mongoPosts;
  },

  async insertPost(inputObject: Omit<PostViewModel, "id">) {
    const insertResult = await client
      .db("homework")
      .collection<Omit<PostViewModel, "id">>("posts")
      .insertOne(inputObject);
    return insertResult;
  },

  async findPostById(id: string) {
    const mongoPost = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .findOne({ _id: new ObjectId(id) });
    return mongoPost;
  },

  async updatePostById(
    id: string,
    inputObject: PostViewModel & { blogName: string }
  ) {
    const updatePostResult = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: inputObject,
        }
      );
    return updatePostResult;
  },

  async deletePostById(id: string) {
    const deletePostResult = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .deleteOne({ _id: new ObjectId(id) });
    return deletePostResult;
  },

  //? one or two methods
  async countPostsByBlogId(id: string) {
    const countPostsResult = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .countDocuments({ blogId: id });
    return countPostsResult;
  },

  async countAllPosts() {
    const countPostsResult = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .countDocuments();
    return countPostsResult;
  },

  async findPostsByBlogId(id: string, query: PostQueryModel) {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const findPostsResult = await client
      .db("homework")
      .collection<PostViewModel>("posts")
      .find({ blogId: id })
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return findPostsResult;
  },
};

//.CHECKED
