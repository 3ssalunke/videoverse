import { Request, Response } from "express";

describe("validateVideoUpload middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should call next if the video upload is valid", async () => {
    jest.mock("fluent-ffmpeg", () => {
      const mockFfprobe = jest.fn((_, callback) => {
        callback(null, { format: { duration: 15 } });
      });
      return {
        ffprobe: mockFfprobe,
      };
    });

    jest.mock("multer", () => {
      const multer: any = jest.fn(() => ({
        single: jest.fn(() => (req: any, res: any, callback: Function) => {
          req.file = {
            path: "./video.mp4",
            originalname: "video.mp4",
          };
          callback(null);
        }),
      }));

      multer.diskStorage = jest.fn(() => ({
        _handleFile: jest.fn(),
        _removeFile: jest.fn(),
      }));

      return multer;
    });

    const { validateVideoUpload } = require("../validate-video-upload");
    validateVideoUpload(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toHaveProperty("video");
    expect(req.body.video.originalname).toBe("video.mp4");
    expect(req.body).toHaveProperty("duration", 15);
  });

  it("should return a 400 error if no file is uploaded", async () => {
    jest.mock("fluent-ffmpeg", () => {
      const mockFfprobe = jest.fn((_, callback) => {
        callback(null, { format: { duration: 15 } });
      });
      return {
        ffprobe: mockFfprobe,
      };
    });

    jest.mock("multer", () => {
      const multer: any = jest.fn(() => ({
        single: jest.fn(() => (req: any, res: any, callback: Function) => {
          callback(null);
        }),
      }));

      multer.diskStorage = jest.fn(() => ({
        _handleFile: jest.fn(),
        _removeFile: jest.fn(),
      }));

      return multer;
    });

    const { validateVideoUpload } = require("../validate-video-upload");
    validateVideoUpload(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "no video file uploaded",
    });
  });

  it("should return a 400 error if video file duration exceeds allowed limit", async () => {
    jest.mock("fluent-ffmpeg", () => {
      const mockFfprobe = jest.fn((_, callback) => {
        callback(null, { format: { duration: 30 } });
      });
      return {
        ffprobe: mockFfprobe,
      };
    });

    jest.mock("multer", () => {
      const multer: any = jest.fn(() => ({
        single: jest.fn(() => (req: any, res: any, callback: Function) => {
          req.file = {
            path: "./video.mp4",
            originalname: "video.mp4",
          };
          callback(null);
        }),
      }));

      multer.diskStorage = jest.fn(() => ({
        _handleFile: jest.fn(),
        _removeFile: jest.fn(),
      }));

      return multer;
    });

    const { validateVideoUpload } = require("../validate-video-upload");
    validateVideoUpload(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "video duration must be between 5 and 25 seconds",
    });
  });
});
