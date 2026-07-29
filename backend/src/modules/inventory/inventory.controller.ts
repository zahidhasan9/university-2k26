import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./inventory.service";

function actor(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth.userId;
}
export async function items(req: Request, res: Response) {
  return sendSuccess(res, 200, "Inventory items retrieved", await service.listItems(req.query));
}
export async function createItem(req: Request, res: Response) {
  const item = await service.createItem(actor(req), req.body);
  await writeAuditLog(req, { actor: actor(req), action: "inventory.item_create", resource: "inventory_item", resourceId: item._id.toString() });
  return sendSuccess(res, 201, "Inventory item created", { item });
}
export async function moveStock(req: Request, res: Response) {
  const transaction = await service.moveStock(actor(req), req.body);
  await writeAuditLog(req, { actor: actor(req), action: "inventory.stock_move", resource: "inventory_transaction", resourceId: transaction._id.toString() });
  return sendSuccess(res, 201, "Stock updated", { transaction });
}
export async function transactions(req: Request, res: Response) {
  return sendSuccess(res, 200, "Inventory transactions retrieved", await service.listTransactions(req.query));
}
