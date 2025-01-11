import { NextFunction, Request, Response } from "express";

const STATIC_API_TOKEN = process.env.STATIC_API_TOKEN;

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];
  if (token !== `Bearer ${STATIC_API_TOKEN}`) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};
