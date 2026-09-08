// Applies a subtle "IZIGO.AZ" watermark to a listing photo (villa/car/
// transfer/event/service) server-side, then uploads the watermarked result
// to the existing `listing-images` bucket. This is the ONLY place watermarks
// are applied — hero campaign images, CMS media and any future profile/
// avatar uploads go through their own unrelated upload paths and never call
// this function.
//
// Flow: browser compresses (1920px max, WebP q0.78, via src/lib/imageOptimize.js)
// -> browser calls this function with the compressed file -> this function
// draws the watermark -> this function uploads to Storage -> returns the
// public URL, which the frontend stores on the listing exactly like before.
//
// Deploy with:
//   supabase functions deploy watermark-listing-image
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are already
// present automatically in every Supabase Edge Function's environment —
// same pattern as confirm-user-email and generate-content.)

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  ImageMagick,
  initializeImageMagick,
  Magick,
  MagickColor,
  MagickFormat,
  Drawables,
} from "npm:@imagemagick/magick-wasm@0.0.43";
import { ROBOTO_MEDIUM_BASE64 } from "./font-data.ts";

// The WASM binary is fetched from a CDN at the exact same version as the
// import above, rather than read from the package on disk: Supabase's edge
// runtime bundler mangles `import.meta.resolve("npm:...")` paths (they come
// out as `node_modules/localhost/...` and fail), so Deno.readFile can't find
// magick.wasm inside the deployed bundle.
// 0.0.43 splits the binary in two: dist/x64 is a memory64 (wasm64) build
// that Supabase's Deno edge runtime refuses to instantiate ("invalid table
// limits flags 0x4 ... --experimental-wasm-memory64"); dist/x86 is the plain
// wasm32 build, which is the one that works here.
const MAGICK_WASM_URL = "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.43/dist/x86/magick.wasm";

// Watermark width as a fraction of the photo's displayed width, and the
// aspect ratio of the box the detail-page gallery shows photos in
// (object-fit: contain, see src/components/ListingGallery.jsx). The size is
// normalised to that box below so the mark reads the same on screen for
// every photo regardless of its own pixel dimensions.
const WATERMARK_WIDTH_FRACTION = 0.10;
const GALLERY_ASPECT = 4 / 3;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BUCKET = "listing-images";
const WATERMARK_TEXT = "IZIGO.AZ";
const FONT_NAME = "IzigoWatermarkFont.ttf";

// Mirrors the client's own validateImageFile() limit (src/lib/imageOptimize.js)
// so an oversized request never even reaches the WASM decoder.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Only listing photo types — matches ACCEPTED_TYPES in imageOptimize.js minus
// gif/svg, which compressImage() never re-encodes (it returns those files
// untouched), so there's nothing for ImageMagick to safely rasterize here.
// A gif/svg upload is the rare case (browsers that couldn't produce WebP);
// callers should keep falling back to the direct-to-storage path for those —
// see the frontend integration notes in AddListingFormPage.jsx.
const FORMAT_BY_CONTENT_TYPE: Record<string, MagickFormat> = {
  "image/jpeg": MagickFormat.Jpeg,
  "image/png": MagickFormat.Png,
  "image/webp": MagickFormat.WebP,
};
const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// initializeImageMagick() + Magick.addFont() only need to run once per
// warm instance — cached across requests on the same Edge Function
// isolate, same idea as compile-once-run-many.
let magickReady: Promise<void> | null = null;
function ensureMagickReady(): Promise<void> {
  if (!magickReady) {
    magickReady = (async () => {
      const res = await fetch(MAGICK_WASM_URL);
      if (!res.ok) throw new Error(`Failed to fetch magick.wasm: ${res.status} ${res.statusText}`);
      const wasmBytes = new Uint8Array(await res.arrayBuffer());
      await initializeImageMagick(wasmBytes);
      const fontBytes = Uint8Array.from(atob(ROBOTO_MEDIUM_BASE64), (c) => c.charCodeAt(0));
      Magick.addFont(FONT_NAME, fontBytes);
      // Warm up text metrics once so the very first real request measures the
      // registered font, not a fallback — a fallback's different glyph widths
      // would give that one photo a slightly off watermark size.
      try { new Drawables().font(FONT_NAME).fontPointSize(100).fontTypeMetrics(WATERMARK_TEXT); } catch { /* non-fatal */ }
    })().catch((err) => {
      // Don't let one failed init poison the warm isolate forever — clear
      // the cached promise so the next request retries from scratch.
      magickReady = null;
      throw err;
    });
  }
  return magickReady;
}

