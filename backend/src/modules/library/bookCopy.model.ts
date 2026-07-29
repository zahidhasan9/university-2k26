import { model, Schema } from "mongoose";

const bookCopySchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
    accessionNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    barcode: { type: String, unique: true, sparse: true, trim: true },
    shelfLocation: { type: String, trim: true, maxlength: 80 },
    condition: {
      type: String,
      enum: ["new", "good", "fair", "damaged", "lost"],
      default: "good",
    },
    status: {
      type: String,
      enum: ["available", "issued", "maintenance", "lost", "archived"],
      default: "available",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

bookCopySchema.index({ book: 1, status: 1 });
export const BookCopyModel = model("LibraryCopy", bookCopySchema);
