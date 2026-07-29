import { model, Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    expenseNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 80, index: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    vendor: { type: String, trim: true, maxlength: 160 },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    expenseDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "approved", "paid", "rejected", "cancelled"],
      default: "draft",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

expenseSchema.index({ expenseDate: 1, category: 1, status: 1 });
export const ExpenseModel = model("Expense", expenseSchema);
