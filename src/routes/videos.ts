import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { validateVideoUpload } from "../middleware";
import { trimVideo } from "../services";

const router = express();
const prisma = new PrismaClient();

const VIDEO_STORAGE_FOLDER =
  (process.env.VIDEO_STORAGE_FOLDER || "video_store") + "/";

router.post("/", validateVideoUpload, async (req, res) => {
  try {
    const { video, duration } = req.body;

    const newVideo = await prisma.videos.create({
      data: {
        name: video.filename,
        size: video.size,
        duration: duration,
        path: video.path,
      },
    });

    res.status(201).json({
      message: "video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error while saving video" });
  }
});

router.post(
  "/trim",
  async (
    req: Request<{}, {}, { videoId: string; start?: number; end?: number }>,
    res: Response
  ) => {
    try {
      let { videoId, start, end } = req.body;

      if (!videoId || (start === undefined && end === undefined)) {
        res.status(400).json({
          message: "video id and one of the start or end time required",
        });
        return;
      }

      const video = await prisma.videos.findUnique({
        where: {
          id: videoId,
        },
      });

      if (!video) {
        res.status(404).json({ message: "video not found" });
        return;
      }

      if (
        (start !== undefined &&
          (start < 0 || start >= (end || video.duration))) ||
        (end !== undefined && (end > video.duration || end <= (start || 0)))
      ) {
        res.status(400).json({
          message:
            "start and end time should be in original video duration limits",
        });
        return;
      }

      const videoPath = video.path;
      if (!fs.existsSync(videoPath)) {
        res.status(404).json({ message: "video file not found on server" });
        return;
      }

      if (!fs.existsSync(VIDEO_STORAGE_FOLDER)) {
        try {
          fs.mkdirSync(VIDEO_STORAGE_FOLDER);
        } catch (err) {
          console.error("Failed to create video storage folder", err);
          res
            .status(500)
            .json({ message: "server error while creating storage folder" });
          return;
        }
      }

      const trimmedFileName = `${Date.now()}-${video.name
        .split("-")
        .slice(1)
        .join("-")}`;
      const outputPath = path.join(VIDEO_STORAGE_FOLDER, trimmedFileName);

      try {
        await trimVideo(videoPath, outputPath, start, end, video.duration);
      } catch (error) {
        console.error("Error during trimming process:", error);
        res.status(500).json({ message: "error trimming video" });
        return;
      }

      const trimmedVideo = await prisma.videos.create({
        data: {
          name: trimmedFileName,
          size: fs.statSync(outputPath).size,
          duration: (end || video.duration) - (start || 0),
          path: outputPath,
        },
      });

      res.status(201).json({
        message: "video trimmed successfully",
        video: trimmedVideo,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "server error while trimming video" });
    }
  }
);

export default router;
