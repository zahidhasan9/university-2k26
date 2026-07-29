import { model, Schema } from "mongoose";

const invoiceItemSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    feeStructure: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    items: { type: [invoiceItemSchema], required: true },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    paidMinor: { type: Number, required: true, min: 0, default: 0 },
    dueMinor: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["issued", "partially_paid", "paid", "overdue", "void"],
      default: "issued",
      index: true,
    },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    voidedAt: { type: Date },
    voidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    voidReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

invoiceSchema.index({ student: 1, semester: 1 }, { unique: true });
invoiceSchema.index({ dueDate: 1, status: 1 });
export const InvoiceModel = model("Invoice", invoiceSchema);
