import { model, Schema } from "mongoose";

const inventoryItemSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 180, index: true },
    category: { type: String, required: true, trim: true, maxlength: 80, index: true },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },
    location: { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true, versionKey: false },
);
export const InventoryItemModel = model("InventoryItem", inventoryItemSchema);

const inventoryTransactionSchema = new Schema(
  {
    transactionNumber: { type: String, required: true, unique: true, uppercase: true },
    item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    type: { type: String, enum: ["stock_in", "stock_out", "adjustment"], required: true, index: true },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    issuedTo: { type: Schema.Types.ObjectId, ref: "User" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);
inventoryTransactionSchema.index({ item: 1, createdAt: -1 });
export const InventoryTransactionModel = model("InventoryTransaction", inventoryTransactionSchema);
