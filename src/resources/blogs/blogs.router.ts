import { Response, Router } from "express";

import { getBlogsService } from "./blogs.service";

import { BlogIdParamModel } from "./models/BlogIdParamModel";
import { BlogInputModel } from "./models/BlogInputModel";
import { BlogQueryModel } from "./models/BlogQueryModel";

import { getPostsService } from "../posts/posts.service";

import { PostInputModel } from "../posts/models/PostInputModel";
import { PostQueryModel } from "../posts/models/PostQueryModel";

import { routersPaths } from "../../utils/routersPaths";
import { adminBasicAuth } from "../../middlewares/authentication";
import {
  RequestWithParams,
  RequestWithBody,
  RequestWithQuery,
  RequestWithParamsAndBody,
  RequestWithParamsAndQuery,
} from "../../utils/models/customizedExpressTypes";

export const blogsRouter = Router();

blogsRouter.get(
  "/",
  async (req: RequestWithQuery<BlogQueryModel>, res: Response) => {
    const [responseCode, responseObject] = await getBlogsService.readBlogs(
      req.query
    );
    res.status(responseCode).json(responseObject);
  }
);

blogsRouter.post(
  "/",
  adminBasicAuth,
  async (req: RequestWithBody<BlogInputModel>, res: Response) => {
    const [responseCode, responseObject] = await getBlogsService.createBlog(
      req.body
    );
    res.status(responseCode).json(responseObject);
  }
);

blogsRouter.get(
  "/:id" + routersPaths.posts,
  async (
    req: RequestWithParamsAndQuery<BlogIdParamModel, PostQueryModel>,
    res: Response
  ) => {
    const response = await getPostsService.readPostsOfBlog(
      req.params.id,
      req.query
    );
    if (Array.isArray(response)) {
      const [statusCode, value] = response;
      res.status(statusCode).json(value);
    } else {
      res.sendStatus(response);
    }
  }
);

blogsRouter.post(
  "/:id" + routersPaths.posts,
  adminBasicAuth,
  async (
    req: RequestWithParamsAndBody<
      BlogIdParamModel,
      Omit<PostInputModel, "blogId">
    >,
    res: Response
  ) => {
    const response = await getPostsService.createPostOfBlog({
      ...req.body,
      blogId: req.params.id,
    });
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else res.sendStatus(response);
  }
);

blogsRouter.get(
  "/:id",
  async (req: RequestWithParams<BlogIdParamModel>, res: Response) => {
    const response = await getBlogsService.readBlogById(req.params.id);
    if (Array.isArray(response)) {
      let [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

blogsRouter.put(
  "/:id",
  adminBasicAuth,
  async (
    req: RequestWithParamsAndBody<BlogIdParamModel, BlogInputModel>,
    res: Response
  ) => {
    const response = await getBlogsService.updateBlogById(
      req.params.id,
      req.body
    );
    if (Array.isArray(response)) {
      let [responseCode, responseObject] = response;
      res.status(responseCode as number).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

blogsRouter.delete(
  "/:id",
  adminBasicAuth,
  async (req: RequestWithParams<BlogIdParamModel>, res: Response) => {
    const response = await getBlogsService.deleteBlogById(req.params.id);
    res.sendStatus(response);
  }
);
