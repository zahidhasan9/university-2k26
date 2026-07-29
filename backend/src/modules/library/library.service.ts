import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { escapeRegex, toObjectId } from "../../utils/mongo";
import { getPagination, paginationMeta } from "../../utils/pagination";
import { StudentModel } from "../student/student.model";
import { TeacherModel } from "../teacher/teacher.model";
import { UserModel } from "../user/user.model";
import { BookCopyModel } from "./bookCopy.model";
import { BookModel } from "./book.model";
import { LibraryPolicyModel } from "./libraryPolicy.model";
import { LibraryTransactionModel } from "./libraryTransaction.model";

export async function listBooks(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const search = escapeRegex(String(query.search));
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { authors: { $regex: search, $options: "i" } },
      { isbn: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    BookModel.find(filter).sort({ title: 1 }).skip(skip).limit(limit).lean(),
    BookModel.countDocuments(filter),
  ]);
  const availability = await BookCopyModel.aggregate([
    { $match: { book: { $in: items.map((item) => item._id) } } },
    { $group: { _id: { book: "$book", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const counts = new Map<string, Record<string, number>>();
  for (const item of availability) {
    const key = item._id.book.toString();
    counts.set(key, { ...(counts.get(key) ?? {}), [item._id.status]: item.count });
  }
  return {
    items: items.map((item) => ({ ...item, copies: counts.get(item._id.toString()) ?? {} })),
    pagination: paginationMeta(total, page, limit),
  };
}

export async function createBook(input: Record<string, unknown>) {
  if (input.isbn && (await BookModel.exists({ isbn: input.isbn }))) {
    throw new AppError(409, "ISBN already exists");
  }
  return BookModel.create(input);
}

export async function updateBook(id: string, input: Record<string, unknown>) {
  const book = await BookModel.findByIdAndUpdate(toObjectId(id), input, {
    new: true,
    runValidators: true,
  });
  if (!book) throw new AppError(404, "Book not found");
  if (input.status === "archived") {
    if (await BookCopyModel.exists({ book: book._id, status: "issued" })) {
      book.status = "active";
      await book.save();
      throw new AppError(409, "Book with issued copies cannot be archived");
    }
    await BookCopyModel.updateMany(
      { book: book._id, status: { $ne: "lost" } },
      { $set: { status: "archived" } },
    );
  }
  return book;
}

export async function listCopies(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.bookId) filter.book = toObjectId(String(query.bookId), "book id");
  if (query.status) filter.status = query.status;
  return BookCopyModel.find(filter).populate("book", "title isbn authors").sort({ accessionNumber: 1 }).lean();
}

export async function createCopy(input: Record<string, unknown>) {
  const book = await BookModel.findOne({
    _id: toObjectId(String(input.bookId), "book id"),
    status: "active",
  });
  if (!book) throw new AppError(400, "Active book not found");
  if (
    await BookCopyModel.countDocuments({
      $or: [
        { accessionNumber: input.accessionNumber },
        ...(input.barcode ? [{ barcode: input.barcode }] : []),
      ],
    } as Record<string, unknown>)
  ) {
    throw new AppError(409, "Accession number or barcode already exists");
  }
  const { bookId: _, ...data } = input;
  return BookCopyModel.create({ ...data, book: book._id });
}

export async function updateCopy(id: string, input: Record<string, unknown>) {
  const copy = await BookCopyModel.findById(toObjectId(id));
  if (!copy) throw new AppError(404, "Book copy not found");
  if (copy.status === "issued") throw new AppError(409, "Issued copy cannot be edited");
  if (input.condition === "lost") input.status = "lost";
  copy.set(input);
  await copy.save();
  return copy;
}

export async function upsertPolicy(input: Record<string, unknown>) {
  const borrowerType = input.borrowerType as "student" | "teacher";
  await LibraryPolicyModel.updateOne(
    { borrowerType },
    { $set: input },
    { upsert: true, runValidators: true },
  );
  const policy = await LibraryPolicyModel.findOne({
    borrowerType,
  });
  if (!policy) throw new AppError(500, "Unable to save library policy");
  return policy;
}

export function listPolicies() {
  return LibraryPolicyModel.find().sort({ borrowerType: 1 }).lean();
}

async function validateBorrower(userId: Types.ObjectId, type: "student" | "teacher") {
  const [user, profile] = await Promise.all([
    UserModel.findOne({ _id: userId, status: "active" }).select("_id").lean(),
    type === "student"
      ? StudentModel.findOne({ user: userId, status: "active" }).select("_id").lean()
      : TeacherModel.findOne({ user: userId, status: "active" }).select("_id").lean(),
  ]);
  if (!user || !profile) throw new AppError(400, `Active ${type} borrower not found`);
}

export async function issueBook(
  actorId: Types.ObjectId,
  input: {
    copyId: string;
    borrowerUserId: string;
    borrowerType: "student" | "teacher";
    note?: string;
  },
) {
  const borrowerId = toObjectId(input.borrowerUserId, "borrower user id");
  const [policy] = await Promise.all([
    LibraryPolicyModel.findOne({ borrowerType: input.borrowerType }).lean(),
    validateBorrower(borrowerId, input.borrowerType),
  ]);
  if (!policy) throw new AppError(409, `Library policy for ${input.borrowerType} is not configured`);
  const activeLoans = await LibraryTransactionModel.countDocuments({
    borrower: borrowerId,
    status: "issued",
  });
  if (activeLoans >= policy.maxActiveLoans) throw new AppError(409, "Borrower has reached the loan limit");
  const copy = await BookCopyModel.findOneAndUpdate(
    { _id: toObjectId(input.copyId, "copy id"), status: "available" },
    { $set: { status: "issued" } },
    { new: true },
  );
  if (!copy) throw new AppError(409, "Book copy is not available");
  try {
    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + policy.loanDays);
    return await LibraryTransactionModel.create({
      transactionNumber: `LIB-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 10)}`.toUpperCase(),
      copy: copy._id,
      book: copy.book,
      borrower: borrowerId,
      borrowerType: input.borrowerType,
      dueAt,
      currency: policy.currency,
      issuedBy: actorId,
      note: input.note,
    });
  } catch (error) {
    await BookCopyModel.updateOne({ _id: copy._id }, { $set: { status: "available" } });
    throw error;
  }
}

export async function returnBook(
  id: string,
  actorId: Types.ObjectId,
  input: { returnedAt?: Date; condition: string; note?: string },
) {
  const transaction = await LibraryTransactionModel.findOne({
    _id: toObjectId(id),
    status: "issued",
  });
  if (!transaction) throw new AppError(409, "Active library transaction not found");
  const policy = await LibraryPolicyModel.findOne({ borrowerType: transaction.borrowerType }).lean();
  if (!policy) throw new AppError(409, "Library policy is not configured");
  const returnedAt = input.returnedAt ?? new Date();
  if (returnedAt < transaction.issuedAt) throw new AppError(400, "Return date cannot precede issue date");
  const overdueMs = Math.max(0, returnedAt.getTime() - transaction.dueAt.getTime());
  const overdueDays = Math.ceil(overdueMs / 86_400_000);
  transaction.status = "returned";
  transaction.returnedAt = returnedAt;
  transaction.returnedBy = actorId;
  transaction.fineMinor = overdueDays * policy.finePerDayMinor;
  transaction.note = input.note ?? transaction.note;
  await transaction.save();
  await BookCopyModel.updateOne(
    { _id: transaction.copy },
    { $set: { status: input.condition === "damaged" ? "maintenance" : "available", condition: input.condition } },
  );
  return transaction;
}

export async function listTransactions(query: Record<string, unknown>) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (query.borrowerUserId) filter.borrower = toObjectId(String(query.borrowerUserId), "borrower id");
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    LibraryTransactionModel.find(filter)
      .populate("book", "title isbn authors")
      .populate("copy", "accessionNumber barcode")
      .populate("borrower", "firstName lastName email")
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LibraryTransactionModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(total, page, limit) };
}

export function listMyTransactions(userId: Types.ObjectId, query: Record<string, unknown>) {
  return listTransactions({ ...query, borrowerUserId: userId.toString() });
}
