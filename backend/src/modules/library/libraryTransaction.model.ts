import { model, Schema } from "mongoose";

const libraryTransactionSchema = new Schema(
  {
    transactionNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    copy: { type: Schema.Types.ObjectId, ref: "LibraryCopy", required: true, index: true },
    book: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
    borrower: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    borrowerType: { type: String, enum: ["student", "teacher"], required: true, index: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    dueAt: { type: Date, required: true, index: true },
    returnedAt: { type: Date },
    fineMinor: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    status: { type: String, enum: ["issued", "returned", "lost"], default: "issued", index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    returnedBy: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

libraryTransactionSchema.index(
  { copy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "issued" } },
);
libraryTransactionSchema.index({ borrower: 1, status: 1 });
export const LibraryTransactionModel = model("LibraryTransaction", libraryTransactionSchema);
