import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { validateVideoUpload } from "../middleware";
import { mergeVideos, trimVideo } from "../services";

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
        res.status(404).json({ message: "video file not found in store" });
        return;
      }

      if (!fs.existsSync(VIDEO_STORAGE_FOLDER)) {
        try {
          fs.mkdirSync(VIDEO_STORAGE_FOLDER);
        } catch (err) {
          console.error("failed to create video storage", err);
          res
            .status(500)
            .json({ message: "server error while creating storage" });
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
        console.error("error during trimming process:", error);
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

router.post("/merge", async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length < 2) {
      res.status(400).json({
        message: "at least two video IDs are required to merge videos",
      });
      return;
    }

    const videos = await prisma.videos.findMany({
      where: {
        id: { in: videoIds },
      },
    });

    if (!videos || videos.length !== videoIds.length) {
      res.status(404).json({
        message: "one or more video IDs do not exist",
      });
      return;
    }

    const videoPaths = videos.map((v) => v.path);

    if (videoPaths.some((path) => !fs.existsSync(path))) {
      res.status(404).json({
        message: "one or more video files are missing from the store",
      });
      return;
    }

    if (!fs.existsSync(VIDEO_STORAGE_FOLDER)) {
      try {
        fs.mkdirSync(VIDEO_STORAGE_FOLDER);
      } catch (err) {
        console.error("failed to create video storage", err);
        res
          .status(500)
          .json({ message: "server error while creating storage" });
        return;
      }
    }

    const mergedFileName = `${Date.now()}-merged.mp4`;
    const outputPath = path.join(VIDEO_STORAGE_FOLDER, mergedFileName);

    try {
      await mergeVideos(videoPaths, outputPath);
    } catch (error) {
      console.error("error during merging process:", error);
      res.status(500).json({ message: "error merging videos" });
      return;
    }

    const mergedVideo = await prisma.videos.create({
      data: {
        name: mergedFileName,
        size: fs.statSync(outputPath).size,
        duration: videos.reduce((sum, video) => sum + video.duration, 0),
        path: outputPath,
      },
    });

    res.status(201).json({
      message: "video trimmed successfully",
      video: mergedVideo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error while merging video" });
  }
});

export default router;
