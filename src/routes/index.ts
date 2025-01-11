import express from "express";
import videosRoutes from "./videos";

const router = express();

router.use("/v1", videosRoutes);

export default router;
