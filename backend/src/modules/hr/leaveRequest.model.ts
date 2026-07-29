import { model, Schema } from "mongoose";

const leaveRequestSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    type: {
      type: String,
      enum: ["casual", "sick", "annual", "maternity", "paternity", "unpaid", "other"],
      required: true,
      index: true,
    },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    totalDays: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

leaveRequestSchema.index({ employee: 1, status: 1, startsAt: 1, endsAt: 1 });
export const LeaveRequestModel = model("LeaveRequest", leaveRequestSchema);
