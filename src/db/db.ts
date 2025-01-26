import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

import { BlogViewModel } from "../resources/blogs/models/BlogViewModel";
import { PostViewModel } from "../resources/posts/models/PostViewModel";

export const db: DBType = {
  blogs: [],
  posts: [],
};

type DBType = {
  blogs: BlogViewModel[];
  posts: PostViewModel[];
};

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("URI is not found");
}
export const client = new MongoClient(uri);

export const runDB = async () => {
  try {
    await client.connect();
    await client.db("homework").command({ ping: 1 });
    console.log("Successfully connected to the mongodb server");
  } catch {
    console.log("Connection failed");
    await client.close();
  }
};