// magick-wasm is single-threaded and NOT reentrant — the frontend uploads
// several photos at once, and Supabase can hand those concurrent requests to
// the same warm isolate, where interleaved applyWatermark() calls would
// corrupt each other's ImageMagick state (this showed up as one photo in a
// batch getting a wrong-sized watermark). Serialize every call through this
// promise chain so only one runs at a time per isolate.
let magickQueue: Promise<unknown> = Promise.resolve();
function runExclusive<T>(fn: () => T): Promise<T> {
  const result = magickQueue.then(fn);
  magickQueue = result.catch(() => {});
  return result;
}

/**
 * Draws "IZIGO.AZ" onto `content` and returns the watermarked bytes in the
 * same `format` the image was uploaded as. Sizing/position:
 *  - width ≈ 10% of the width the photo OCCUPIES in the detail page's 4:3
 *    contain-fit gallery box — not 10% of the photo's own width, which made
 *    the mark shrink on portrait photos (they scale down harder to fit the
 *    box). Computed via a measure-then-scale pass so it stays responsive.
 *  - centered horizontally (x offset computed by hand from the measured text
 *    width — magick-wasm 0.0.43 does not honour Drawables.textAlignment,
 *    which left-anchored the text off to the right), sitting a bit below the
 *    vertical center (~58% down) rather than in a corner, so a simple crop
 *    can't remove it.
 *  - medium-weight text over a barely-there 4-point dark halo (5%) — solid
 *    but soft like bina.az's mark (regular weight read too thin). TWO
 *    stamps, drawn independently: a big one centred at ~58% down
 *    (crop-resistant, ~36% white) and a half-size one in the bottom-right
 *    corner (~46% white).
 */
