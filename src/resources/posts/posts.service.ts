import Joi from "joi";

import { getPostsRepository } from "./posts.repository";
import { getBlogsRepository } from "../blogs/blogs.repository";

import { PostInputModel } from "./models/PostInputModel";
import { PostQueryModel } from "./models/PostQueryModel";
import { PostViewModel } from "./models/PostViewModel";

import { HTTP_CODES, HttpStatusType } from "../../utils/httpResponsesCodes";
import {
  transformJoiError,
  mapMongoToViewPost,
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

const postSchema = Joi.object({
  title: Joi.string().trim().max(30).required().messages({
    "any.required": "title is required",
    "string.base": "title must be a string",
    "string.max": "title can't be longer than 30 characters",
    "string.empty": "empty string can't be used as a title",
  }),
  shortDescription: Joi.string().trim().max(100).required().messages({
    "any.required": "shortDescription is required",
    "string.base": "shortDescription must be a string",
    "string.max": "shortDescription can't be longer than 100 characters",
    "string.empty": "empty string can't be used as a shortDescription",
  }),
  content: Joi.string().trim().max(1000).required().messages({
    "any.required": "content is required",
    "string.base": "content must be a string",
    "string.max": "content can't be longer than 1000 characters",
    "string.empty": "empty string can't be used as a content",
  }),
  blogId: Joi.string().trim().required().messages({
    "any.required": "blogId is required",
    "string.base": "blogId must be a string",
    "string.empty": "empty string can't be used as a blogId",
  }),
});

const validatePostSortBy = validateSortBy([
  "id",
  "title",
  "shortDescription",
  "content",
  "blogName",
  "createdAt",
]);

const postQuerySchema = Joi.object({
  pageNumber: Joi.custom(validatePageNumber).default(1),
  pageSize: Joi.custom(validatePageSize).default(10),
  sortBy: Joi.custom(validatePostSortBy).default("createdAt"),
  sortDirection: Joi.custom(validateSortDirection).default("desc"),
});

export const getPostsService = {
  async readPosts(
    query: PostQueryModel
  ): Promise<[HttpStatusType, Paginator<PostViewModel>]> {
    const validQuery: PostQueryModel = postQuerySchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    }).value;
    const postsCount = await getPostsRepository.countAllPosts();
    const mongoPosts = await getPostsRepository.findPosts(validQuery);
    const viewPosts = mongoPosts.map(mapMongoToViewPost);
    const responseObject = makePaginator(validQuery, postsCount, viewPosts);
    return [HTTP_CODES.OK_200, responseObject];
  },

  async createPost(
    input: PostInputModel
  ): Promise<[HttpStatusType, PostViewModel | APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: PostViewModel | APIErrorResult;
    const { error, value: validInputPost } = postSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    const blogWithGivenId = await getBlogsRepository.findBlogById(input.blogId);
    if (error || !blogWithGivenId) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      const validationErrorsMessages = error
        ? transformJoiError(error).errorsMessages
        : [];
      const blogNonExistentErrorsMessages = !blogWithGivenId
        ? [
            {
              message:
                "there is no blog with an id value of blogId in the database",
              field: "blogId",
            },
          ]
        : [];
      responseObject = {
        errorsMessages: [
          ...validationErrorsMessages,
          ...blogNonExistentErrorsMessages,
        ],
      };
    } else {
      responseCode = HTTP_CODES.CREATED_201;
      const newPost: Omit<PostViewModel, "id"> = {
        blogName: blogWithGivenId.name,
        ...validInputPost,
        createdAt: new Date().toISOString(),
      };
      const insertResult = await getPostsRepository.insertPost(newPost);
      responseObject = mapMongoToViewPost({
        ...newPost,
        _id: insertResult.insertedId,
      });
    }

    return [responseCode, responseObject];
  },

  //? placement of this method
  async readPostsOfBlog(
    id: string,
    query: PostQueryModel
  ): Promise<HttpStatusType | [HttpStatusType, Paginator<PostViewModel>]> {
    let responseCode: HttpStatusType;
    let responseObject: Paginator<PostViewModel> | undefined;
    const mongoBlog = isValidMongoId(id)
      ? await getBlogsRepository.findBlogById(id)
      : null;
    if (!mongoBlog) responseCode = HTTP_CODES.NOT_FOUND_404;
    else {
      const validQuery: PostQueryModel = postQuerySchema.validate(query, {
        abortEarly: false,
        stripUnknown: true,
      }).value;
      const postsCount = await getPostsRepository.countPostsByBlogId(id);
      const mongoPostsOfBlog = await getPostsRepository.findPostsByBlogId(
        id,
        validQuery
      );
      const viewPostsOfBlog: PostViewModel[] =
        mongoPostsOfBlog.map(mapMongoToViewPost);
      const postsPaginator = makePaginator(
        validQuery,
        postsCount,
        viewPostsOfBlog
      );
      [responseCode, responseObject] = [HTTP_CODES.OK_200, postsPaginator];
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async createPostOfBlog(
    input: PostInputModel
  ): Promise<
    HttpStatusType | [HttpStatusType, PostViewModel | APIErrorResult]
  > {
    let responseCode: HttpStatusType;
    let responseObject: PostViewModel | APIErrorResult | undefined;
    const blogWithGivenId = await getBlogsRepository.findBlogById(input.blogId);
    const { error, value: validInputPost } = postSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (!blogWithGivenId) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
    } else {
      responseCode = HTTP_CODES.CREATED_201;
      const newPost: Omit<PostViewModel, "id"> = {
        blogName: blogWithGivenId.name,
        ...validInputPost,
        createdAt: new Date().toISOString(),
      };
      const insertResult = await getPostsRepository.insertPost(newPost);
      responseObject = mapMongoToViewPost({
        ...newPost,
        _id: insertResult.insertedId,
      });
    }

    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async readPostById(
    id: string
  ): Promise<HttpStatusType | [HttpStatusType, PostViewModel]> {
    const mongoPost = await getPostsRepository.findPostById(id);
    const viewPost = mongoPost ? mapMongoToViewPost(mongoPost) : null;
    return viewPost ? [HTTP_CODES.OK_200, viewPost] : HTTP_CODES.NOT_FOUND_404;
  },

  async updatePostById(
    id: string,
    input: PostInputModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | undefined;
    const { error, value: validInputPost } = postSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    const blogWithInputId = await getBlogsRepository.findBlogById(input.blogId);
    if (error || !blogWithInputId) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      const validationErrorsMessages = error
        ? transformJoiError(error).errorsMessages
        : [];
      const blogNonExistentErrorsMessages = !blogWithInputId
        ? [
            {
              message:
                "there is no blog with an id value of blogId in the database",
              field: "blogId",
            },
          ]
        : [];
      responseObject = {
        errorsMessages: [
          ...validationErrorsMessages,
          ...blogNonExistentErrorsMessages,
        ],
      };
    } else {
      const updatePostResult = await getPostsRepository.updatePostById(id, {
        blogName: blogWithInputId.name,
        ...validInputPost,
      });
      responseCode =
        updatePostResult.modifiedCount === 1
          ? HTTP_CODES.NO_CONTENT_204
          : HTTP_CODES.NOT_FOUND_404;
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async deletePostById(id: string): Promise<HttpStatusType> {
    let responseCode: HttpStatusType;
    const deletePostResult = isValidMongoId(id)
      ? await getPostsRepository.deletePostById(id)
      : null;
    if (deletePostResult === null || deletePostResult.deletedCount === 0) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else {
      responseCode = HTTP_CODES.NO_CONTENT_204;
    }
    return responseCode;
  },
};

//.CHECKED
