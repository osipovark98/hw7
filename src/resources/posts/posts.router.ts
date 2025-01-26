import { Response, Router } from "express";

import { getPostsService } from "./posts.service";

import { getCommentsService } from "../comments/comments.service";

import { PostIdParamModel } from "./models/PostIdParamModel";
import { PostInputModel } from "./models/PostInputModel";
import { PostQueryModel } from "./models/PostQueryModel";

import { CommentInputModel } from "../comments/models/CommentInputModel";
import { CommentQueryModel } from "../comments/models/CommentQueryModel";

import { adminBasicAuth, bearerAuth } from "../../middlewares/authentication";
import {
  RequestWithParams,
  RequestWithBody,
  RequestWithQuery,
  RequestWithParamsAndBody,
  RequestWithParamsAndQuery,
} from "../../utils/models/customizedExpressTypes";

export const postsRouter = Router();

postsRouter.get(
  "/:id/comments",
  async (
    req: RequestWithParamsAndQuery<PostIdParamModel, CommentQueryModel>,
    res: Response
  ) => {
    const response = await getCommentsService.readCommentsOfPost(
      req.params.id,
      req.query
    );
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

postsRouter.post(
  "/:id/comments",
  bearerAuth,
  async (
    req: RequestWithParamsAndBody<PostIdParamModel, CommentInputModel>,
    res: Response
  ) => {
    const response = await getCommentsService.createCommentOfPost(
      res.locals.user,
      req.params.id,
      req.body
    );
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

postsRouter.get(
  "/",
  async (req: RequestWithQuery<PostQueryModel>, res: Response) => {
    const [responseCode, responseObject] = await getPostsService.readPosts(
      req.query
    );
    res.status(responseCode).json(responseObject);
  }
);

postsRouter.post(
  "/",
  adminBasicAuth,
  async (req: RequestWithBody<PostInputModel>, res: Response) => {
    const [responseCode, responseObject] = await getPostsService.createPost(
      req.body
    );
    res.status(responseCode).json(responseObject);
  }
);

postsRouter.get(
  "/:id",
  async (req: RequestWithParams<PostIdParamModel>, res: Response) => {
    const response = await getPostsService.readPostById(req.params.id);
    if (Array.isArray(response)) {
      let [responseCode, responseObject] = response;
      res.status(responseCode as number).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

postsRouter.put(
  "/:id",
  adminBasicAuth,
  async (
    req: RequestWithParamsAndBody<PostIdParamModel, PostInputModel>,
    res: Response
  ) => {
    const response = await getPostsService.updatePostById(
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

postsRouter.delete(
  "/:id",
  adminBasicAuth,
  async (req: RequestWithParams<PostIdParamModel>, res: Response) => {
    const response = await getPostsService.deletePostById(req.params.id);
    res.sendStatus(response);
  }
);

//.CHECKED
