import { app } from "./app";
import { runDB } from "./db/db";

const port = 3003;

const startApp = async () => {
  await runDB();
  app.listen(port, () => {
    console.log(`The application is running on port: ${port}`);
  });
};

startApp();
