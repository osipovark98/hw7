import { Router, Request, Response } from "express";

import { getAuthService } from "./auth.service";
import { getUsersService } from "../users/users.service";

import { ConfirmationQueryModel } from "./models/ConfirmationQueryModel";
import { LoginInputModel } from "./models/LoginInputModel";
import { RegistrationResendModel } from "./models/RegistrationResendModel";

import { UserInputModel } from "../users/models/UserInputModel";

import { bearerAuth } from "../../middlewares/authentication";

import {
  RequestWithBody,
  RequestWithQuery,
} from "../../utils/models/customizedExpressTypes";
import { HTTP_CODES } from "../../utils/httpResponsesCodes";

export const authRouter = Router();

authRouter.post(
  "/login",
  async (req: RequestWithBody<LoginInputModel>, res: Response) => {
    const response = await getAuthService.login(req.body);
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

authRouter.post(
  "/registration",
  async (req: RequestWithBody<UserInputModel>, res: Response) => {
    const response = await getAuthService.register(req.body);
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

authRouter.post(
  "/registration-email-resending",
  async (req: RequestWithBody<RegistrationResendModel>, res: Response) => {
    const response = await getAuthService.resend(req.body);
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

authRouter.post(
  "/registration-confirmation",
  async (req: RequestWithBody<ConfirmationQueryModel>, res: Response) => {
    const response = await getAuthService.confirm(req.body);
    if (Array.isArray(response)) {
      const [responseCode, responseObject] = response;
      res.status(responseCode).json(responseObject);
    } else {
      res.sendStatus(response);
    }
  }
);

authRouter.get("/me", bearerAuth, async (req: Request, res: Response) => {
  const { email, login, id } = res.locals.user;
  res
    .status(HTTP_CODES.OK_200)
    .json({ email: email, login: login, userId: id });
});
