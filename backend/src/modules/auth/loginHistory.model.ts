import { model, Schema } from "mongoose";

const loginHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    successful: { type: Boolean, required: true, index: true },
    failureReason: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, versionKey: false },
);

loginHistorySchema.index({ createdAt: -1 });

export const LoginHistoryModel = model("LoginHistory", loginHistorySchema);
