import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { writeAuditLog } from "../audit/audit.service";
import { updateOwnProfile } from "../user/user.service";
import { uploadImage } from "./upload.service";

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
