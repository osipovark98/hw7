import Joi from "joi";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { isAfter, addMinutes } from "date-fns";

import { SETTINGS } from "../../settings";

import { getAuthRepository } from "./auth.repository";
import { getUsersRepository } from "../users/users.repository";

import { getAuthManager } from "./auth.manager";

import { ConfirmationQueryModel } from "./models/ConfirmationQueryModel";
import { LoginInputModel } from "./models/LoginInputModel";
import { LoginTokenModel } from "./models/LoginTokenModel";
import { MeViewModel } from "./models/MeViewModel";
import { RegistrationResendModel } from "./models/RegistrationResendModel";

import { emailAdapter } from "../../adapters/email.adapter";

import {
  checkIfEmailIsUnique,
  checkIfLoginIsUnique,
  emailSchema,
  loginSchema,
  userSchema,
} from "../users/users.service";

import { HTTP_CODES, HttpStatusType } from "../../utils/httpResponsesCodes";
import {
  joinErrorMessages,
  mapMongoToViewUser,
  transformJoiError,
} from "../../utils/utilityFunctions";
import { APIErrorResult } from "../../utils/models/APIErrorResult";
import { UserInputModel } from "../users/models/UserInputModel";
import { UserMongoModel } from "../users/models/UserMongoModel";
import { UserViewModel } from "../users/models/UserViewModel";

const passwordSchema = Joi.string().trim().min(6).max(20).required().messages({
  "any.required": "password is required",
  "string.base": "password must be a string",
  "string.min": "password is shorter than 6 characters",
  "string.max": "password is longer than 20 characters",
  "string.empty": "password must not be an empty string",
});

const authSchema = Joi.object({
  loginOrEmail: Joi.alternatives().try(emailSchema, loginSchema).match("one"),
  password: passwordSchema,
});

function createAccessJWT(userId: ObjectId) {
  const accessToken = jwt.sign({ userId }, SETTINGS.JWT_SECRET, {
    expiresIn: "40m",
  });
  return accessToken;
}

export function extractUserIdFromJWT(accessToken: string) {
  try {
    const result: any = jwt.verify(accessToken, SETTINGS.JWT_SECRET);
    return new ObjectId(result.userId as string);
  } catch {
    return null;
  }
}

async function createConfirmationToken(userId: ObjectId) {
  const confirmationToken = crypto.randomBytes(16).toString("hex");
  await getAuthRepository.insertConfirmationToken({
    userId,
    token: confirmationToken,
    expirationDate: addMinutes(new Date(), 1),
  });
  return confirmationToken;
}

export const getAuthService = {
  async login(
    input: LoginInputModel
  ): Promise<
    HttpStatusType | [HttpStatusType, APIErrorResult | LoginTokenModel]
  > {
    const {
      loginOrEmail: email,
      loginOrEmail: login,
      password: password,
    } = input;
    const { error: emailError, value: emailValue } = emailSchema.validate(
      email,
      {
        abortEarly: false,
      }
    );
    const { error: loginError, value: loginValue } = loginSchema.validate(
      login,
      {
        abortEarly: false,
      }
    );
    const { error: passwordError, value: passwordValue } =
      passwordSchema.validate(password, {
        abortEarly: false,
      });
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | LoginTokenModel | undefined;
    if (!emailError && !passwordError) {
      const user = await getAuthRepository.emailAuth({
        loginOrEmail: emailValue,
        password: passwordValue,
      });
      const token = user ? createAccessJWT(user._id) : "";
      responseObject = token ? { accessToken: token } : undefined;
      responseCode = user ? HTTP_CODES.OK_200 : HTTP_CODES.UNAUTHORIZED_401;
    } else if (!loginError && !passwordError) {
      const user = await getAuthRepository.loginAuth({
        loginOrEmail: loginValue,
        password: passwordValue,
      });
      const token = user ? createAccessJWT(user._id) : "";
      responseObject = token ? { accessToken: token } : undefined;
      responseCode = user ? HTTP_CODES.OK_200 : HTTP_CODES.UNAUTHORIZED_401;
    } else {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = joinErrorMessages([
        emailError ? transformJoiError(emailError, "loginOrEmail") : null,
        loginError ? transformJoiError(loginError, "loginOrEmail") : null,
        passwordError ? transformJoiError(passwordError, "password") : null,
      ]);
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async register(
    input: UserInputModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    const { error, value: validInputUser } = userSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | undefined;
    if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
    } else {
      const { password, ...rest } = validInputUser;
      const { email, login } = rest;
      const isEmailUnique = await checkIfEmailIsUnique(email);
      const isLoginUnique = await checkIfLoginIsUnique(login);
      if (isEmailUnique && isLoginUnique) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const isConfirmed = false;
        const createdAt = new Date();
        const insertUserObject = {
          ...rest,
          salt,
          hash,
          isConfirmed,
          createdAt: createdAt.toISOString(),
        };
        const insertUserResult = await getUsersRepository.insertUser(
          insertUserObject
        );
        const confirmationToken = await createConfirmationToken(
          insertUserResult.insertedId
        );
        await getAuthManager.sendRegistrationConfirmation(
          email,
          confirmationToken
        );
        responseCode = HTTP_CODES.NO_CONTENT_204;
      } else {
        responseCode = HTTP_CODES.BAD_REQUEST_400;
        responseObject = {
          errorsMessages: [
            {
              field: isEmailUnique ? "login" : "email",
              message: `${isEmailUnique ? "login" : "email"} should be unique`,
            },
          ],
        };
      }
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async confirm(
    query: ConfirmationQueryModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | null;
    const mongoTokenInfo = await getAuthRepository.findTokenInfo(query);
    if (!mongoTokenInfo) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = {
        errorsMessages: [
          {
            message:
              "the confirmation code is either incorrrect or had already been applied",
            field: "code",
          },
        ],
      };
      return [responseCode, responseObject];
    } else if (isAfter(new Date(), mongoTokenInfo.expirationDate)) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = {
        errorsMessages: [
          {
            message: "the confirmation code is expired",
            field: "code",
          },
        ],
      };
      return [responseCode, responseObject];
    }
    const mongoUser = (await getUsersRepository.findMongoUserById(
      mongoTokenInfo.userId
    )) as UserMongoModel;
    if (mongoUser.isConfirmed) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = {
        errorsMessages: [
          {
            message: "the account had already been confirmed",
            field: "code",
          },
        ],
      };
    } else {
      responseCode = HTTP_CODES.NO_CONTENT_204;
      responseObject = null;
      await getAuthRepository.updateUser({ ...mongoUser, isConfirmed: true });
      await getAuthRepository.deleteTokenInfo(query);
    }

    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async resend(
    input: RegistrationResendModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | null;
    const { email } = input;
    const { error: emailError, value: emailValue } = emailSchema.validate(
      email,
      { abortEarly: false }
    );
    if (emailError) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(emailError);
      return [responseCode, responseObject];
    }
    const mongoUser = await getAuthRepository.findUserByEmail(emailValue);
    if (!mongoUser) {
      console.log(1);
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = {
        errorsMessages: [
          {
            message: "no user with that email address",
            field: "email",
          },
        ],
      };
    } else if (mongoUser.isConfirmed) {
      console.log(2);
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = {
        errorsMessages: [
          {
            message: "the user is already confirmed",
            field: "email",
          },
        ],
      };
    } else {
      console.log(3);
      const confirmationToken = await createConfirmationToken(mongoUser._id);
      await getAuthManager.sendRegistrationConfirmation(
        emailValue,
        confirmationToken
      );
      responseCode = HTTP_CODES.NO_CONTENT_204;
      responseObject = null;
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },
};
