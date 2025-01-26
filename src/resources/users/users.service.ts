import Joi from "joi";
import bcrypt from "bcrypt";

import { getUsersRepository } from "./users.repository";

import { UserInputModel } from "./models/UserInputModel";
import { UserMongoModel } from "./models/UserMongoModel";
import { UserQueryModel } from "./models/UserQueryModel";
import { UserViewModel } from "./models/UserViewModel";

import { HTTP_CODES, HttpStatusType } from "../../utils/httpResponsesCodes";
import {
  transformJoiError,
  mapMongoToViewUser,
  isValidMongoId,
  makePaginator,
} from "../../utils/utilityFunctions";
import {
  validatePageNumber,
  validatePageSize,
  validateSortBy,
  validateSortDirection,
} from "../../utils/validationFunctions";
import { APIErrorResult } from "../../utils/models/APIErrorResult";
import { Paginator } from "../../utils/models/Paginator";

export const userSchema = Joi.object({
  email: Joi.string()
    .trim()
    .pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    .required()
    .messages({
      "any.required": "value is required",
      "string.base": "value must be a string",
      "string.pattern.base": "value must match the email pattern",
      "string.empty": "value must not be an empty string",
    }),
  login: Joi.string()
    .trim()
    .min(3)
    .max(10)
    .pattern(/^[a-zA-Z0-9_-]*$/)
    .required()
    .messages({
      "any.required": "value is required",
      "string.base": "value must be a string",
      "string.min": "value is shorter than 3 characters",
      "string.max": "value is longer than 10 characters",
      "string.pattern.base": "value must match the login pattern",
      "string.empty": "value must not be an empty string",
    }),
  password: Joi.string().trim().min(6).max(20).required().messages({
    "any.required": "value is required",
    "string.base": "value must be a string",
    "string.min": "value is shorter than 6 characters",
    "string.max": "value is longer than 20 characters",
    "string.empty": "value must not be an empty string",
  }),
});

const validateUserSortBy = validateSortBy(["id", "email", "login", "password"]);

const userQuerySchema = Joi.object({
  pageNumber: Joi.custom(validatePageNumber).default(1),
  pageSize: Joi.custom(validatePageSize).default(10),
  searchEmailTerm: Joi.string().default(""),
  searchLoginTerm: Joi.string().default(""),
  sortBy: Joi.custom(validateUserSortBy).default("createdAt"),
  sortDirection: Joi.custom(validateSortDirection).default("desc"),
});

export const checkIfEmailIsUnique = async (email: string) => {
  const { error, value: validQuery } = userQuerySchema.validate(
    { searchEmailTerm: email },
    { abortEarly: false, stripUnknown: true }
  );
  if (error) throw new Error("error");
  else {
    const isEmailUnique =
      (await getUsersRepository.findUsers(validQuery, "and")).length === 0;
    return isEmailUnique;
  }
};

export const checkIfLoginIsUnique = async (login: string) => {
  const { error, value: validQuery } = userQuerySchema.validate(
    { searchLoginTerm: login },
    { abortEarly: false, stripUnknown: true }
  );
  if (error) throw new Error("error");
  else {
    const isLoginUnique =
      (await getUsersRepository.findUsers(validQuery, "and")).length === 0;
    return isLoginUnique;
  }
};

export const getUsersService = {
  async readUsers(
    query: UserQueryModel
  ): Promise<[HttpStatusType, Paginator<UserViewModel>]> {
    const validQuery: UserQueryModel = userQuerySchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    }).value;
    const usersCount = await getUsersRepository.countUsers(
      validQuery.searchEmailTerm,
      validQuery.searchLoginTerm
    );
    const mongoUsers = await getUsersRepository.findUsers(validQuery, "or");
    const viewUsers: UserViewModel[] = mongoUsers.map(mapMongoToViewUser);
    const responseObject: Paginator<UserViewModel> = makePaginator<
      UserQueryModel,
      UserViewModel
    >(validQuery, usersCount, viewUsers);
    return [HTTP_CODES.OK_200, responseObject];
  },

  async createUser(
    input: UserInputModel
  ): Promise<[HttpStatusType, UserViewModel | APIErrorResult]> {
    const { error, value: validInputUser } = userSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | UserViewModel;
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
        const userViewWithoutIdObject: Omit<UserViewModel, "id"> = {
          ...rest,
          createdAt: new Date().toISOString(),
        };
        const userMongoWithoutIdObject: Omit<UserMongoModel, "_id"> = {
          ...userViewWithoutIdObject,
          salt,
          hash,
          isConfirmed,
        };
        const insertResult = await getUsersRepository.insertUser(
          userMongoWithoutIdObject
        );
        const newUser = {
          ...userViewWithoutIdObject,
          id: String(insertResult.insertedId),
        };
        responseCode = HTTP_CODES.CREATED_201;
        responseObject = newUser;
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

    return [responseCode, responseObject];
  },

  async readUserById(
    id: string
  ): Promise<HttpStatusType | [HttpStatusType, UserViewModel]> {
    const mongoUser = isValidMongoId(id)
      ? await getUsersRepository.findViewUserById(id)
      : null;
    const viewUser = mongoUser ? mapMongoToViewUser(mongoUser) : null;
    return viewUser ? [HTTP_CODES.OK_200, viewUser] : HTTP_CODES.NOT_FOUND_404;
  },

  async deleteUserById(id: string): Promise<HttpStatusType> {
    const deleteUserResult = isValidMongoId(id)
      ? await getUsersRepository.deleteUserById(id)
      : null;
    if (deleteUserResult === null || deleteUserResult.deletedCount === 0) {
      return HTTP_CODES.NOT_FOUND_404;
    } else {
      return HTTP_CODES.NO_CONTENT_204;
    }
  },
};
