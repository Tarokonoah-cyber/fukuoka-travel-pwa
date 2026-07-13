"use client";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export interface ProcessedReceiptImage {
  previewUrl: string;
  imageBase64: string;
  mimeType: "image/jpeg";
  receiptHash: string;
  width: number;
  height: number;
  byteLength: number;
}

function isHeic(file: File) {
  return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/i.test(file.name);
}

async function normalizeSource(file: File) {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.88 });
  return Array.isArray(converted) ? converted[0] : converted;
}

async function loadImage(blob: Blob) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Safari and older browsers fall back to an HTML image below.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("IMAGE_COMPRESS_FAILED")), "image/jpeg", quality);
  });
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function processReceiptImage(file: File): Promise<ProcessedReceiptImage> {
  const typeAllowed = SUPPORTED.has(file.type) || isHeic(file);
  if (!typeAllowed) throw new Error("UNSUPPORTED_IMAGE");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("SOURCE_TOO_LARGE");

  const source = await normalizeSource(file);
  const image = await loadImage(source);
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const longest = Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(1, 1600 / longest);
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));
  let quality = 0.83;
  let output: Blob | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("IMAGE_COMPRESS_FAILED");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    output = await canvasToBlob(canvas, quality);
    if (output.size <= MAX_OUTPUT_BYTES) break;
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
    quality -= 0.08;
  }
  if ("close" in image && typeof image.close === "function") image.close();
  if (!output || output.size > MAX_OUTPUT_BYTES) throw new Error("OUTPUT_TOO_LARGE");

  return {
    previewUrl: URL.createObjectURL(output),
    imageBase64: await blobToBase64(output),
    mimeType: "image/jpeg",
    receiptHash: await sha256(output),
    width,
    height,
    byteLength: output.size,
  };
}
