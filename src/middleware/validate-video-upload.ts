import multer from "multer";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { NextFunction } from "express";

const MAX_SIZE = Number(process.env.MAX_VIDEO_SIZE_IN_MB || 25) * 1024 * 1024;
const MIN_DURATION = Number(process.env.MIN_VIDEO_DURATION_IN_SECONDS || 5);
const MAX_DURATION = Number(process.env.MAX_VIDEO_DURATION_IN_SECONDS || 25);

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
}).single("video");

export const validateVideoUpload = (req: any, res: any, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      console.error(err);

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      }

      return res
        .status(500)
        .json({ message: "server error during file upload" });
    }

    const videoPath = req.file?.path;

    if (videoPath) {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "error processing video" });
        }

        const duration = metadata.format.duration || 0;

        if (duration < MIN_DURATION || duration > MAX_DURATION) {
          console.info(
            "duration of uploaded video is not in the allowed limits"
          );
          return res.status(400).json({
            message: `video duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds`,
          });
        }

        req.body.video = req.file;
        req.body.duration = duration;
        next();
      });
    } else {
      return res.status(400).json({ message: "no video file uploaded" });
    }
  });
};
