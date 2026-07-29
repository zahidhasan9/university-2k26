import { model, Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, uppercase: true },
    method: {
      type: String,
      enum: [
        "cash",
        "bank_transfer",
        "card",
        "mobile_banking",
        "cheque",
        "online",
      ],
      required: true,
      index: true,
    },
    externalReference: { type: String, trim: true },
    status: {
      type: String,
      enum: ["completed", "refunded"],
      default: "completed",
      index: true,
    },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date, default: Date.now, index: true },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: "User" },
    refundReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

paymentSchema.index(
  { externalReference: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { externalReference: { $type: "string" } },
  },
);
export const PaymentModel = model("Payment", paymentSchema);
