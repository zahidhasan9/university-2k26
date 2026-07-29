import { model, Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    subject: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ["direct", "group"], required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false },
);
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
export const ConversationModel = model("Conversation", conversationSchema);

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    attachmentUrls: [{ type: String, trim: true }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["visible", "deleted"], default: "visible", index: true },
  },
  { timestamps: true, versionKey: false },
);
messageSchema.index({ conversation: 1, createdAt: -1 });
export const MessageModel = model("Message", messageSchema);
