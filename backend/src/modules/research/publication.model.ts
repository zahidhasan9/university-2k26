import { model, Schema } from "mongoose";

const publicationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 400, index: true },
    type: {
      type: String,
      enum: ["journal", "conference", "book", "book_chapter", "patent", "report", "other"],
      required: true,
      index: true,
    },
    authors: [{ type: Schema.Types.ObjectId, ref: "Teacher", required: true }],
    project: { type: Schema.Types.ObjectId, ref: "ResearchProject", index: true },
    venue: { type: String, trim: true, maxlength: 250 },
    doi: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    url: { type: String, trim: true },
    publishedAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["published", "accepted", "in_review"], default: "published" },
  },
  { timestamps: true, versionKey: false },
);

publicationSchema.index({ authors: 1, publishedAt: -1 });
export const PublicationModel = model("Publication", publicationSchema);
