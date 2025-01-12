import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

import { trimVideo, mergeVideos } from "../videos";

jest.mock("fluent-ffmpeg", () => {
  const mockCommand = {
    setStartTime: jest.fn().mockReturnThis(),
    setDuration: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
    output: jest.fn().mockReturnThis(),
    input: jest.fn().mockReturnThis(),
    inputOptions: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
  };
  const ffmpegMock: any = jest.fn(() => mockCommand);
  ffmpegMock.setFfmpegPath = jest.fn();
  return ffmpegMock;
});

jest.mock("fs");

describe("Video Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trimVideo", () => {
    it("should resolve when the trimming is successful", async () => {
      const mockCommand = (ffmpeg as unknown as jest.Mock)();
      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "end") callback();
        return mockCommand;
      });

      await expect(
        trimVideo("input.mp4", "output.mp4", 5, 10, 20)
      ).resolves.toBeUndefined();

      expect(ffmpeg).toHaveBeenCalledWith("input.mp4");
      expect(mockCommand.output).toHaveBeenCalledWith("output.mp4");
      expect(mockCommand.setStartTime).toHaveBeenCalledWith(5);
      expect(mockCommand.setDuration).toHaveBeenCalledWith(5);
      expect(mockCommand.run).toHaveBeenCalled();
    });

    it("should reject if there is an error during trimming", async () => {
      const mockCommand = (ffmpeg as unknown as jest.Mock)();
      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "error") callback(new Error("Trimming error"));
        return mockCommand;
      });

      await expect(
        trimVideo("input.mp4", "output.mp4", 5, 10, 20)
      ).rejects.toThrow("Trimming error");

      expect(ffmpeg).toHaveBeenCalledWith("input.mp4");
      expect(mockCommand.run).toHaveBeenCalled();
    });
  });

  describe("mergeVideos", () => {
    it("should resolve when the merging is successful", async () => {
      const mockCommand = (ffmpeg as unknown as jest.Mock)();
      const tmpFilePath =
        "C:\\Suraj\\Educational\\videoverse\\src\\services\\tmp_video_list.txt";

      jest.spyOn(fs, "writeFileSync").mockImplementation();
      jest.spyOn(fs, "unlinkSync").mockImplementation();
      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "end") callback();
        return mockCommand;
      });

      await expect(
        mergeVideos(["video1.mp4", "video2.mp4"], "output.mp4")
      ).resolves.toBeUndefined();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        tmpFilePath,
        "file 'C:/Suraj/Educational/videoverse/video1.mp4'\nfile 'C:/Suraj/Educational/videoverse/video2.mp4'"
      );
      expect(ffmpeg).toHaveBeenCalled();
      expect(mockCommand.input).toHaveBeenCalledWith(tmpFilePath);
      expect(mockCommand.output).toHaveBeenCalledWith("output.mp4");
      expect(fs.unlinkSync).toHaveBeenCalledWith(tmpFilePath);
    });

    it("should reject if there is an error during merging", async () => {
      const mockCommand = (ffmpeg as unknown as jest.Mock)();
      const tmpFilePath =
        "C:\\Suraj\\Educational\\videoverse\\src\\services\\tmp_video_list.txt";

      jest.spyOn(fs, "writeFileSync").mockImplementation();
      jest.spyOn(fs, "unlinkSync").mockImplementation();
      mockCommand.on.mockImplementation((event: string, callback: any) => {
        if (event === "error") callback(new Error("Merging error"));
        return mockCommand;
      });

      await expect(
        mergeVideos(["video1.mp4", "video2.mp4"], "output.mp4")
      ).rejects.toThrow("Merging error");

      expect(fs.unlinkSync).toHaveBeenCalledWith(tmpFilePath);
    });

    it("should reject if tmp file creation fails", async () => {
      jest.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw new Error("File system error");
      });

      await expect(
        mergeVideos(["video1.mp4", "video2.mp4"], "output.mp4")
      ).rejects.toThrow("File system error");
    });
  });
});
