import request from "supertest";
import express from "express";

import videoRouter from "../../routes/videos";
import { prismaMock } from "../../test/prisma-singleton";

jest.mock("../../middleware", () => ({
  validateVideoUpload: jest.fn((req: any, _: any, next: any) => {
    req.body.video = {
      filename: "test.mp4",
      size: 1024,
      path: "video_store/test.mp4",
    };
    req.body.duration = 120;
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/videos", videoRouter);

describe("Video Upload Route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should upload video successfully", async () => {
    const mockVideo = {
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
    };

    prismaMock.videos.create.mockResolvedValue({
      id: "1",
      name: mockVideo.name,
      size: mockVideo.size,
      duration: mockVideo.duration,
      path: mockVideo.path,
      created_at: new Date(),
    });

    const response = await request(app).post("/videos").send({});

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "video uploaded successfully",
      video: expect.objectContaining({
        name: mockVideo.name,
        size: mockVideo.size,
        duration: mockVideo.duration,
        path: mockVideo.path,
      }),
    });
    expect(prismaMock.videos.create).toHaveBeenCalledWith({
      data: mockVideo,
    });
  });

  it("should handle server error while saving video", async () => {
    prismaMock.videos.create.mockRejectedValue(new Error("Database error"));

    const response = await request(app).post("/videos").send({});

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "server error while saving video",
    });
    expect(prismaMock.videos.create).toHaveBeenCalled();
  });
});
