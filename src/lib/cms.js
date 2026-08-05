import { supabase } from "./supabaseClient";
import { compressImage, validateImageFile } from "./imageOptimize";

/** Turns a raw Postgres/PostgREST error into a message an admin can act on.
 *  Postgres code 23505 = unique_violation — every content type's `slug` has
 *  a unique constraint, so this is almost always "that slug is taken." */
function friendlyDbError(err, fallback) {
  if (err?.code === "23505") {
    return new Error("That slug is already in use — choose a different one.");
  }
  return new Error(err?.message || fallback);
}

/* =========================================================================
   CMS data layer.

   Every content type is a "parent" row (slug, taxonomy, images, status)
   plus one "translation" row per language — see supabase/015_cms_foundation.sql
   for why. The admin CRUD helpers below centralize that parent+translations
   pattern so each admin page doesn't reimplement it.

   The "public read" helpers further down (Stage 2) are separate on purpose:
   they only ever select status = 'published' rows and flatten the matched
   translation onto the parent object, which is what the frontend actually
   wants to render — the admin list() helpers intentionally return every
   status and every translation for editing.
   ========================================================================= */

function safeExt(file) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Uploads a file to the shared cms-media storage bucket and returns its public URL.
 *  Every image is resized + re-encoded as WebP client-side first (see
 *  lib/imageOptimize.js) — automatic, no admin action required. */
export async function uploadCmsImage(file, folder = "general") {
  validateImageFile(file);
  const optimized = await compressImage(file);
  const path = `${folder}/${crypto.randomUUID()}.${safeExt(optimized)}`;
  const { error } = await supabase.storage.from("cms-media").upload(path, optimized);
  if (error) throw error;
  const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
  return { url: data.publicUrl, path, file: optimized };
}

/**
 * Builds CRUD helpers for a parent+translations content type.
 * `parentTable`/`translationsTable` are the table names; `foreignKey` is the
 * translations table's column pointing back at the parent (e.g. "guide_id");
 * `searchColumns` are parent-table text columns the admin search box filters
 * on (e.g. slug/city) — kept to parent columns so it's a single indexed
 * query, not a join across every translation.
 */
function createContentApi({ parentTable, translationsTable, foreignKey, searchColumns = ["slug"] }) {
  const PAGE_SIZE = 50;

  /**
   * Paginated + searchable list — the admin CRUD helper. Defaults to the
   * first 50 rows so opening e.g. Places with 1000+ rows doesn't fetch
   * everything (and every translation of everything) on every page load.
   * Returns { rows, count } — `count` is the *total* matching rows (for
   * "page 2 of 20" UI), independent of how many `rows` came back.
   */
  async function list({ search = "", limit = PAGE_SIZE, offset = 0 } = {}) {
    let query = supabase
      .from(parentTable)
      .select(`*, translations:${translationsTable}(*)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search.trim()) {
      const like = `%${search.trim()}%`;
      query = query.or(searchColumns.map((col) => `${col}.ilike.${like}`).join(","));
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data || [], count: count ?? (data || []).length };
  }

  async function getById(id) {
    const { data, error } = await supabase
      .from(parentTable)
      .select(`*, translations:${translationsTable}(*)`)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  /** `translations` is { [language]: { ...fields } } */
  async function save({ id, parent, translations }) {
    let parentId = id;
    if (id) {
      const { error } = await supabase.from(parentTable).update({ ...parent, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw friendlyDbError(error, "Failed to save.");
    } else {
      const { data, error } = await supabase.from(parentTable).insert(parent).select("id").single();
      if (error) throw friendlyDbError(error, "Failed to create.");
      parentId = data.id;
    }

    const rows = Object.entries(translations)
      .filter(([, fields]) => fields && Object.keys(fields).length > 0)
      .map(([language, fields]) => ({ [foreignKey]: parentId, language, ...fields }));

    if (rows.length > 0) {
      const { error } = await supabase.from(translationsTable).upsert(rows, { onConflict: `${foreignKey},language` });
      if (error) throw friendlyDbError(error, "Failed to save translations.");
    }

    return parentId;
  }

  async function remove(id) {
    const { error } = await supabase.from(parentTable).delete().eq("id", id);
    if (error) throw error;
  }

  async function setStatus(id, status) {
    const { error } = await supabase.from(parentTable).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  }

  return { list, getById, save, remove, setStatus };
}

export const travelGuidesApi = createContentApi({
  parentTable: "cms_travel_guides",
  translationsTable: "cms_travel_guide_translations",
  foreignKey: "guide_id",
  searchColumns: ["slug", "city"],
});

export const placesApi = createContentApi({
  parentTable: "cms_places",
  translationsTable: "cms_place_translations",
  foreignKey: "place_id",
  searchColumns: ["slug", "city", "region", "category"],
});

export const faqsApi = createContentApi({
  parentTable: "cms_faqs",
  translationsTable: "cms_faq_translations",
  foreignKey: "faq_id",
  searchColumns: ["category"],
});

export const staticPagesApi = createContentApi({
  parentTable: "cms_static_pages",
  translationsTable: "cms_static_page_translations",
  foreignKey: "page_id",
});

/* ---- Media Library ------------------------------------------------- */

const MEDIA_SORT_COLUMNS = { newest: "created_at", oldest: "created_at", name: "filename", size: "size_bytes" };

export async function listMedia({ folder, search, tag, sort = "newest" } = {}) {
  const column = MEDIA_SORT_COLUMNS[sort] || "created_at";
  const ascending = sort === "oldest" || sort === "name";
  let query = supabase.from("cms_media").select("*").order(column, { ascending });
  if (folder) query = query.eq("folder", folder);
  if (tag) query = query.contains("tags", [tag]);
  if (search) query = query.or(`filename.ilike.%${search}%,alt_text.ilike.%${search}%,caption.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Same filename-derivation compressImage() uses (basename + .webp for
 *  raster images) — needed up front to check for an existing upload with
 *  the same name in the same folder before spending a network round trip. */
function predictedFilename(file) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file.name;
  return file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".webp";
}

export async function uploadMedia(file, { folder = "general", altText = "", caption = "", tags = [], allowDuplicate = false } = {}) {
  if (!allowDuplicate) {
    const filename = predictedFilename(file);
    const { data: existing } = await supabase.from("cms_media").select("id").eq("folder", folder).eq("filename", filename).limit(1);
    if (existing?.length > 0) {
      throw new Error(`"${filename}" already exists in "${folder}". Rename the file, choose a different folder, or delete the existing one first.`);
    }
  }

  const { url, path, file: optimized } = await uploadCmsImage(file, folder);
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("cms_media").insert({
    url,
    storage_path: path,
    folder,
    filename: optimized.name,
    mime_type: optimized.type,
    size_bytes: optimized.size,
    alt_text: altText,
    caption,
    tags,
    created_by: user?.id,
  });
  if (error) throw error;
}

export async function updateMedia(id, fields) {
  const { error } = await supabase.from("cms_media").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteMedia(item) {
  await supabase.storage.from("cms-media").remove([item.storage_path]);
  const { error } = await supabase.from("cms_media").delete().eq("id", item.id);
  if (error) throw error;
}

export async function listMediaFolders() {
  const { data, error } = await supabase.from("cms_media").select("folder");
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.folder))].sort();
}

