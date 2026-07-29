import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./inventory.controller";
import { inventoryItemCreateSchema, stockMovementSchema } from "./inventory.validation";

export const inventoryRouter = Router();
inventoryRouter.use(authenticate, authorize("inventory.read"));
inventoryRouter.get("/items", asyncHandler(controller.items));
inventoryRouter.post(
  "/items",
  authorize("inventory.manage"),
  validate(inventoryItemCreateSchema),
  asyncHandler(controller.createItem),
);
inventoryRouter.get("/transactions", asyncHandler(controller.transactions));
inventoryRouter.post(
  "/transactions",
  authorize("inventory.manage"),
  validate(stockMovementSchema),
  asyncHandler(controller.moveStock),
);
