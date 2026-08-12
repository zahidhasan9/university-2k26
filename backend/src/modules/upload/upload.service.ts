import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const localUploadRoot = path.resolve(process.cwd(), "uploads");

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

export type UploadedImage = {
  url: string;
  storage: "local" | "cloudinary";
  key: string;
  mimeType: string;
  size: number;
};

async function saveLocally(
  file: Express.Multer.File,
  folder: string,
  requestOrigin: string,
): Promise<UploadedImage> {
  const extension = extensionByMime[file.mimetype];
  if (!extension) throw new AppError(415, "Unsupported file format");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-");
  const key = `${safeFolder}/${randomUUID()}${extension}`;
  const directory = path.join(localUploadRoot, safeFolder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(localUploadRoot, key), file.buffer, { flag: "wx" });
  const baseUrl = (env.UPLOAD_BASE_URL ?? requestOrigin).replace(/\/$/, "");
  return {
    url: `${baseUrl}/uploads/${key.replaceAll("\\", "/")}`,
    storage: "local",
    key,
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function saveToCloudinary(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "auto" = "image",
): Promise<UploadedImage> {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `unisphere/${folder}`,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploaded) => {
        if (error || !uploaded) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
      },
    );
    stream.end(file.buffer);
  });

  return {
    url: result.secure_url,
    storage: "cloudinary",
    key: result.public_id,
    mimeType: file.mimetype,
    size: file.size,
  };
}

export async function uploadImage(
  file: Express.Multer.File | undefined,
  options: { folder: string; requestOrigin: string },
) {
  if (!file) throw new AppError(400, "Image file is required");
  return env.UPLOAD_DRIVER === "cloudinary"
    ? saveToCloudinary(file, options.folder)
    : saveLocally(file, options.folder, options.requestOrigin);
}

export async function uploadDocument(file: Express.Multer.File | undefined, options: { folder: string; requestOrigin: string }) {
  if (!file) throw new AppError(400, "Document file is required");
  return env.UPLOAD_DRIVER === "cloudinary"
    ? saveToCloudinary(file, options.folder, "auto")
    : saveLocally(file, options.folder, options.requestOrigin);
}

export { localUploadRoot };
