import { Request, Response, NextFunction } from "express";

import { extractUserIdFromJWT } from "../resources/auth/auth.service";

import { getUsersRepository } from "../resources/users/users.repository";

import { tokenService } from "../utils/token-service";
import { HTTP_CODES } from "../utils/httpResponsesCodes";
import { isValidMongoId, mapMongoToViewUser } from "../utils/utilityFunctions";

export const bearerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader: string | undefined = req.get("authorization");
  if (!authHeader) {
    res.sendStatus(HTTP_CODES.UNAUTHORIZED_401);
    return;
  }
  const [kind, token] = authHeader.split(" ");
  const userId = String(extractUserIdFromJWT(token));
  const mongoUser = isValidMongoId(userId)
    ? await getUsersRepository.findViewUserById(userId)
    : null;
  const viewUser = mongoUser ? mapMongoToViewUser(mongoUser) : null;
  if (kind === "Bearer" && viewUser) {
    res.locals.user = {
      id: viewUser.id,
      login: viewUser.login,
      email: viewUser.email,
    };
    next();
  } else {
    res.sendStatus(HTTP_CODES.UNAUTHORIZED_401);
  }
};

export const adminBasicAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader: string | undefined = req.get("authorization");
  if (!authHeader) {
    res.sendStatus(401);
    return;
  }
  const [kind, token] = authHeader.split(" ");
  const [username, password] = Buffer.from(token, "base64")
    .toString()
    .split(":");
  if (kind === "Basic" && username === "admin" && password === "qwerty") {
    next();
  } else {
    res.sendStatus(401);
  }
};
