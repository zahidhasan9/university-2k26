import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (req, res, next) => {
  res.setHeader("x-request-id", req.header("x-request-id") ?? randomUUID());
  next();
};
