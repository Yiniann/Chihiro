import "server-only";

import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { parse as parseExif } from "exifr";
import { getObjectStorageSettings } from "@/server/repositories/object-storage";

export const MAX_IMAGE_UPLOAD_SIZE = 5 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

type ExifData = {
  Make?: unknown;
  Model?: unknown;
  FNumber?: unknown;
  ExposureTime?: unknown;
  ISO?: unknown;
  ISOSpeedRatings?: unknown;
  FocalLength?: unknown;
  FocalLengthIn35mmFormat?: unknown;
  DateTimeOriginal?: unknown;
  CreateDate?: unknown;
};

export async function uploadImageToObjectStorage(file: File) {
  const settings = await getObjectStorageSettings();

  if (!settings) {
    throw new Error("图床尚未配置，请先在后台设置里填写对象存储信息。");
  }

  if (!file || file.size === 0) {
    throw new Error("请选择要上传的图片。");
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new Error(`图片不能超过 ${MAX_IMAGE_UPLOAD_SIZE / 1024 / 1024}MB。`);
  }

  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("只支持上传 AVIF、GIF、JPEG、PNG、SVG 或 WebP 图片。");
  }

  const storageKey = createStorageKey(file.name, file.type, settings.keyPrefix);
  const body = Buffer.from(await file.arrayBuffer());
  const photoMeta = await getPhotoMeta(body);
  const client = new S3Client({
    region: settings.region,
    endpoint: settings.endpoint ?? undefined,
    forcePathStyle: settings.forcePathStyle,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: settings.bucket,
      Key: storageKey,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: file.type,
    }),
  );

  return {
    url: createPublicUrl(settings.publicBaseUrl, storageKey),
    storageKey,
    photoMeta,
  };
}

function createPublicUrl(publicBaseUrl: string, storageKey: string) {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${storageKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function createStorageKey(filename: string, mimeType: string, keyPrefix: string | null) {
  const prefix = normalizeKeyPrefix(keyPrefix);
  const extension = getSafeExtension(filename, mimeType);
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${prefix}${year}/${month}/${day}/${randomUUID()}${extension}`;
}

function normalizeKeyPrefix(prefix: string | null) {
  if (!prefix) {
    return "";
  }

  return `${prefix.replace(/^\/+|\/+$/g, "")}/`;
}

function getSafeExtension(filename: string, mimeType: string) {
  const extension = extname(filename).toLowerCase();

  if (/^\.[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  switch (mimeType) {
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/svg+xml":
      return ".svg";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

async function getPhotoMeta(body: Buffer) {
  try {
    const exif = (await parseExif(body, {
      pick: [
        "Make",
        "Model",
        "FNumber",
        "ExposureTime",
        "ISO",
        "ISOSpeedRatings",
        "FocalLength",
        "FocalLengthIn35mmFormat",
        "DateTimeOriginal",
        "CreateDate",
      ],
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })) as ExifData | undefined;

    if (!exif) {
      return undefined;
    }

    return formatPhotoMeta(exif);
  } catch {
    return undefined;
  }
}

function formatPhotoMeta(exif: ExifData) {
  const items = [
    formatCamera(exif.Make, exif.Model),
    formatAperture(exif.FNumber),
    formatIso(exif.ISO ?? exif.ISOSpeedRatings),
    formatExposure(exif.ExposureTime),
    formatFocalLength(exif.FocalLengthIn35mmFormat, exif.FocalLength),
    formatExifDate(exif.DateTimeOriginal ?? exif.CreateDate),
  ].filter((item): item is string => Boolean(item));

  return items.length > 0 ? items.join(" · ") : undefined;
}

function formatCamera(makeValue: unknown, modelValue: unknown) {
  const make = normalizeExifString(makeValue);
  const model = normalizeExifString(modelValue);

  if (!make && !model) {
    return undefined;
  }

  if (!make) {
    return model;
  }

  if (!model) {
    return make;
  }

  return model.toLowerCase().includes(make.toLowerCase()) ? model : `${make} ${model}`;
}

function formatAperture(value: unknown) {
  const number = normalizeExifNumber(value);

  return number ? `f/${formatExifNumber(number, 1)}` : undefined;
}

function formatIso(value: unknown) {
  const number = normalizeExifNumber(value);

  return number ? `ISO ${Math.round(number)}` : undefined;
}

function formatExposure(value: unknown) {
  const number = normalizeExifNumber(value);

  if (!number) {
    return undefined;
  }

  if (number >= 1) {
    return `${formatExifNumber(number, 1)}s`;
  }

  return `1/${Math.round(1 / number)}s`;
}

function formatFocalLength(equivalentValue: unknown, focalLengthValue: unknown) {
  const equivalent = normalizeExifNumber(equivalentValue);

  if (equivalent) {
    return `${formatExifNumber(equivalent, 0)}mm (等效)`;
  }

  const focalLength = normalizeExifNumber(focalLengthValue);

  return focalLength ? `${formatExifNumber(focalLength, 1)}mm` : undefined;
}

function formatExifDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = normalizeExifString(value);
  const match = text?.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);

  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

function normalizeExifString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeExifNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}

function formatExifNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}
