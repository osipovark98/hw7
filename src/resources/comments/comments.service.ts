import Joi from "joi";

import { getCommentsRepository } from "./comments.repository";
import { getPostsRepository } from "../posts/posts.repository";
import { getUsersRepository } from "../users/users.repository";

import { CommentInputModel } from "./models/CommentInputModel";
import { CommentQueryModel } from "./models/CommentQueryModel";
import { CommentViewModel } from "./models/CommentViewModel";

import { UserViewModel } from "../users/models/UserViewModel";

import { HttpStatusType, HTTP_CODES } from "../../utils/httpResponsesCodes";
import {
  transformJoiError,
  isValidMongoId,
  mapMongoToViewComment,
  mapMongoToViewUser,
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

const commentSchema = Joi.object({
  content: Joi.string().trim().min(20).max(300).required().messages({
    "any:required": "content is required",
    "string.base": "content must be a string",
    "string.min": "content can't be shorter than 20 characters",
    "string.max": "content can't be longer than 300 characters",
    "string.empty": "empty string can't be used as a content",
  }),
});

const validateCommentSortBy = validateSortBy(["id", "content", "createdAt"]);

const commentQuerySchema = Joi.object({
  pageNumber: Joi.custom(validatePageNumber).default(1),
  pageSize: Joi.custom(validatePageSize).default(10),
  sortBy: Joi.custom(validateCommentSortBy).default("createdAt"),
  sortDirection: Joi.custom(validateSortDirection).default("desc"),
});

export const getCommentsService = {
  async readCommentsOfPost(
    postId: string,
    query: CommentQueryModel
  ): Promise<HttpStatusType | [HttpStatusType, Paginator<CommentViewModel>]> {
    // console.log("readCommentsOfPost");
    let responseCode: HttpStatusType;
    let responseObject: Paginator<CommentViewModel> | undefined;
    const mongoPost = isValidMongoId(postId)
      ? await getPostsRepository.findPostById(postId)
      : null;
    const isPostExistent = !!mongoPost;
    if (!isPostExistent) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else {
      const validQuery: CommentQueryModel = commentQuerySchema.validate(query, {
        abortEarly: false,
        stripUnknown: true,
      }).value;
      const commentsCount = await getCommentsRepository.countCommentsByPostId(
        postId
      );
      const mongoCommentsOfPost =
        await getCommentsRepository.findCommentsByPostId(postId, validQuery);
      const viewCommentsOfPost: CommentViewModel[] = mongoCommentsOfPost.map(
        mapMongoToViewComment
      );
      const commentsPaginator = makePaginator(
        validQuery,
        commentsCount,
        viewCommentsOfPost
      );
      [responseCode, responseObject] = [HTTP_CODES.OK_200, commentsPaginator];
    }
    console.log(responseObject);
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async createCommentOfPost(
    user: Omit<UserViewModel, "createdAt">,
    postId: string,
    input: CommentInputModel
  ): Promise<
    HttpStatusType | [HttpStatusType, CommentViewModel | APIErrorResult]
  > {
    console.log("createCommentOfPost");
    console.log(input);
    let responseCode: HttpStatusType;
    let responseObject: CommentViewModel | APIErrorResult | undefined;
    const { error, value: validInputComment } = commentSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    const mongoPost = isValidMongoId(postId)
      ? await getPostsRepository.findPostById(postId)
      : null;
    const isPostExistent = !!mongoPost;

    if (!isPostExistent) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
    } else {
      responseCode = HTTP_CODES.CREATED_201;
      const newViewComment = {
        ...validInputComment,
        commentatorInfo: {
          userId: user.id,
          userLogin: user.login,
        },
        createdAt: new Date().toISOString(),
      };
      const newDbComment = {
        ...newViewComment,
        postId,
      };
      const insertCommentResult = await getCommentsRepository.insertComment(
        newDbComment
      );
      responseObject = mapMongoToViewComment({
        ...newViewComment,
        _id: insertCommentResult.insertedId,
      });
    }

    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async readCommentById(
    id: string
  ): Promise<HttpStatusType | [HttpStatusType, CommentViewModel]> {
    // console.log("readCommentById");
    const mongoComment = isValidMongoId(id)
      ? await getCommentsRepository.findCommentById(id)
      : null;
    const viewComment = mongoComment
      ? mapMongoToViewComment(mongoComment)
      : null;
    return viewComment
      ? [HTTP_CODES.OK_200, viewComment]
      : HTTP_CODES.NOT_FOUND_404;
  },

  async updateCommentById(
    user: Omit<UserViewModel, "createdAt">,
    commentId: string,
    input: CommentInputModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    // console.log("updateCommentById");
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | undefined;
    const { error, value: validComment } = commentSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    const mongoComment = isValidMongoId(commentId)
      ? await getCommentsRepository.findCommentById(commentId)
      : null;
    const viewComment = mongoComment
      ? mapMongoToViewComment(mongoComment)
      : null;
    if (!viewComment) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else if (user.id !== viewComment.commentatorInfo.userId) {
      responseCode = HTTP_CODES.FORBIDDEN_403;
    } else if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
    } else {
      await getCommentsRepository.updateCommentById(commentId, validComment);
      responseCode = HTTP_CODES.NO_CONTENT_204;
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async deleteCommentById(
    user: Omit<UserViewModel, "createdAt">,
    commentId: string
  ): Promise<HttpStatusType> {
    // console.log("deleteCommentById");
    let responseCode: HttpStatusType;
    const mongoComment = isValidMongoId(commentId)
      ? await getCommentsRepository.findCommentById(commentId)
      : null;
    const viewComment = mongoComment
      ? mapMongoToViewComment(mongoComment)
      : null;
    if (!viewComment) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else if (user.id !== viewComment.commentatorInfo.userId) {
      responseCode = HTTP_CODES.FORBIDDEN_403;
    } else {
      await getCommentsRepository.deleteCommentById(commentId);
      responseCode = HTTP_CODES.NO_CONTENT_204;
    }
    return responseCode;
  },
};
