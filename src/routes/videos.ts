import express from "express";
import { PrismaClient } from "@prisma/client";
import { validateVideoUpload } from "../middleware";

const router = express();
const prisma = new PrismaClient();

router.post("/videos", validateVideoUpload, async (req, res) => {
  try {
    const { video, duration } = req.body;

    const newVideo = await prisma.videos.create({
      data: {
        name: video.originalname,
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

export default router;
