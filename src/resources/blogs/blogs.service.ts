import Joi from "joi";

import { getBlogsRepository } from "./blogs.repository";

import { BlogInputModel } from "./models/BlogInputModel";
import { BlogQueryModel } from "./models/BlogQueryModel";
import { BlogViewModel } from "./models/BlogViewModel";

import { HTTP_CODES, HttpStatusType } from "../../utils/httpResponsesCodes";
import {
  transformJoiError,
  mapMongoToViewBlog,
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

const blogSchema = Joi.object({
  name: Joi.string().trim().max(15).required().messages({
    "any.required": "name is required",
    "string.base": "name must be a string",
    "string.max": "name can't be longer than 15 characters",
    "string.empty": "empty string can't be used as a name",
  }),
  description: Joi.string().trim().max(500).required().messages({
    "any.required": "description is required",
    "string.base": "description must be a string",
    "string.max": "description can't be longer than 500 characters",
    "string.empty": "empty string can't be used as a description",
  }),
  websiteUrl: Joi.string()
    .trim()
    .max(100)
    .pattern(
      new RegExp(
        "^https://([a-zA-Z0-9_-]+.)+[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*/?$"
      )
    )
    .required()
    .messages({
      "any.required": "websiteUrl is required",
      "string.base": "websiteUrl must be a string",
      "string.max": "websiteUrl can't be longer than 100 characters",
      "string.empty": "empty string can't be used as a websiteUrl",
      "string.pattern.base": "incorrect url",
    }),
});

const validateBlogSortBy = validateSortBy([
  "id",
  "name",
  "description",
  "websiteUrl",
  "isMembership",
  "createdAt",
]);

const blogQuerySchema = Joi.object({
  pageNumber: Joi.custom(validatePageNumber).default(1),
  pageSize: Joi.custom(validatePageSize).default(10),
  searchNameTerm: Joi.string().default(""),
  sortBy: Joi.custom(validateBlogSortBy).default("createdAt"),
  sortDirection: Joi.custom(validateSortDirection).default("desc"),
});

export const getBlogsService = {
  async readBlogs(
    query: BlogQueryModel
  ): Promise<[HttpStatusType, Paginator<BlogViewModel>]> {
    const validQuery: BlogQueryModel = blogQuerySchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    }).value;
    const blogCount = await getBlogsRepository.countBlogs(
      validQuery.searchNameTerm
    );
    const mongoBlogs = await getBlogsRepository.findBlogs(validQuery);
    const viewBlogs: BlogViewModel[] = mongoBlogs.map(mapMongoToViewBlog);
    const responseObject: Paginator<BlogViewModel> = makePaginator<
      BlogQueryModel,
      BlogViewModel
    >(validQuery, blogCount, viewBlogs);
    return [HTTP_CODES.OK_200, responseObject];
  },

  async createBlog(
    input: BlogInputModel
  ): Promise<[HttpStatusType, BlogViewModel | APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: BlogViewModel | APIErrorResult;
    const { error, value: validInputBlog } = blogSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
    } else {
      responseCode = HTTP_CODES.CREATED_201;
      const newBlog: Omit<BlogViewModel, "id"> = {
        ...validInputBlog,
        createdAt: new Date().toISOString(),
        isMembership: false,
      };
      const insertBlogResult = await getBlogsRepository.insertBlog(newBlog);
      responseObject = mapMongoToViewBlog({
        _id: insertBlogResult.insertedId,
        ...newBlog,
      });
    }

    return [responseCode, responseObject];
  },

  async readBlogById(
    id: string
  ): Promise<HttpStatusType | [HttpStatusType, BlogViewModel]> {
    const mongoBlog = isValidMongoId(id)
      ? await getBlogsRepository.findBlogById(id)
      : null;
    const viewBlog = mongoBlog ? mapMongoToViewBlog(mongoBlog) : null;
    return viewBlog ? [HTTP_CODES.OK_200, viewBlog] : HTTP_CODES.NOT_FOUND_404;
  },

  async updateBlogById(
    id: string,
    input: BlogInputModel
  ): Promise<HttpStatusType | [HttpStatusType, APIErrorResult]> {
    let responseCode: HttpStatusType;
    let responseObject: APIErrorResult | undefined;
    const { error, value: validInputBlog } = blogSchema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    let updateBlogResult;
    if (error) {
      responseCode = HTTP_CODES.BAD_REQUEST_400;
      responseObject = transformJoiError(error);
      return [responseCode, responseObject];
    }
    updateBlogResult = isValidMongoId(id)
      ? await getBlogsRepository.updateBlogById(id, validInputBlog)
      : null;
    if (!updateBlogResult || updateBlogResult.matchedCount === 0) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else {
      responseCode = HTTP_CODES.NO_CONTENT_204;
    }
    return responseObject ? [responseCode, responseObject] : responseCode;
  },

  async deleteBlogById(id: string): Promise<HttpStatusType> {
    let responseCode: HttpStatusType;
    const deleteBlogResult = isValidMongoId(id)
      ? await getBlogsRepository.deleteBlogById(id)
      : null;
    if (deleteBlogResult === null || deleteBlogResult.deletedCount === 0) {
      responseCode = HTTP_CODES.NOT_FOUND_404;
    } else {
      responseCode = HTTP_CODES.NO_CONTENT_204;
    }
    return responseCode;
  },
};

//.CHECKED
