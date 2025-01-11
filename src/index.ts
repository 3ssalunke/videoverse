require("dotenv").config();
import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Video api");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("server is running on port:", PORT);
});
