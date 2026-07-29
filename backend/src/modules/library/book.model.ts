import { model, Schema } from "mongoose";

const bookSchema = new Schema(
  {
    isbn: { type: String, trim: true, uppercase: true },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      index: true,
    },
    authors: [{ type: String, required: true, trim: true, maxlength: 150 }],
    publisher: { type: String, trim: true, maxlength: 160 },
    publicationYear: { type: Number, min: 1000, max: 2200 },
    edition: { type: String, trim: true, maxlength: 60 },
    categories: [{ type: String, trim: true, maxlength: 80 }],
    language: { type: String, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 3000 },
    digitalUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ title: "text", authors: "text", categories: "text" });
export const BookModel = model("LibraryBook", bookSchema);
