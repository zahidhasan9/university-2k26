import { model, Schema } from "mongoose";

const amountLineSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const salaryStructureSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    earnings: { type: [amountLineSchema], required: true },
    deductions: { type: [amountLineSchema], required: true, default: [] },
    grossMinor: { type: Number, required: true, min: 0 },
    deductionMinor: { type: Number, required: true, min: 0 },
    netMinor: { type: Number, required: true, min: 0 },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
salaryStructureSchema.index(
  { employee: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);
export const SalaryStructureModel = model(
  "SalaryStructure",
  salaryStructureSchema,
);

const payrollRunSchema = new Schema(
  {
    year: { type: Number, required: true, min: 2000, max: 2200 },
    month: { type: Number, required: true, min: 1, max: 12 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    employeeCount: { type: Number, required: true, min: 0, default: 0 },
    grossMinor: { type: Number, required: true, min: 0, default: 0 },
    deductionMinor: { type: Number, required: true, min: 0, default: 0 },
    netMinor: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "processed", "paid", "cancelled"],
      default: "draft",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);
payrollRunSchema.index({ year: 1, month: 1, currency: 1 }, { unique: true });
export const PayrollRunModel = model("PayrollRun", payrollRunSchema);

const payrollItemSchema = new Schema(
  {
    run: {
      type: Schema.Types.ObjectId,
      ref: "PayrollRun",
      required: true,
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    currency: { type: String, required: true, uppercase: true },
    earnings: { type: [amountLineSchema], required: true },
    deductions: { type: [amountLineSchema], required: true },
    grossMinor: { type: Number, required: true, min: 0 },
    deductionMinor: { type: Number, required: true, min: 0 },
    netMinor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["processed", "paid"],
      default: "processed",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
payrollItemSchema.index({ run: 1, employee: 1 }, { unique: true });
export const PayrollItemModel = model("PayrollItem", payrollItemSchema);
