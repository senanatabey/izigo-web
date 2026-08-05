import { useEffect, useRef, useState } from "react";
import { Map, ImageIcon, X, Eye, Plus, Trash2 } from "lucide-react";
import { LANGUAGES } from "../../../i18n/translations";
import { ALL_DESTINATIONS } from "../../../data/azerbaijanDestinations";
import { travelGuidesApi, uploadCmsImage } from "../../../lib/cms";
import { CONTENT_ADMIN_STYLES } from "./contentAdminStyles";
import AiAssistPanel from "./AiAssistPanel";

const DEFAULT_LANG = LANGUAGES[0].code;

const EMPTY_TRANSLATION = { title: "", seo_title: "", meta_description: "", keywords: "", content: "", faq: [] };

const AI_FIELDS = [
  { id: "content", label: "Travel Guide (overview)", promptType: "content" },
  { id: "history", label: "History", promptType: "history" },
  { id: "thingsToDo", label: "Things To Do", promptType: "thingsToDo" },
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
    status: "draft",
    publish_date: "",
    hero_image_url: "",
    hero_image_alt: "",
    canonical_url: "",
    translations: Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION, faq: [] }])),
  };
}

function rowToForm(row) {
  const translations = Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION, faq: [] }]));
  for (const t of row.translations || []) {
    translations[t.language] = {
      title: t.title || "",
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
    status: row.status,
    publish_date: row.publish_date || "",
    hero_image_url: row.hero_image_url || "",
    hero_image_alt: row.hero_image_alt || "",
    canonical_url: row.canonical_url || "",
    translations,
  };
}

function titleFor(row) {
  const t = (row.translations || []).find((tr) => tr.language === DEFAULT_LANG) || (row.translations || [])[0];
  return t?.title || row.slug;
}

const PAGE_SIZE = 50;

