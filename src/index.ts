import dotenv from "dotenv";
dotenv.config();

import express from "express";

import { authenticate } from "./middleware";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(authenticate);

app.use("/api", routes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("server is running on port:", PORT);
});
