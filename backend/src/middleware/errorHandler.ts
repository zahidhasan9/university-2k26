import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isOperational = error instanceof AppError;
  const statusCode = isOperational ? error.statusCode : 500;
  if (!isOperational) console.error(error);

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : "Internal server error",
    ...(isOperational && error.details ? { details: error.details } : {}),
    ...(env.NODE_ENV === "development" && !isOperational ? { stack: error.stack } : {}),
  });
};
