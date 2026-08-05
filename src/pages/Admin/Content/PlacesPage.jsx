import { useEffect, useRef, useState } from "react";
import { MapPin, ImageIcon, X, Plus, Trash2 } from "lucide-react";
import { LANGUAGES } from "../../../i18n/translations";
import { ALL_DESTINATIONS } from "../../../data/azerbaijanDestinations";
import { placesApi, uploadCmsImage } from "../../../lib/cms";
import { CONTENT_ADMIN_STYLES } from "./contentAdminStyles";
import AiAssistPanel from "./AiAssistPanel";

const DEFAULT_LANG = LANGUAGES[0].code;
const CATEGORIES = ["attraction", "restaurant", "hotel", "activity", "shopping", "nature", "other"];

const EMPTY_TRANSLATION = { name: "", seo_title: "", meta_description: "", keywords: "", content: "", faq: [] };

const AI_FIELDS = [
  { id: "content", label: "Place Description", promptType: "content" },
  { id: "faq", label: "FAQ", promptType: "faq" },
  { id: "seo_title", label: "SEO Title", promptType: "seo_title" },
  { id: "meta_description", label: "Meta Description", promptType: "meta_description" },
  { id: "keywords", label: "Keywords", promptType: "keywords" },
  { id: "hero_image_alt", label: "Image ALT Text", promptType: "alt_text" },
];

function emptyForm() {
  return {
    id: null,
    slug: "",
    city: "",
    region: "",
    category: CATEGORIES[0],
    status: "draft",
    featured: false,
    hero_image_url: "",
    hero_image_alt: "",
    canonical_url: "",
    gallery: [],
    translations: Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION, faq: [] }])),
  };
}

function rowToForm(row) {
  const translations = Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION, faq: [] }]));
  for (const t of row.translations || []) {
    translations[t.language] = {
      name: t.name || "",
      seo_title: t.seo_title || "",
      meta_description: t.meta_description || "",
      keywords: (t.keywords || []).join(", "),
      content: t.content || "",
      faq: t.faq || [],
    };
  }
  return {
    id: row.id,
    slug: row.slug,
    city: row.city || "",
    region: row.region || "",
    category: row.category || CATEGORIES[0],
    status: row.status,
    featured: row.featured || false,
    hero_image_url: row.hero_image_url || "",
    hero_image_alt: row.hero_image_alt || "",
    canonical_url: row.canonical_url || "",
    gallery: row.gallery || [],
    translations,
  };
}

function nameFor(row) {
  const t = (row.translations || []).find((tr) => tr.language === DEFAULT_LANG) || (row.translations || [])[0];
  return t?.name || row.slug;
}

