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
  TextAlignment,
  Quantum,
} from "npm:@imagemagick/magick-wasm@^0";
import { ROBOTO_BOLD_BASE64 } from "./font-data.ts";

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
      const wasmBytes = await Deno.readFile(
        new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@^0")),
      );
      await initializeImageMagick(wasmBytes);
      const fontBytes = Uint8Array.from(atob(ROBOTO_BOLD_BASE64), (c) => c.charCodeAt(0));
      Magick.addFont(FONT_NAME, fontBytes);
    })();
  }
  return magickReady;
}

/**
 * Draws "IZIGO.AZ" onto `content` and returns the watermarked bytes in the
 * same `format` the image was uploaded as. Sizing/position:
 *  - width ≈ 10% of the image's own width (middle of the requested 8-12%
 *    range), computed via a measure-then-scale pass so it's responsive
 *    instead of a fixed point size that would look huge on a small photo
 *    and tiny on a large one.
 *  - centered horizontally, sitting a bit below the vertical center
 *    (~58% down) rather than in a corner, so a simple crop can't remove it.
 *  - white text at ~18% opacity with a soft dark shadow copy drawn first,
 *    for legibility on both light and dark photos without being loud.
 */
function applyWatermark(content: Uint8Array, format: MagickFormat): Uint8Array {
  return ImageMagick.read(content, (img): Uint8Array => {
    // Roughly matches the client's own WebP quality (0.78) for webp/jpeg;
    // harmless no-op for PNG (lossless — this only affects zlib effort).
    img.quality = 78;

    const measureAt = 100;
    const measured = new Drawables().font(FONT_NAME).fontPointSize(measureAt).fontTypeMetrics(WATERMARK_TEXT);
    if (!measured) throw new Error("Unable to measure watermark text metrics.");

    const targetWidth = img.width * 0.10;
    const scale = targetWidth / measured.textWidth;
    // Clamp so a degenerate (near-zero) source image never yields an
    // unreadable or negative point size.
    const pointSize = Math.min(400, Math.max(8, Math.round(measureAt * scale)));

    const finalMetrics = new Drawables().font(FONT_NAME).fontPointSize(pointSize).fontTypeMetrics(WATERMARK_TEXT);
    const textHeight = finalMetrics?.textHeight ?? pointSize;

    const centerX = img.width * 0.50;
    // 58% down the image, nudged by a fraction of the text height so the
    // text is vertically centered on that line rather than sitting on it.
    const centerY = img.height * 0.58 + textHeight * 0.3;

    const shadowAlpha = Math.round(Quantum.max * 0.12);
    const textAlpha = Math.round(Quantum.max * 0.18);
    const shadowColor = new MagickColor(0, 0, 0, shadowAlpha);
    const textColor = new MagickColor(255, 255, 255, textAlpha);
    const shadowOffset = Math.max(1, Math.round(pointSize * 0.03));

    new Drawables()
      .font(FONT_NAME)
      .fontPointSize(pointSize)
      .textAlignment(TextAlignment.Center)
      .fillColor(shadowColor)
      .text(centerX + shadowOffset, centerY + shadowOffset, WATERMARK_TEXT)
      .fillColor(textColor)
      .text(centerX, centerY, WATERMARK_TEXT)
      .draw(img);

    return img.write(format, (data) => data);
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
    watermarked = applyWatermark(content, format);
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
