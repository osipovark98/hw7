import Joi from "joi";
import { ObjectId, WithId, Document } from "mongodb";

import { APIErrorResult } from "./models/APIErrorResult";
import { FieldError } from "./models/FieldError";
import { QueryModel } from "./models/QueryModel";

import { BlogViewModel } from "../resources/blogs/models/BlogViewModel";
import { CommentViewModel } from "../resources/comments/models/CommentViewModel";
import { PostViewModel } from "../resources/posts/models/PostViewModel";
import { UserViewModel } from "../resources/users/models/UserViewModel";

export const transformJoiError = (
  error: Joi.ValidationError,
  fieldName?: string
) => {
  const customError: APIErrorResult = {
    errorsMessages: [],
  };
  customError.errorsMessages = error.details.map((detail) => {
    return {
      message: detail.message,
      field: fieldName ? fieldName : detail.path.join("."),
    };
  });
  customError.errorsMessages = customError.errorsMessages.filter(
    (em, i, arr) => {
      const searchArr = arr.slice(0, i);
      if (searchArr.find((item) => item.field === em.field)) return false;
      return true;
    }
  );
  return customError;
};

export const joinErrorMessages = (arrayOfErrors: (APIErrorResult | null)[]) => {
  return {
    errorsMessages: arrayOfErrors
      .map((e) => (e ? e.errorsMessages : []))
      .flat(),
  };
};

export function mapMongoToViewBlog(
  obj: Omit<BlogViewModel, "id"> & { _id: ObjectId }
): BlogViewModel {
  const { _id: id, ...rest } = obj;
  const blogView = { ...rest, id: id.toString() };
  return blogView;
}

export function mapMongoToViewComment(
  obj: Omit<CommentViewModel, "id"> & { _id: ObjectId }
): CommentViewModel {
  const { _id: id, ...rest } = obj;
  const commentView = { ...rest, id: id.toString() };
  return commentView;
}

export function mapMongoToViewPost(
  obj: Omit<PostViewModel, "id"> & { _id: ObjectId }
): PostViewModel {
  const { _id: id, ...rest } = obj;
  const postView = { ...rest, id: id.toString() };
  return postView;
}

export function mapMongoToViewUser(
  obj: Omit<UserViewModel, "id"> & { _id: ObjectId }
): UserViewModel {
  const { _id: id, ...rest } = obj;
  const userView = { ...rest, id: id.toString() };
  return userView;
}

export function isValidMongoId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

export function makePaginator<Q extends QueryModel, T>(
  query: Q,
  totalCount: number,
  items: T[]
) {
  const { pageNumber, pageSize } = query;
  return {
    pagesCount: Math.ceil(totalCount / pageSize),
    page: pageNumber,
    pageSize,
    totalCount,
    items,
  };
}
