import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";

export const validate = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    return next(new AppError(422, "Validation failed", result.error.flatten()));
  }

  const value = result.data as { body?: unknown };
  if (value.body !== undefined) req.body = value.body;
  next();
};
