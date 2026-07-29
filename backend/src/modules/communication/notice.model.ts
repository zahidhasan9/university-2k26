import { model, Schema } from "mongoose";

const noticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 250, index: true },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    category: {
      type: String,
      enum: ["general", "academic", "admission", "exam", "finance", "event", "emergency"],
      default: "general",
      index: true,
    },
    audienceRoles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    attachmentUrls: [{ type: String, trim: true }],
    publishAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

noticeSchema.index({ status: 1, publishAt: -1, expiresAt: 1 });
export const NoticeModel = model("Notice", noticeSchema);
