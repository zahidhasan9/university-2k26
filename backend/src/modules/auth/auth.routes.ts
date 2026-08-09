import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { changePassword, login, logout, me, refresh, register } from "./auth.controller";
import { changePasswordSchema, loginSchema, registerSchema } from "./auth.validation";

export const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
    return res.status(options.statusCode).json({
      success: false,
      message: `Too many authentication attempts. Try again in about ${retryAfterMinutes} minutes.`,
      retryAfterSeconds,
      retryAfterMinutes,
    });
  },
});

authRouter.post("/register", authLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post("/refresh", authLimiter, asyncHandler(refresh));
authRouter.post("/logout", asyncHandler(logout));
authRouter.get("/me", authenticate, asyncHandler(me));
authRouter.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(changePassword),
);
