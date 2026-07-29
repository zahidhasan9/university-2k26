import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import * as service from "./library.service";

function auth(req: Request) {
  if (!req.auth) throw new AppError(401, "Authentication required");
  return req.auth;
}
async function audit(req: Request, action: string, resource: string, resourceId: string) {
  await writeAuditLog(req, { actor: auth(req).userId, action, resource, resourceId });
}
export async function books(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Library books retrieved", await service.listBooks(req.query));
}
export async function createBook(req: Request, res: Response): Promise<Response> {
  const book = await service.createBook(req.body);
  await audit(req, "library.book_create", "library_book", book._id.toString());
  return sendSuccess(res, 201, "Book created", { book });
}
export async function updateBook(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const book = await service.updateBook(id, req.body);
  await audit(req, "library.book_update", "library_book", id);
  return sendSuccess(res, 200, "Book updated", { book });
}
export async function copies(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Book copies retrieved", { copies: await service.listCopies(req.query) });
}
export async function createCopy(req: Request, res: Response): Promise<Response> {
  const copy = await service.createCopy(req.body);
  await audit(req, "library.copy_create", "library_copy", copy._id.toString());
  return sendSuccess(res, 201, "Book copy created", { copy });
}
export async function updateCopy(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const copy = await service.updateCopy(id, req.body);
  await audit(req, "library.copy_update", "library_copy", id);
  return sendSuccess(res, 200, "Book copy updated", { copy });
}
export async function policies(_req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Library policies retrieved", { policies: await service.listPolicies() });
}
export async function upsertPolicy(req: Request, res: Response): Promise<Response> {
  const policy = await service.upsertPolicy(req.body);
  await audit(req, "library.policy_update", "library_policy", policy._id.toString());
  return sendSuccess(res, 200, "Library policy saved", { policy });
}
export async function transactions(req: Request, res: Response): Promise<Response> {
  return sendSuccess(res, 200, "Library transactions retrieved", await service.listTransactions(req.query));
}
export async function mine(req: Request, res: Response): Promise<Response> {
  return sendSuccess(
    res,
    200,
    "Your library transactions retrieved",
    await service.listMyTransactions(auth(req).userId, req.query),
  );
}
export async function issue(req: Request, res: Response): Promise<Response> {
  const transaction = await service.issueBook(auth(req).userId, req.body);
  await audit(req, "library.issue", "library_transaction", transaction._id.toString());
  return sendSuccess(res, 201, "Book issued", { transaction });
}
export async function returnBook(req: Request, res: Response): Promise<Response> {
  const id = req.params.id as string;
  const transaction = await service.returnBook(id, auth(req).userId, req.body);
  await audit(req, "library.return", "library_transaction", id);
  return sendSuccess(res, 200, "Book returned", { transaction });
}
