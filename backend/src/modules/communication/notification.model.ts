import { model, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    channel: { type: String, enum: ["in_app", "email", "sms", "push"], required: true, index: true },
    recipient: { type: String, trim: true, select: false },
    type: { type: String, required: true, trim: true, maxlength: 80, index: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    data: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "read"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    sentAt: { type: Date },
    readAt: { type: Date },
    lastError: { type: String, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
export const NotificationModel = model("Notification", notificationSchema);
