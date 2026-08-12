import type { RequestHandler } from "express";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedDocumentTypes = new Set([...allowedImageTypes, "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new AppError(415, "Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
    callback(null, true);
  },
});

export const uploadSingleImage: RequestHandler = (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(413, `Image must be ${env.UPLOAD_MAX_MB} MB or smaller`));
    }
    return next(error);
  });
};

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedDocumentTypes.has(file.mimetype)) return callback(new AppError(415, "Only PDF, DOC, DOCX, JPEG, PNG, WebP, and GIF files are allowed"));
    callback(null, true);
  },
});

export const uploadSingleDocument: RequestHandler = (req, res, next) => {
  documentUpload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return next(new AppError(413, `File must be ${env.UPLOAD_MAX_MB} MB or smaller`));
    return next(error);
  });
};
