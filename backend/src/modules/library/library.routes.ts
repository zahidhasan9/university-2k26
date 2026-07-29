import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./library.controller";
import {
  bookCreateSchema,
  bookUpdateSchema,
  copyCreateSchema,
  copyUpdateSchema,
  issueBookSchema,
  policyUpsertSchema,
  returnBookSchema,
} from "./library.validation";

export const libraryRouter = Router();
libraryRouter.use(authenticate);
libraryRouter.get("/books", authorize("library.read"), asyncHandler(controller.books));
libraryRouter.post(
  "/books",
  authorize("library.manage"),
  validate(bookCreateSchema),
  asyncHandler(controller.createBook),
);
libraryRouter.patch(
  "/books/:id",
  authorize("library.manage"),
  validate(bookUpdateSchema),
  asyncHandler(controller.updateBook),
);
libraryRouter.get("/copies", authorize("library.read"), asyncHandler(controller.copies));
libraryRouter.post(
  "/copies",
  authorize("library.manage"),
  validate(copyCreateSchema),
  asyncHandler(controller.createCopy),
);
libraryRouter.patch(
  "/copies/:id",
  authorize("library.manage"),
  validate(copyUpdateSchema),
  asyncHandler(controller.updateCopy),
);
libraryRouter.get("/policies", authorize("library.read"), asyncHandler(controller.policies));
libraryRouter.put(
  "/policies",
  authorize("library.manage"),
  validate(policyUpsertSchema),
  asyncHandler(controller.upsertPolicy),
);
libraryRouter.get("/transactions/mine", asyncHandler(controller.mine));
libraryRouter.get(
  "/transactions",
  authorize("library.read"),
  asyncHandler(controller.transactions),
);
libraryRouter.post(
  "/transactions/issue",
  authorize("library.circulation"),
  validate(issueBookSchema),
  asyncHandler(controller.issue),
);
libraryRouter.post(
  "/transactions/:id/return",
  authorize("library.circulation"),
  validate(returnBookSchema),
  asyncHandler(controller.returnBook),
);
