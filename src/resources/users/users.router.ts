import { Response, Router } from "express";

import { getUsersService } from "./users.service";

import { UserIdParamModel } from "./models/UserIdParamModel";
import { UserInputModel } from "./models/UserInputModel";
import { UserQueryModel } from "./models/UserQueryModel";

import { adminBasicAuth } from "../../middlewares/authentication";
import {
  RequestWithBody,
  RequestWithParams,
  RequestWithQuery,
} from "../../utils/models/customizedExpressTypes";

export const usersRouter = Router();

usersRouter.get(
  "/",
  [adminBasicAuth],
  async (req: RequestWithQuery<UserQueryModel>, res: Response) => {
    const [responseCode, responseObject] = await getUsersService.readUsers(
      req.query
    );
    res.status(responseCode).json(responseObject);
  }
);

usersRouter.post(
  "/",
  adminBasicAuth,
  async (req: RequestWithBody<UserInputModel>, res: Response) => {
    const [responseCode, responseObject] = await getUsersService.createUser(
      req.body
    );
    res.status(responseCode).json(responseObject);
  }
);

usersRouter.delete(
  "/:id",
  adminBasicAuth,
  async (req: RequestWithParams<UserIdParamModel>, res: Response) => {
    const response = await getUsersService.deleteUserById(req.params.id);
    res.sendStatus(response);
  }
);