export default function TravelGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLang, setActiveLang] = useState(DEFAULT_LANG);
  const initialFormRef = useRef(null);

  const load = () => {
    setLoading(true);
    travelGuidesApi.list({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(({ rows, count }) => { setGuides(rows); setTotalCount(count); })
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

  const openNew = () => { const f = emptyForm(); setForm(f); initialFormRef.current = JSON.stringify(f); setHeroFile(null); setActiveLang(DEFAULT_LANG); setError(""); };
  const openEdit = (row) => { const f = rowToForm(row); setForm(f); initialFormRef.current = JSON.stringify(f); setHeroFile(null); setActiveLang(DEFAULT_LANG); setError(""); };
  const closeFormSilently = () => { setForm(null); initialFormRef.current = null; };
  const closeForm = () => {
    const isDirty = form && (JSON.stringify(form) !== initialFormRef.current || heroFile);
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

  // Routes an accepted AI suggestion into the right piece of form state.
  // Nothing here saves to the database — it only updates local form fields,
  // same as if the admin had typed it themselves.
  const handleAiInsert = (fieldId, text) => {
    if (fieldId === "content" || fieldId === "history" || fieldId === "thingsToDo") {
      const heading = fieldId === "content" ? null : fieldId === "history" ? "History" : "Things To Do";
      const current = form.translations[activeLang].content;
      const block = heading ? `${heading}\n${text}` : text;
      setTranslationField(activeLang, "content", current ? `${current}\n\n${block}` : block);
      return;
    }
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
    if (!form.translations[DEFAULT_LANG].title.trim()) {
      setError(`Title is required (at least in ${DEFAULT_LANG.toUpperCase()}).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let heroUrl = form.hero_image_url;
      if (heroFile) ({ url: heroUrl } = await uploadCmsImage(heroFile, "travel-guides"));

      const translations = Object.fromEntries(
        Object.entries(form.translations).map(([lang, t]) => [lang, {
          title: t.title,
          seo_title: t.seo_title || null,
          meta_description: t.meta_description || null,
          keywords: t.keywords ? t.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
          content: t.content,
          faq: t.faq.filter((row) => row.question || row.answer),
        }]),
      );

      await travelGuidesApi.save({
        id: form.id,
        parent: {
          slug: form.slug,
          city: form.city || null,
          status: form.status,
          publish_date: form.publish_date || null,
          hero_image_url: heroUrl || null,
          hero_image_alt: form.hero_image_alt || null,
          canonical_url: form.canonical_url || null,
        },
        translations,
      });
      closeFormSilently();
      setSuccess(`"${form.translations[DEFAULT_LANG].title || form.slug}" saved.`);
      load();
    } catch (err) {
      setError(err.message || "Failed to save travel guide");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this travel guide?")) return;
    await travelGuidesApi.remove(id);
    load();
  };

  const toggleStatus = async (row) => {
    await travelGuidesApi.setStatus(row.id, row.status === "published" ? "draft" : "published");
    load();
  };

  // Placeholder only, by design — Stage 1 scope is CRUD, not a rendered
  // preview. Shows what URL this guide will occupy once published.
  const preview = (row) => {
    window.alert(`Preview\n\n"${titleFor(row)}"\nWill be published at: /destinations/${row.slug}`);
  };

  return (
    <div>
      <style>{CONTENT_ADMIN_STYLES}</style>

      <div className="ca-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Travel Guides</h1>
        <button className="ca-new-btn" onClick={openNew}>+ New guide</button>
      </div>
      <p className="ca-subtitle">City travel guide articles — SEO content, connected to /destinations/:slug.</p>

      <form className="ca-toolbar" onSubmit={runSearch}>
        <input
          placeholder="Search by slug or city..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <button type="submit" className="ca-btn-edit" style={{ border: "1px solid var(--border)" }}>Search</button>
      </form>

      {success && <p style={{ color: "var(--izigo-green)", fontSize: 13, marginTop: -12, marginBottom: 16, fontWeight: 700 }}>{success}</p>}

      {loading ? <p>Loading...</p> : guides.length === 0 ? (
        <div className="ca-empty">
          <Map size={32} />
          <h2>{search ? "No travel guides match that search" : "No travel guides yet"}</h2>
          <p>{search ? "Try a different search term." : "Create your first destination article — title, SEO metadata, and rich content, per language."}</p>
          {!search && <button className="ca-new-btn" onClick={openNew}>+ Add travel guide</button>}
        </div>
      ) : (
        <>
          <div className="ca-list">
            {guides.map((g) => (
              <div className="ca-card" key={g.id}>
                <div className="ca-thumb" style={g.hero_image_url ? { backgroundImage: `url("${g.hero_image_url}")` } : undefined}>
                  {!g.hero_image_url && <ImageIcon size={18} />}
                </div>
                <div className="ca-info">
                  <div className="ca-name">
                    {titleFor(g)}
                    <span className={`ca-pill ${g.status}`}>{g.status}</span>
                  </div>
                  <div className="ca-meta">/{g.slug} · {g.city || "no city"} · {g.publish_date || "no publish date"}</div>
                </div>
                <div className="ca-actions">
                  <button className="ca-btn-edit" onClick={() => preview(g)}><Eye size={13} /></button>
                  <button className="ca-btn-publish" onClick={() => toggleStatus(g)}>{g.status === "published" ? "Unpublish" : "Publish"}</button>
                  <button className="ca-btn-edit" onClick={() => openEdit(g)}>Edit</button>
                  <button className="ca-btn-remove" onClick={() => remove(g.id)}>Delete</button>
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
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{form.id ? "Edit travel guide" : "New travel guide"}</h2>
            <form onSubmit={save}>
              <div className="ca-row">
                <div className="ca-field">
                  <label>Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.trim().toLowerCase() })} placeholder="e.g. baku" required />
                </div>
                <div className="ca-field">
                  <label>City</label>
                  <input
                    list="tg-city-options"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Baku, or any future destination"
                  />
                  <datalist id="tg-city-options">
                    {ALL_DESTINATIONS.map((c) => <option key={c} value={c} />)}
                  </datalist>
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
                  <label>Publish date</label>
                  <input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} />
                </div>
              </div>
              <label className="ca-upload">
                <ImageIcon size={16} />
                {heroFile ? heroFile.name : form.hero_image_url ? "Hero image set — choose a file to replace" : "Hero image"}
                <input type="file" accept="image/*" hidden onChange={(e) => setHeroFile(e.target.files?.[0] || null)} />
              </label>
              <div className="ca-field" style={{ marginTop: 10 }}>
                <label>Hero image ALT text</label>
                <input value={form.hero_image_alt} onChange={(e) => setForm({ ...form, hero_image_alt: e.target.value })} maxLength={125} />
              </div>
              <div className="ca-field">
                <label>Canonical URL (optional)</label>
                <input type="url" value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://izigo.az/destinations/baku" />
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
                entityLabel="travel guide"
                name={form.translations[activeLang].title || form.slug}
                city={form.city}
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
                      <label>Title{activeLang === DEFAULT_LANG ? " *" : ""}</label>
                      <input value={t.title} onChange={setF("title")} maxLength={200} required={activeLang === DEFAULT_LANG} />
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
                      <input value={t.keywords} onChange={setF("keywords")} placeholder="baku, azerbaijan, travel guide" />
                    </div>
                    <div className="ca-field">
                      <label>Content</label>
                      <textarea style={{ minHeight: 160 }} value={t.content} onChange={setF("content")} />
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
