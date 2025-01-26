import { ObjectId } from "mongodb";

import { client } from "../../db/db";

import { BlogInputModel } from "./models/BlogInputModel";
import { BlogQueryModel } from "./models/BlogQueryModel";
import { BlogViewModel } from "./models/BlogViewModel";

export const getBlogsRepository = {
  async findBlogs(query: BlogQueryModel) {
    const { searchNameTerm, pageNumber, pageSize, sortBy, sortDirection } =
      query;
    const mongoBlogs = await client
      .db("homework")
      .collection<BlogViewModel>("blogs")
      .find({
        name: { $regex: `${searchNameTerm}`, $options: "i" },
      })
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return mongoBlogs;
  },

  async insertBlog(input: Omit<BlogViewModel, "id">) {
    const insertResult = await client
      .db("homework")
      .collection<Omit<BlogViewModel, "id">>("blogs")
      .insertOne(input);
    return insertResult;
  },

  async findBlogById(id: string) {
    const mongoBlog = await client
      .db("homework")
      .collection<BlogViewModel>("blogs")
      .findOne({ _id: new ObjectId(id) });
    return mongoBlog;
  },

  async updateBlogById(id: string, input: BlogInputModel) {
    const updateBlogResult = await client
      .db("homework")
      .collection<BlogViewModel>("blogs")
      .updateOne({ _id: new ObjectId(id) }, { $set: input });
    return updateBlogResult;
  },

  async deleteBlogById(id: string) {
    const deleteBlogResult = await client
      .db("homework")
      .collection<BlogViewModel>("blogs")
      .deleteOne({ _id: new ObjectId(id) });
    return deleteBlogResult;
  },

  async countBlogs(searchNameTerm: string) {
    const mongoBlogsCount = await client
      .db("homework")
      .collection<BlogViewModel>("blogs")
      .countDocuments({
        name: { $regex: `${searchNameTerm}`, $options: "i" },
      });
    return mongoBlogsCount;
  },
};
