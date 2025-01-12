import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import request from "supertest";

import videoRouter from "../../routes/videos";
import { prismaMock } from "../../test/prisma-singleton";
import { mergeVideos, trimVideo } from "../../services";

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
jest.mock("path");
jest.mock("../../services", () => ({
  trimVideo: jest.fn(),
  mergeVideos: jest.fn(),
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

describe("Video Trim Route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if videoId is missing", async () => {
    const response = await request(app).post("/videos/trim").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "video ID and one of the start or end time required"
    );
  });

  it("should return 400 if both start and end are missing", async () => {
    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "video ID and one of the start or end time required"
    );
  });

  it("should return 404 if video is not found", async () => {
    prismaMock.videos.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 0 });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("video not found");
  });

  it("should return 400 if start or end are out of bounds", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: "1",
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
      created_at: new Date(),
    });

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 130 });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "start and end time should be in original video duration limits"
    );
  });

  it("should return 404 if video file does not exist", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: "1",
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
      created_at: new Date(),
    });

    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 0 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("video file not found in store");
  });

  it("should return 500 if storage folder creation fails", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: "1",
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
      created_at: new Date(),
    });

    jest.spyOn(fs, "existsSync").mockImplementation((path) => {
      if (path === "video_store/") return false;
      return true;
    });
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => {
      throw new Error("Failed to create directory");
    });

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 0 });
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("server error while creating storage");
  });

  it("should return 500 if trimming process fails", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: "1",
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
      created_at: new Date(),
    });

    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    (trimVideo as jest.Mock).mockRejectedValue(new Error("Trimming error"));

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 0 });
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("error trimming video");
  });

  it("should trim video successfully", async () => {
    const mockVideo = {
      id: "1",
      name: "test.mp4",
      size: 1024,
      duration: 120,
      path: "video_store/test.mp4",
      created_at: new Date(),
    };

    prismaMock.videos.findUnique.mockResolvedValue(mockVideo);
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "statSync").mockReturnValue({
      size: BigInt(512),
    } as unknown as fs.Stats);
    (trimVideo as jest.Mock).mockRejectedValue(new Error("Trimming error"));
    (trimVideo as jest.Mock).mockResolvedValue(null);

    prismaMock.videos.create.mockResolvedValue({
      id: "2",
      name: "trimmed-test.mp4",
      size: 512,
      duration: 60,
      path: "video_store/trimmed-test.mp4",
      created_at: new Date(),
    });

    const response = await request(app)
      .post("/videos/trim")
      .send({ videoId: "1", start: 0, end: 60 });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("video trimmed successfully");
    expect(response.body.video).toEqual(
      expect.objectContaining({
        name: "trimmed-test.mp4",
        size: 512,
        duration: 60,
        path: "video_store/trimmed-test.mp4",
      })
    );
  });
});

describe("Videos Merge Route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if videoIds is missing", async () => {
    const response = await request(app).post("/videos/merge").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "at least two video IDs are required to merge videos"
    );
  });

  it("should return 400 if videoIds is not an array", async () => {
    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: "invalid" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "at least two video IDs are required to merge videos"
    );
  });

  it("should return 404 if one or more video IDs do not exist", async () => {
    prismaMock.videos.findMany.mockResolvedValue([]);
    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: ["1", "2"] });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("one or more video IDs do not exist");
  });

  it("should return 404 if one or more video files are missing", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      {
        id: "1",
        path: "video_store/1.mp4",
        name: "1.mp4",
        duration: 100,
        created_at: new Date(),
        size: 10,
      },
      {
        id: "2",
        path: "video_store/2.mp4",
        name: "2.mp4",
        duration: 120,
        created_at: new Date(),
        size: 10,
      },
    ]);

    jest
      .spyOn(fs, "existsSync")
      .mockImplementation((path) => path !== "video_store/2.mp4");

    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: ["1", "2"] });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "one or more video files are missing from the store"
    );
  });

  it("should return 500 if storage folder creation fails", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      {
        id: "1",
        path: "video_store/1.mp4",
        name: "1.mp4",
        duration: 100,
        created_at: new Date(),
        size: 10,
      },
      {
        id: "2",
        path: "video_store/2.mp4",
        name: "2.mp4",
        duration: 120,
        created_at: new Date(),
        size: 10,
      },
    ]);
    jest.spyOn(fs, "existsSync").mockImplementation((path) => {
      if (path === "video_store/") return false;
      return true;
    });
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => {
      throw new Error("Failed to create directory");
    });

    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: ["1", "2"] });
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("server error while creating storage");
  });

  it("should return 500 if merging process fails", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      {
        id: "1",
        path: "video_store/1.mp4",
        name: "1.mp4",
        duration: 100,
        created_at: new Date(),
        size: 10,
      },
      {
        id: "2",
        path: "video_store/2.mp4",
        name: "2.mp4",
        duration: 120,
        created_at: new Date(),
        size: 10,
      },
    ]);
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    (mergeVideos as jest.Mock).mockRejectedValue(new Error("Merging error"));

    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: ["1", "2"] });
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("error merging videos");
  });

  it("should merge videos successfully", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      {
        id: "1",
        path: "video_store/1.mp4",
        name: "1.mp4",
        duration: 100,
        created_at: new Date(),
        size: 10,
      },
      {
        id: "2",
        path: "video_store/2.mp4",
        name: "2.mp4",
        duration: 120,
        created_at: new Date(),
        size: 10,
      },
    ]);
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    (mergeVideos as jest.Mock).mockResolvedValue(null);
    jest.spyOn(fs, "statSync").mockReturnValue({
      size: BigInt(512),
    } as unknown as fs.Stats);
    prismaMock.videos.create.mockResolvedValue({
      id: "3",
      name: "merged.mp4",
      size: 512,
      duration: 220,
      path: "video_store/merged.mp4",
      created_at: new Date(),
    });

    const response = await request(app)
      .post("/videos/merge")
      .send({ videoIds: ["1", "2"] });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("video trimmed successfully");
    expect(response.body.video).toEqual(
      expect.objectContaining({
        name: "merged.mp4",
        size: 512,
        duration: 220,
      })
    );
  });
});
