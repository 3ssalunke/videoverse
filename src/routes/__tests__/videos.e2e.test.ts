import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import request from "supertest";

import prisma from "../../prisma-client";
import videoRouter from "../../routes/videos";

const app = express();
app.use(express.json());
app.use("/videos", videoRouter);

describe("E2E: Video Upload Route", () => {
  beforeAll(async () => {
    if (!fs.existsSync("video_store")) {
      fs.mkdirSync("video_store");
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (fs.existsSync("video_store")) {
      fs.rmSync("video_store", { recursive: true });
    }
  });

  it("should upload a video successfully", async () => {
    const videoPath = path.resolve(__dirname, "./test.mp4");
    const response = await request(app)
      .post("/videos")
      .attach("video", videoPath);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "video uploaded successfully"
    );
  });

  it("should handle upload errors gracefully", async () => {
    const response = await request(app).post("/videos").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "no video file uploaded");
  });
});
