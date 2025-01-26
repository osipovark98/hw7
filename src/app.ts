import express from "express";
import cors from "cors";

import { db } from "./db/db";
import { authRouter } from "./resources/auth/auth.router";
import { blogsRouter } from "./resources/blogs/blogs.router";
import { commentsRouter } from "./resources/comments/comments.router";
import { postsRouter } from "./resources/posts/posts.router";
import { testingRouter } from "./resources/testing/testing.router";
import { usersRouter } from "./resources/users/users.router";
import { routersPaths } from "./utils/routersPaths";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(db);
});

app.use(routersPaths.auth, authRouter);

app.use(routersPaths.blogs, blogsRouter);

app.use(routersPaths.comments, commentsRouter);

app.use(routersPaths.posts, postsRouter);

app.use(routersPaths.testing, testingRouter);

app.use(routersPaths.users, usersRouter);
