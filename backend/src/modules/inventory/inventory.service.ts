import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { UserModel } from "../user/user.model";
import { InventoryItemModel, InventoryTransactionModel } from "./inventory.model";

const transactionNumber = () =>
  `STK-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 10)}`.toUpperCase();

export async function createItem(actorId: Types.ObjectId, input: Record<string, unknown>) {
  if (
    await InventoryItemModel.countDocuments({
      sku: String(input.sku),
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "SKU exists");
  }
  const { initialQuantity, ...data } = input;
  const quantity = Number(initialQuantity ?? 0);
  const item = await InventoryItemModel.create({ ...data, quantity });
  if (quantity > 0) {
    await InventoryTransactionModel.create({
      transactionNumber: transactionNumber(),
      item: item._id,
      type: "stock_in",
      quantity,
      balanceAfter: quantity,
      reason: "Initial stock",
      performedBy: actorId,
    });
  }
  return item;
}

export async function listItems(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.lowStock === "true") filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = [
      { sku: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    InventoryItemModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    InventoryItemModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export async function moveStock(
  actorId: Types.ObjectId,
  input: {
    itemId: string;
    type: "stock_in" | "stock_out" | "adjustment";
    quantity: number;
    reason: string;
    issuedToUserId?: string;
  },
) {
  const itemId = toObjectId(input.itemId, "item id");
  const delta =
    input.type === "stock_in"
      ? input.quantity
      : input.type === "stock_out"
        ? -input.quantity
        : input.quantity;
  if (input.issuedToUserId) {
    if (!(await UserModel.exists({ _id: toObjectId(input.issuedToUserId), status: "active" }))) {
      throw new AppError(400, "Issued-to user is unavailable");
    }
  }
  const item = await InventoryItemModel.findOneAndUpdate(
    {
      _id: itemId,
      status: "active",
      ...(delta < 0 ? { quantity: { $gte: Math.abs(delta) } } : {}),
    },
    { $inc: { quantity: delta } },
    { new: true },
  );
  if (!item) throw new AppError(409, "Item is unavailable or stock is insufficient");
  try {
    return await InventoryTransactionModel.create({
      transactionNumber: transactionNumber(),
      item: item._id,
      type: input.type,
      quantity: delta,
      balanceAfter: item.quantity,
      reason: input.reason,
      ...(input.issuedToUserId ? { issuedTo: toObjectId(input.issuedToUserId) } : {}),
      performedBy: actorId,
    });
  } catch (error) {
    await InventoryItemModel.updateOne({ _id: item._id }, { $inc: { quantity: -delta } });
    throw error;
  }
}

export async function listTransactions(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.itemId) filter.item = toObjectId(String(query.itemId), "item id");
  if (query.type) filter.type = query.type;
  const [items, total] = await Promise.all([
    InventoryTransactionModel.find(filter)
      .populate("item", "sku name unit")
      .populate("issuedTo performedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryTransactionModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}