const PAGE_SIZE = 50;

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLang, setActiveLang] = useState(DEFAULT_LANG);
  const initialFormRef = useRef(null);

  const load = () => {
    setLoading(true);
    placesApi.list({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(({ rows, count }) => { setPlaces(rows); setTotalCount(count); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, page]);
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const runSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openNew = () => { const f = emptyForm(); setForm(f); initialFormRef.current = JSON.stringify(f); setHeroFile(null); setGalleryFiles([]); setActiveLang(DEFAULT_LANG); setError(""); };
  const openEdit = (row) => { const f = rowToForm(row); setForm(f); initialFormRef.current = JSON.stringify(f); setHeroFile(null); setGalleryFiles([]); setActiveLang(DEFAULT_LANG); setError(""); };
  const closeFormSilently = () => { setForm(null); initialFormRef.current = null; };
  const closeForm = () => {
    const isDirty = form && (JSON.stringify(form) !== initialFormRef.current || heroFile || galleryFiles.length > 0);
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    closeFormSilently();
  };

  const setTranslationField = (lang, field, value) => {
    setForm((f) => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: value } } }));
  };

  const addFaqRow = (lang) => {
    setForm((f) => ({
      ...f,
      translations: { ...f.translations, [lang]: { ...f.translations[lang], faq: [...f.translations[lang].faq, { question: "", answer: "" }] } },
    }));
  };
  const updateFaqRow = (lang, index, field, value) => {
    setForm((f) => {
      const faq = f.translations[lang].faq.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      return { ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], faq } } };
    });
  };
  const removeFaqRow = (lang, index) => {
    setForm((f) => {
      const faq = f.translations[lang].faq.filter((_, i) => i !== index);
      return { ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], faq } } };
    });
  };

  // Removes an already-uploaded gallery photo (as opposed to `galleryFiles`,
  // which are new files queued for upload on Save) — was previously only
  // possible to add to the gallery, never to take a photo back out.
  const removeGalleryImage = (index) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }));
  };

  // Routes an accepted AI suggestion into the right piece of form state.
  // Nothing here saves to the database — it only updates local form fields,
  // same as if the admin had typed it themselves.
  const handleAiInsert = (fieldId, text) => {
    if (fieldId === "faq") {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setForm((f) => ({
            ...f,
            translations: { ...f.translations, [activeLang]: { ...f.translations[activeLang], faq: [...f.translations[activeLang].faq, ...parsed] } },
          }));
        }
      } catch {
        setError("Could not parse the generated FAQ — try regenerating.");
      }
      return;
    }
    if (fieldId === "hero_image_alt") {
      setForm((f) => ({ ...f, hero_image_alt: text }));
      return;
    }
    setTranslationField(activeLang, fieldId, text);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    if (!form.translations[DEFAULT_LANG].name.trim()) {
      setError(`Name is required (at least in ${DEFAULT_LANG.toUpperCase()}).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let heroUrl = form.hero_image_url;
      if (heroFile) ({ url: heroUrl } = await uploadCmsImage(heroFile, "places"));

      let gallery = form.gallery;
      if (galleryFiles.length > 0) {
        const uploaded = await Promise.all(galleryFiles.map((f) => uploadCmsImage(f, "places")));
        gallery = [...gallery, ...uploaded.map((u) => u.url)];
      }

      const translations = Object.fromEntries(
        Object.entries(form.translations).map(([lang, t]) => [lang, {
          name: t.name,
          seo_title: t.seo_title || null,
          meta_description: t.meta_description || null,
          keywords: t.keywords ? t.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
          content: t.content,
          faq: t.faq.filter((row) => row.question || row.answer),
        }]),
      );

      await placesApi.save({
        id: form.id,
        parent: {
          slug: form.slug,
          city: form.city || null,
          region: form.region || null,
          category: form.category,
          status: form.status,
          featured: form.featured,
          hero_image_url: heroUrl || null,
          hero_image_alt: form.hero_image_alt || null,
          canonical_url: form.canonical_url || null,
          gallery,
        },
        translations,
      });
      closeFormSilently();
      setSuccess(`"${form.translations[DEFAULT_LANG].name || form.slug}" saved.`);
      load();
    } catch (err) {
      setError(err.message || "Failed to save place");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this place?")) return;
    await placesApi.remove(id);
    load();
  };

  const toggleStatus = async (row) => {
    await placesApi.setStatus(row.id, row.status === "published" ? "draft" : "published");
    load();
  };

  return (
    <div>
      <style>{CONTENT_ADMIN_STYLES}</style>

      <div className="ca-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Places</h1>
        <button className="ca-new-btn" onClick={openNew}>+ New place</button>
      </div>
      <p className="ca-subtitle">Points of interest — attractions, restaurants and more, tied to a city and category.</p>

      <form className="ca-toolbar" onSubmit={runSearch}>
        <input
          placeholder="Search by slug, city, region or category..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <button type="submit" className="ca-btn-edit" style={{ border: "1px solid var(--border)" }}>Search</button>
      </form>

      {success && <p style={{ color: "var(--izigo-green)", fontSize: 13, marginTop: -12, marginBottom: 16, fontWeight: 700 }}>{success}</p>}

      {loading ? <p>Loading...</p> : places.length === 0 ? (
        <div className="ca-empty">
          <MapPin size={32} />
          <h2>{search ? "No places match that search" : "No places yet"}</h2>
          <p>{search ? "Try a different search term." : "Add attractions, restaurants and points of interest to build out each destination."}</p>
          {!search && <button className="ca-new-btn" onClick={openNew}>+ Add place</button>}
        </div>
      ) : (
        <>
          <div className="ca-list">
            {places.map((p) => (
              <div className="ca-card" key={p.id}>
                <div className="ca-thumb" style={p.hero_image_url ? { backgroundImage: `url("${p.hero_image_url}")` } : undefined}>
                  {!p.hero_image_url && <ImageIcon size={18} />}
                </div>
                <div className="ca-info">
                  <div className="ca-name">
                    {nameFor(p)}
                    <span className={`ca-pill ${p.status}`}>{p.status}</span>
                  </div>
                  <div className="ca-meta">/{p.slug} · {p.city || "no city"} · {p.category}{p.region ? ` · ${p.region}` : ""}</div>
                </div>
                <div className="ca-actions">
                  <button className="ca-btn-publish" onClick={() => toggleStatus(p)}>{p.status === "published" ? "Unpublish" : "Publish"}</button>
                  <button className="ca-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                  <button className="ca-btn-remove" onClick={() => remove(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="ca-toolbar" style={{ justifyContent: "center", marginTop: 18, marginBottom: 0 }}>
              <button type="button" className="ca-btn-edit" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Page {page + 1} of {pageCount} ({totalCount} total)</span>
              <button type="button" className="ca-btn-edit" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {form && (
        <div className="ca-modal-overlay" onClick={closeForm}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ca-modal-close" onClick={closeForm}><X size={14} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{form.id ? "Edit place" : "New place"}</h2>
            <form onSubmit={save}>
              <div className="ca-row">
                <div className="ca-field">
                  <label>Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.trim().toLowerCase() })} placeholder="e.g. flame-towers" required />
                </div>
                <div className="ca-field">
                  <label>City</label>
                  <input
                    list="place-city-options"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Baku, or any future destination"
                  />
                  <datalist id="place-city-options">
                    {ALL_DESTINATIONS.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div className="ca-row">
                <div className="ca-field">
                  <label>Region</label>
                  <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
                <div className="ca-field">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="ca-row">
                <div className="ca-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="ca-field">
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} style={{ width: "auto" }} />
                    Featured (shown in homepage "Discover Azerbaijan")
                  </label>
                </div>
              </div>

              <label className="ca-upload">
                <ImageIcon size={16} />
                {heroFile ? heroFile.name : form.hero_image_url ? "Hero image set — choose a file to replace" : "Hero image"}
                <input type="file" accept="image/*" hidden onChange={(e) => setHeroFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{ height: 10 }} />
              {form.gallery.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {form.gallery.map((url, i) => (
                    <div key={url} style={{ position: "relative", width: 72, height: 72 }}>
                      <img src={url} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="ca-upload">
                <ImageIcon size={16} />
                {galleryFiles.length > 0 ? `${galleryFiles.length} new photo(s) selected` : "Add gallery photos"}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))} />
              </label>
              <div className="ca-field" style={{ marginTop: 10 }}>
                <label>Hero image ALT text</label>
                <input value={form.hero_image_alt} onChange={(e) => setForm({ ...form, hero_image_alt: e.target.value })} maxLength={125} />
              </div>
              <div className="ca-field">
                <label>Canonical URL (optional)</label>
                <input type="url" value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://izigo.az/places/flame-towers" />
              </div>
              <div style={{ height: 4 }} />

              <div className="ca-lang-tabs">
                {LANGUAGES.map((l) => (
                  <button type="button" key={l.code} className={`ca-lang-tab${activeLang === l.code ? " active" : ""}`} onClick={() => setActiveLang(l.code)}>
                    {l.label}
                  </button>
                ))}
              </div>

              <AiAssistPanel
                entityLabel="place"
                name={form.translations[activeLang].name || form.slug}
                city={form.city}
                category={form.category}
                language={activeLang}
                fields={AI_FIELDS}
                onInsert={handleAiInsert}
              />

              {(() => {
                const t = form.translations[activeLang];
                const setF = (field) => (e) => setTranslationField(activeLang, field, e.target.value);
                return (
                  <>
                    <div className="ca-field">
                      <label>Name{activeLang === DEFAULT_LANG ? " *" : ""}</label>
                      <input value={t.name} onChange={setF("name")} maxLength={200} required={activeLang === DEFAULT_LANG} />
                    </div>
                    <div className="ca-field">
                      <label>SEO Title <span style={{ fontWeight: 400, color: "var(--text-soft)" }}>({t.seo_title.length}/60)</span></label>
                      <input value={t.seo_title} onChange={setF("seo_title")} maxLength={60} />
                    </div>
                    <div className="ca-field">
                      <label>Meta Description <span style={{ fontWeight: 400, color: "var(--text-soft)" }}>({t.meta_description.length}/160)</span></label>
                      <textarea value={t.meta_description} onChange={setF("meta_description")} maxLength={160} />
                    </div>
                    <div className="ca-field">
                      <label>Keywords (comma-separated)</label>
                      <input value={t.keywords} onChange={setF("keywords")} />
                    </div>
                    <div className="ca-field">
                      <label>Content</label>
                      <textarea style={{ minHeight: 140 }} value={t.content} onChange={setF("content")} />
                    </div>

                    <div className="ca-field">
                      <label>FAQ</label>
                      {t.faq.map((row, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <input placeholder="Question" value={row.question} onChange={(e) => updateFaqRow(activeLang, i, "question", e.target.value)} style={{ marginBottom: 6, width: "100%" }} />
                            <textarea placeholder="Answer" value={row.answer} onChange={(e) => updateFaqRow(activeLang, i, "answer", e.target.value)} style={{ width: "100%" }} />
                          </div>
                          <button type="button" className="ca-btn-remove" onClick={() => removeFaqRow(activeLang, i)}><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button type="button" className="ca-btn-edit" onClick={() => addFaqRow(activeLang)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Plus size={13} /> Add FAQ item
                      </button>
                    </div>
                  </>
                );
              })()}

              {error && <p style={{ color: "#E0553F", fontSize: 13, marginTop: 4 }}>{error}</p>}
              <button type="submit" className="ca-save-btn" disabled={saving}>{saving ? "..." : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
