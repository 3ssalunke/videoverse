import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

export const trimVideo = (
  inputPath: string,
  outputPath: string,
  start: number | undefined,
  end: number | undefined,
  duration: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath).output(outputPath);
    if (start !== undefined) {
      command.setStartTime(start);
    }
    if (end !== undefined) {
      const newDuration = (end || duration) - (start || 0);
      command.setDuration(newDuration);
    }

    command.on("end", () => {
      resolve();
    });

    command.on("error", (err) => {
      console.error("error trimming video", err);
      reject(err);
    });

    command.run();
  });
};

export const mergeVideos = async (
  videoPaths: string[],
  outputPath: string
): Promise<void> => {
  const tmpFilePath = path.resolve(__dirname, "tmp_video_list.txt");

  try {
    const absolutePaths = videoPaths.map((p) => path.resolve(p));
    const tmpFileContent = absolutePaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");

    fs.writeFileSync(tmpFilePath, tmpFileContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(tmpFilePath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions("-c copy")
        .output(outputPath)
        .on("end", () => {
          fs.unlinkSync(tmpFilePath);
          resolve();
        })
        .on("error", (error) => {
          fs.unlinkSync(tmpFilePath);
          reject(error);
        })
        .run();
    });
  } catch (error) {
    if (fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }

    throw error;
  }
};
