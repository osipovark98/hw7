import request from "supertest";

import { app } from "../../src/app";
import { routersPaths } from "../../src/utils/routersPaths";
import { HTTP_CODES } from "../../src/utils/httpResponsesCodes";
import { BlogInputModel } from "../../src/resources/blogs/models/BlogInputModel";
import { blogsTestManager } from "../utils/blogsTestManager";

const correctInputData = {
  name: "Arthas",
  description:
    "gaming and lifestyle blog of Vitalii Tsal' - a Ukrainian streamer from Vinnytsia",
  websiteUrl: "https://www.youtube.com/SpitefulDick",
};

describe(routersPaths.blogs, () => {
  beforeAll(async () => {
    await request(app).delete(`${routersPaths.testing}/all-data`);
  });

  it("'ht_2/api/blogs' READ:\nmust return response object for which response.statusCode is 200(ok) and response.body is an empty array", async () => {
    const readAllBlogsResponse = await blogsTestManager.readAllBlogs();
    const responseStatusCode = readAllBlogsResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.OK_200);
    const allBlogsArray = readAllBlogsResponse.body;
    expect(allBlogsArray).toEqual([]);
  });

  it("'ht_2/api/blogs' CREATE:\nmust return response object fore which response.statusCode is 401(unauthorized) when 'authorization' header was not set on sent request", async () => {
    const createBlogResponse = await blogsTestManager.createBlog(
      correctInputData
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.UNAUTHORIZED_401);
  });

  it("'ht_2/api/blogs' CREATE:\nmust return response object for which response.statusCode is 401(unauthorized) when 'authorization' header set on request object contains incorrect username or password", async () => {
    const createBlogResponse = await blogsTestManager.createBlog(
      correctInputData,
      "Bearer dXNlcjphYnVzZXI="
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.UNAUTHORIZED_401);
  });

  it("'ht_2/api/blogs' CREATE:\nmust return response object for which response.statusCode is 400(bad request) when an attempt to create blog with incorrect input data is made", async () => {
    const blogInputData: BlogInputModel = {
      ...correctInputData,
      websiteUrl: "www.youtube.com/SpitefulDick",
    };

    const createBlogResponse = await blogsTestManager.createBlog(
      blogInputData,
      "Bearer YWRtaW46cXdlcnR5"
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.BAD_REQUEST_400);
  });

  let createdBlog1: any = null;

  it("'ht_2/api/blogs' CREATE:\nmust return response object for which response.statusCode is 201(created) when an attempt to create blog with correct input data is made", async () => {
    const createBlogResponse = await blogsTestManager.createBlog(
      correctInputData,
      "Bearer YWRtaW46cXdlcnR5"
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.CREATED_201);

    createdBlog1 = createBlogResponse.body;

    expect(createdBlog1).toEqual({
      id: expect.any(String),
      ...correctInputData,
    });

    const readAllBlogsResponse = await blogsTestManager.readAllBlogs();

    const allBlogsArray = readAllBlogsResponse.body;

    expect(allBlogsArray).toEqual([createdBlog1]);
  });

  let createdBlog2: any = null;

  it("'ht_2/api/blogs' CREATE:\nmust return response object for which response.statusCode is 201(created) when an attempt to create blog with correct input data is made", async () => {
    const correctSubstituteData = {
      websiteUrl: "https://www.instagram.com/arthaslav",
    };
    const createBlogResponse = await blogsTestManager.createBlog(
      {
        ...correctInputData,
        ...correctSubstituteData,
      },
      "Bearer YWRtaW46cXdlcnR5"
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.CREATED_201);

    createdBlog2 = createBlogResponse.body;

    expect(createdBlog2).toEqual({
      id: expect.any(String),
      ...correctInputData,
      ...correctSubstituteData,
    });

    const readAllBlogsResponse = await blogsTestManager.readAllBlogs();

    const allBlogsArray = readAllBlogsResponse.body;

    expect(allBlogsArray).toEqual([createdBlog1, createdBlog2]);
  });

  let createdBlog3: any = null;

  it("'ht_2/api/blogs' CREATE:\nmust return response object for which response.statusCode is 201(created) when an attempt to create blog with correct input data is made", async () => {
    const correctSubstituteData = {
      websiteUrl: "https://www.instagram.com/arthaslav",
    };
    const createBlogResponse = await blogsTestManager.createBlog(
      {
        ...correctInputData,
        ...correctSubstituteData,
      },
      "Bearer YWRtaW46cXdlcnR5"
    );

    const responseStatusCode = createBlogResponse.statusCode;

    expect(responseStatusCode).toEqual(HTTP_CODES.CREATED_201);

    createdBlog3 = createBlogResponse.body;

    expect(createdBlog3).toEqual({
      id: expect.any(String),
      ...correctInputData,
      ...correctSubstituteData,
    });

    const readAllBlogsResponse = await blogsTestManager.readAllBlogs();

    const allBlogsArray = readAllBlogsResponse.body;

    expect(allBlogsArray).toEqual([createdBlog1, createdBlog2, createdBlog3]);
  });

  it("'ht_2/api/blogs/:id' READ:\nmust return response object for which response.statusCode is 404(not found) when an attempt to read blog by id for which there is no blog with the same id in the database is made", async () => {
    const readBlogByIdResponse = await blogsTestManager.readBlogById("-1");
    const responseStatusCode = readBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.NOT_FOUND_404);
  });

  it("'ht_2/api/blogs/:id' READ:\nmust return response object for which response.statusCode is 200(ok) and response.body contains an object of BlogViewModel type when an attempt to read blog by id for which there is a blog with the same id in the database is made", async () => {
    const readBlogByIdResponse = await blogsTestManager.readBlogById("1");
    const responseStatusCode = readBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.OK_200);
    const responseBody = readBlogByIdResponse.body;
    expect(responseBody).toEqual(createdBlog2);
  });

  it("'ht_2/api/blogs/:id' UPDATE:\nmust return response object for which response.statusCode is 401(unauthorized) when 'authorization' header was not set on sent request", async () => {
    const updateBlogByIdResponse = await blogsTestManager.updateBlogById("1", {
      ...correctInputData,
      name: "Papich",
    });
    const responseStatusCode = updateBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.UNAUTHORIZED_401);
  });

  it("'ht_2/api/blogs/:id' UPDATE:\nmust return response object for which response.statusCode is 404(not found) when an attempt to update blog by id for which there is no blog with the same id in the database is made", async () => {
    const updateBlogByIdResponse = await blogsTestManager.updateBlogById(
      "-1",
      {
        ...correctInputData,
        name: "Papich",
      },
      "Bearer YWRtaW46cXdlcnR5"
    );
    const responseStatusCode = updateBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.NOT_FOUND_404);
  });

  it("'ht_2/api/blogs/:id' UPDATE:\nmust return response object for which response.statusCode is 400(bad request) when an attempt to update blog with incorrect input data is made", async () => {
    const updateBlogByIdResponse = await blogsTestManager.updateBlogById(
      "1",
      { ...correctInputData, name: "intentionally long name" },
      "Bearer YWRtaW46cXdlcnR5"
    );
    const responseStatusCode = updateBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.BAD_REQUEST_400);
  });

  it("'ht_2/api/blogs/:id' UPDATE:\nmust return response object for which response.statusCode is 204(no content) when an attempt to update blog with correct input data is made", async () => {
    const updateBlogByIdResponse = await blogsTestManager.updateBlogById(
      "1",
      { ...correctInputData, name: "Papich" },
      "Bearer YWRtaW46cXdlcnR5"
    );
    const responseStatusCode = updateBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.NO_CONTENT_204);
  });

  it("'ht_2/api/blogs/:id' DELETE:\nmust return response object for which response.statusCode is 401(unauthorized) when 'authorization' header was not set on sent request", async () => {
    const deleteBlogByIdResponse = await blogsTestManager.deleteBlogById("2");
    const responseStatusCode = deleteBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.UNAUTHORIZED_401);
  });

  it("'ht_2/api/blogs/:id' DELETE:\nmust return response object for which response.statusCode is 404(not found) when an attempt to delete blog by id for which there is no blog with the same id in the database is made", async () => {
    const deleteBlogByIdResponse = await blogsTestManager.deleteBlogById(
      "-1",
      "Bearer YWRtaW46cXdlcnR5"
    );
    const responseStatusCode = deleteBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.NOT_FOUND_404);
  });

  it("'ht_2/api/blogs/:id' DELETE:\nmust return response object for which response.statusCode is 204(no content) when an attempt to delete blog by id for which there is blog with the same id in the database and when 'authorization' header was set to the correct username and password pair is made", async () => {
    const deleteBlogByIdResponse = await blogsTestManager.deleteBlogById(
      "2",
      "Bearer YWRtaW46cXdlcnR5"
    );
    const responseStatusCode = deleteBlogByIdResponse.statusCode;
    expect(responseStatusCode).toEqual(HTTP_CODES.NO_CONTENT_204);

    const readAllBlogsResponse = await blogsTestManager.readAllBlogs();
    const allBlogsArray = readAllBlogsResponse.body;
    expect(allBlogsArray).toEqual([createdBlog1, createdBlog2]);
  });
});
