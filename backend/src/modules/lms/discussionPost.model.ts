import { model, Schema } from "mongoose";

const discussionPostSchema = new Schema(
  {
    offering: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "DiscussionPost", index: true },
    title: { type: String, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["visible", "hidden"], default: "visible", index: true },
  },
  { timestamps: true, versionKey: false },
);
discussionPostSchema.index({ offering: 1, parent: 1, createdAt: -1 });
export const DiscussionPostModel = model("DiscussionPost", discussionPostSchema);
