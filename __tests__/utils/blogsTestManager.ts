import request from "supertest";

import { app } from "../../src/app";
import { routersPaths } from "../../src/utils/routersPaths";
import { HTTP_CODES, HttpStatusType } from "../../src/utils/httpResponsesCodes";
import { BlogInputModel } from "../../src/resources/blogs/models/BlogInputModel";

export const blogsTestManager = {
  async readAllBlogs() {
    const response = await request(app).get(routersPaths.blogs);
    return response;
  },

  async createBlog(
    blogInputObject: BlogInputModel,
    authorizationString: string | undefined = undefined
  ) {
    let response;
    if (authorizationString === undefined) {
      response = await request(app)
        .post(routersPaths.blogs)
        .send(blogInputObject);
    } else {
      response = await request(app)
        .post(routersPaths.blogs)
        .set("Authorization", authorizationString)
        .send(blogInputObject);
    }
    return response;
  },

  async readBlogById(id: string) {
    const response = await request(app).get(`${routersPaths.blogs}/${id}`);
    return response;
  },

  async updateBlogById(
    id: string,
    blogInputObject: BlogInputModel,
    authorizationString: string | undefined = undefined
  ) {
    let response;
    if (authorizationString === undefined) {
      response = await request(app)
        .put(`${routersPaths.blogs}/${id}`)
        .send(blogInputObject);
    } else {
      response = await request(app)
        .put(`${routersPaths.blogs}/${id}`)
        .set("Authorization", authorizationString)
        .send(blogInputObject);
    }
    return response;
  },

  async deleteBlogById(
    id: string,
    authorizationString: string | undefined = undefined
  ) {
    let response;
    if (authorizationString === undefined) {
      response = await request(app).delete(`${routersPaths.blogs}/${id}`);
    } else {
      response = await request(app)
        .delete(`${routersPaths.blogs}/${id}`)
        .set("Authorization", authorizationString);
    }
    return response;
  },
};
