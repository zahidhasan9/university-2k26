import { model, Schema } from "mongoose";

const feeItemSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 0 },
    mandatory: { type: Boolean, default: true },
  },
  { _id: false },
);

const feeStructureSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    currency: { type: String, required: true, uppercase: true, trim: true, default: "BDT" },
    perCreditFeeMinor: { type: Number, required: true, min: 0, default: 0 },
    items: { type: [feeItemSchema], required: true },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
  },
  { timestamps: true, versionKey: false },
);

feeStructureSchema.index({ program: 1, semester: 1 }, { unique: true });
export const FeeStructureModel = model("FeeStructure", feeStructureSchema);