/* =========================================================================
   Public read helpers (Stage 2 — frontend integration).
   Every query below is scoped to status = 'published' at the DB level
   (see supabase/016_cms_public_read.sql) as well as here, and flattens the
   best-matching translation (current language → az → whatever's first)
   onto the parent row so page components can use plain `item.title` etc.
   ========================================================================= */

function pickTranslation(translations, language) {
  if (!translations || translations.length === 0) return null;
  return translations.find((t) => t.language === language)
    || translations.find((t) => t.language === "az")
    || translations[0];
}

/** A single published travel guide by slug, or null if it doesn't exist / isn't published. */
export async function fetchPublishedGuideBySlug(slug, language) {
  const { data, error } = await supabase
    .from("cms_travel_guides")
    .select("*, translations:cms_travel_guide_translations(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const translation = pickTranslation(data.translations, language);
  if (!translation) return null;
  return { ...data, ...translation, keywords: translation.keywords || [] };
}

/** A single published place by slug, or null if it doesn't exist / isn't published. */
export async function fetchPublishedPlaceBySlug(slug, language) {
  const { data, error } = await supabase
    .from("cms_places")
    .select("*, translations:cms_place_translations(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const translation = pickTranslation(data.translations, language);
  if (!translation) return null;
  return { ...data, ...translation, keywords: translation.keywords || [], faq: translation.faq || [] };
}

function flattenPlaces(rows, language) {
  return (rows || [])
    .map((row) => {
      const translation = pickTranslation(row.translations, language);
      if (!translation) return null;
      return { ...row, ...translation };
    })
    .filter(Boolean);
}

/** Published places flagged `featured` — e.g. the homepage's "Discover Azerbaijan" section. */
export async function fetchFeaturedPlaces(language, limit = 6) {
  const { data, error } = await supabase
    .from("cms_places")
    .select("*, translations:cms_place_translations(*)")
    .eq("status", "published")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return flattenPlaces(data, language);
}

/** Published places in a city — "Must Visit Places" on a destination page, or
 *  "Restaurants near you" on a place page. `excludeId` drops the current place. */
export async function fetchPlacesByCity(city, language, { category, excludeId, limit = 6 } = {}) {
  if (!city) return [];
  let query = supabase.from("cms_places").select("*, translations:cms_place_translations(*)").eq("status", "published").eq("city", city);
  if (category) query = query.eq("category", category);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  return flattenPlaces(data, language);
}
