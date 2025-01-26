import { Response, Router } from "express";

import { getCommentsService } from "./comments.service";

import { CommentIdParamModel } from "./models/CommentIdParamModel";
import { CommentInputModel } from "./models/CommentInputModel";

import { adminBasicAuth, bearerAuth } from "../../middlewares/authentication";
import {
  RequestWithParams,
  RequestWithParamsAndBody,
} from "../../utils/models/customizedExpressTypes";

export const commentsRouter = Router();

commentsRouter.get(
  "/:id",
  async (req: RequestWithParams<CommentIdParamModel>, res: Response) => {
    const response = await getCommentsService.readCommentById(req.params.id);
    if (Array.isArray(response)) {
      let [responseCode, responseObject] = response;
      res.status(responseCode as number).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

commentsRouter.put(
  "/:id",
  bearerAuth,
  async (
    req: RequestWithParamsAndBody<CommentIdParamModel, CommentInputModel>,
    res: Response
  ) => {
    const response = await getCommentsService.updateCommentById(
      res.locals.user,
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

commentsRouter.delete(
  "/:id",
  bearerAuth,
  async (req: RequestWithParams<CommentIdParamModel>, res: Response) => {
    const response = await getCommentsService.deleteCommentById(
      res.locals.user,
      req.params.id
    );
    res.sendStatus(response);
  }
);
