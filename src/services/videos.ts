import ffmpeg from "fluent-ffmpeg";

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
