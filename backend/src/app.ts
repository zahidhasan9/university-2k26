import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { apiRouter } from "./routes";
import { AppError } from "./utils/AppError";
import { openApiSpec } from "./docs/openapi";
import { localUploadRoot } from "./modules/upload/upload.service";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError(403, "Origin is not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(
  "/uploads",
  express.static(localUploadRoot, {
    dotfiles: "deny",
    fallthrough: false,
    immutable: true,
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'");
    },
  }),
);
app.get("/api/docs/openapi.json", (_req, res) => res.json(openApiSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests" },
  }),
);
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