function applyWatermark(content: Uint8Array, format: MagickFormat): Uint8Array {
  return ImageMagick.read(content, (img): Uint8Array => {
    // Roughly matches the client's own WebP quality (0.78) for webp/jpeg;
    // harmless no-op for PNG (lossless — this only affects zlib effort).
    img.quality = 78;

    const measureAt = 100;
    const measured = new Drawables().font(FONT_NAME).fontPointSize(measureAt).fontTypeMetrics(WATERMARK_TEXT);
    if (!measured) throw new Error("Unable to measure watermark text metrics.");

    // Base the size on the width the photo OCCUPIES in the 4:3 gallery box
    // (contain-fit), not its own width, so the mark is the same on-screen
    // size for every photo:
    //   - landscape (w/h >= 4/3): the photo fills the box by width  -> use img.width
    //   - portrait  (w/h <  4/3): the photo fills the box by height -> use the
    //     width it would have at that height (img.height * 4/3)
    const displayWidth = Math.max(img.width, img.height * GALLERY_ASPECT);
    // Never let the mark exceed 90% of the actual pixel width — guards the
    // pathological case of an extremely tall, narrow source image.
    const targetWidth = Math.min(displayWidth * WATERMARK_WIDTH_FRACTION, img.width * 0.9);
    const scale = targetWidth / measured.textWidth;
    // Clamp so a degenerate (near-zero) source image never yields an
    // unreadable or negative point size.
    const pointSize = Math.min(400, Math.max(8, Math.round(measureAt * scale)));

    const finalMetrics = new Drawables().font(FONT_NAME).fontPointSize(pointSize).fontTypeMetrics(WATERMARK_TEXT);
    const textHeight = finalMetrics?.textHeight ?? pointSize;
    const textWidth = finalMetrics?.textWidth ?? measured.textWidth * scale;

    // Left edge of the (left-anchored) text so its mid-point lands on the
    // image's horizontal center — done here rather than via textAlignment,
    // which this magick-wasm build ignores.
    const startX = img.width * 0.5 - textWidth / 2;
    // 58% down the image, nudged by a fraction of the text height so the
    // text is vertically centered on that line rather than sitting on it.
    const baselineY = img.height * 0.58 + textHeight * 0.3;

    // Alpha as a 0-255 byte, not Quantum.max * fraction — the byte overload
    // of MagickColor is stable across the Q8/Q16 builds; Quantum.max is not.
    //
    // Soft like bina.az: medium-weight text over a barely-there 4-point dark
    // halo. The halo isn't a drop shadow — it exists only so the white glyphs
    // don't disappear on a near-white wall; on everything else it's
    // imperceptible.
    const haloColor = new MagickColor(0, 0, 0, Math.round(255 * 0.05));
    const centreColor = new MagickColor(255, 255, 255, Math.round(255 * 0.36));
    // The corner stamp is small and out of the way, so a touch more solid.
    const cornerColor = new MagickColor(255, 255, 255, Math.round(255 * 0.46));
    const haloOffsets: [number, number][] = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ];

    // Each stamp is its OWN Drawables with a SINGLE fontPointSize, applied by
    // its own .draw(). Sharing one Drawables and switching fontPointSize
    // mid-chain (for the centre + corner marks) was unreliable in this
    // magick-wasm build — the corner mark sometimes didn't render, or both
    // came out the wrong size.
    const stamp = (pt: number, tlX: number, baseY: number, fill: MagickColor) => {
      const r = Math.max(1, Math.round(pt * 0.014));
      const d = new Drawables().font(FONT_NAME).fontPointSize(pt);
      d.fillColor(haloColor);
      for (const [dx, dy] of haloOffsets) d.text(tlX + dx * r, baseY + dy * r, WATERMARK_TEXT);
      d.fillColor(fill).text(tlX, baseY, WATERMARK_TEXT);
      d.draw(img);
    };

    // 1. Big, centred mark (crop-resistant).
    stamp(pointSize, startX, baselineY, centreColor);

    // 2. Small mark in the bottom-right corner (bina.az style) — half the
    // centre mark. Metrics scale ~linearly with point size, so derive its box
    // from the centre mark's rather than re-measuring.
    const cornerPt = Math.max(8, Math.round(pointSize * 0.5));
    const cs = cornerPt / pointSize;
    const cornerW = textWidth * cs;
    const cornerH = textHeight * cs;
    // Tucked right into the corner, bina.az-style — ~1.2% in from the right,
    // ~1.8% up from the bottom (of the baseline; "IZIGO.AZ" has no descenders
    // so that's roughly the visible edge).
    const marginX = Math.round(img.width * 0.012);
    const marginY = Math.round(img.height * 0.018);
    const cornerX = Math.max(0, img.width - marginX - cornerW);
    const cornerY = Math.max(cornerH, img.height - marginY);
    stamp(cornerPt, cornerX, cornerY, cornerColor);

    // magick-wasm hands the callback a Uint8Array that is a VIEW into WASM
    // memory, valid only for the duration of this callback — ImageMagick
    // reuses that memory afterwards. Returning `data` directly leaks a
    // dangling view whose bytes get overwritten before the upload, which is
    // what produced the intermittently corrupt .webp files. Copy the bytes
    // out so the returned array owns its own buffer.
    return img.write(format, (data) => new Uint8Array(data));
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "This function is missing its Supabase environment secrets." }, 501);
  }

  // Same gate as the existing direct-upload RLS policy it replaces
  // ("Authenticated users can upload listing images": auth.role() =
  // 'authenticated') — any signed-in host, not admin-only.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Not authenticated." }, 401);
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated." }, 401);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ error: "Invalid request body — expected multipart/form-data with a 'file' field." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return json({ error: "A 'file' field with the image is required." }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ error: `Image is too large (max ${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)}MB).` }, 413);
  }

  const contentType = file.type;
  const format = FORMAT_BY_CONTENT_TYPE[contentType];
  if (!format) {
    return json({ error: `Unsupported image type "${contentType}". Use JPG, PNG or WebP.` }, 415);
  }

  try {
    await ensureMagickReady();
  } catch (err) {
    console.error("watermark-listing-image: failed to initialize ImageMagick:", err);
    return json({ error: "Image processing is temporarily unavailable. Please try again." }, 503);
  }

  let watermarked: Uint8Array;
  try {
    const content = new Uint8Array(await file.arrayBuffer());
    watermarked = await runExclusive(() => applyWatermark(content, format));
  } catch (err) {
    console.error("watermark-listing-image: processing failed:", err);
    return json({ error: "Failed to process this image — please try a different photo." }, 422);
  }

  const ext = EXT_BY_CONTENT_TYPE[contentType];
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  // Service-role client — never exposed to the browser, only ever
  // constructed and used inside this server-side function.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: uploadError } = await adminClient.storage.from(BUCKET).upload(path, watermarked, { contentType });
  if (uploadError) {
    console.error("watermark-listing-image: storage upload failed:", uploadError);
    return json({ error: "Failed to save the image — please try again." }, 502);
  }

  const { data: publicUrlData } = adminClient.storage.from(BUCKET).getPublicUrl(path);
  return json({ ok: true, path, url: publicUrlData.publicUrl });
});
