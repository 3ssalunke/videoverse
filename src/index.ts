require("dotenv").config();
import express from "express";
import { authenticate } from "./middleware";

const app = express();

app.use(express.json());
app.use(authenticate);

app.get("/", (req, res) => {
  res.send("Video api");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("server is running on port:", PORT);
});
