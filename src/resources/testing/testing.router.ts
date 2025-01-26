import { Router } from "express";

import { client } from "../../db/db";
import { HTTP_CODES } from "../../utils/httpResponsesCodes";

export const testingRouter = Router();

testingRouter.delete("/all-data", async (req, res) => {
  const collectionsList = await client
    .db("homework")
    .listCollections()
    .toArray();
  for (const { name } of collectionsList) {
    client.db("homework").collection(name).deleteMany({});
  }
  res.sendStatus(HTTP_CODES.NO_CONTENT_204);
});
