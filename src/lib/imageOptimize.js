/* =========================================================================
   Client-side image optimization — runs before any upload leaves the
   browser, so both listing photos and CMS media get resized + re-encoded
   as WebP automatically. This works everywhere (no dependency on a paid
   Supabase image-transform plan) and directly reduces upload size, storage
   cost and — most importantly — how many bytes a visitor downloads.
   ========================================================================= */

const MAX_DIMENSION = 1920; // never need a wider asset than a large desktop hero
const WEBP_QUALITY = 0.78;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB — generous for a source photo, cheap to enforce before it hits the network
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

/**
 * Validates a file before it's ever compressed or uploaded — wrong file
 * type (e.g. a renamed .pdf) or an oversized file both throw a clear,
 * user-facing message instead of failing deep inside a storage call.
 */
export function validateImageFile(file, { maxSizeBytes = MAX_UPLOAD_BYTES } = {}) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}" isn't a supported image type. Use JPG, PNG, WebP, GIF or SVG.`);
  }
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    throw new Error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is ${maxMb}MB.`);
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resizes an image to fit within MAX_DIMENSION and re-encodes it as WebP.
 * Falls back to the original file untouched if the browser can't produce a
 * WebP blob (very old browsers) or the input isn't a raster image (e.g. SVG,
 * where "compression" doesn't apply) — callers always get a usable File.
 */
export async function compressImage(file, { maxDimension = MAX_DIMENSION, quality = WEBP_QUALITY } = {}) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(img.src);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) return file; // browser doesn't support WebP encoding — keep the original

    const newName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    // Decoding failed for any reason — never block an upload over an
    // optimization step, just ship the original file.
    return file;
  }
}
