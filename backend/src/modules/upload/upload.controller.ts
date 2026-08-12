import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import { updateOwnProfile } from "../user/user.service";
import { uploadDocument, uploadImage } from "./upload.service";

export async function profileImage(req: Request, res: Response) {
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const image = await uploadImage(req.file, { folder: "profile-images", requestOrigin });
  const user = await updateOwnProfile(req.auth!.userId, { avatarUrl: image.url });
  await writeAuditLog(req, {
    actor: req.auth!.userId,
    action: "user.profile_image_upload",
    resource: "user",
    resourceId: req.auth!.userId.toString(),
    metadata: { storage: image.storage, key: image.key, size: image.size },
  });
  return sendSuccess(res, 201, "Profile image uploaded", { image, user });
}
export async function studentDocument(req: Request, res: Response) {
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const document = await uploadDocument(req.file, { folder: "student-documents", requestOrigin });
  await writeAuditLog(req, { actor: req.auth!.userId, action: "student.document_upload", resource: "student-document", metadata: { storage: document.storage, key: document.key, mimeType: document.mimeType, size: document.size } });
  return sendSuccess(res, 201, `Document uploaded to ${document.storage} storage`, { document });
}
export async function studentProfileImage(req: Request, res: Response) {
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const image = await uploadImage(req.file, { folder: "student-profile-images", requestOrigin });
  await writeAuditLog(req, { actor: req.auth!.userId, action: "student.profile_image_upload", resource: "student-profile-image", metadata: { storage: image.storage, key: image.key, size: image.size } });
  return sendSuccess(res, 201, `Profile image uploaded to ${image.storage} storage`, { image });
}
