import { useEffect, useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { LANGUAGES } from "../../../i18n/translations";
import { staticPagesApi } from "../../../lib/cms";
import { CONTENT_ADMIN_STYLES } from "./contentAdminStyles";

const DEFAULT_LANG = LANGUAGES[0].code;
const EMPTY_TRANSLATION = { title: "", seo_title: "", meta_description: "", content: "" };

const PAGE_LABELS = {
  about: "About",
  privacy: "Privacy",
  terms: "Terms",
  contact: "Contact",
  "become-a-host": "Become a Host",
};

function rowToForm(row) {
  const translations = Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION }]));
  for (const t of row.translations || []) {
    translations[t.language] = {
      title: t.title || "",
      seo_title: t.seo_title || "",
      meta_description: t.meta_description || "",
      content: t.content || "",
    };
  }
  return { id: row.id, slug: row.slug, status: row.status, translations };
}

export default function StaticPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLang, setActiveLang] = useState(DEFAULT_LANG);
  const initialFormRef = useRef(null);

  const load = () => {
    setLoading(true);
    staticPagesApi.list().then(({ rows }) => setPages(rows)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const openEdit = (row) => { const f = rowToForm(row); setForm(f); initialFormRef.current = JSON.stringify(f); setActiveLang(DEFAULT_LANG); setError(""); };
  const closeFormSilently = () => { setForm(null); initialFormRef.current = null; };
  const closeForm = () => {
    const isDirty = form && JSON.stringify(form) !== initialFormRef.current;
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    closeFormSilently();
  };

  const setTranslationField = (lang, field, value) => {
    setForm((f) => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: value } } }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await staticPagesApi.save({
        id: form.id,
        parent: { status: form.status },
        translations: Object.fromEntries(
          Object.entries(form.translations).map(([lang, t]) => [lang, { ...t, seo_title: t.seo_title || null, meta_description: t.meta_description || null }]),
        ),
      });
      closeFormSilently();
      setSuccess(`${PAGE_LABELS[form.slug] || form.slug} saved.`);
      load();
    } catch (err) {
      setError(err.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    await staticPagesApi.setStatus(row.id, row.status === "published" ? "draft" : "published");
    load();
  };

  return (
    <div>
      <style>{CONTENT_ADMIN_STYLES}</style>

      <div className="ca-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Static Pages</h1>
      </div>
      <p className="ca-subtitle">A fixed set of legal/company pages — edit their content per language, no add/delete needed.</p>

      {success && <p style={{ color: "var(--izigo-green)", fontSize: 13, marginBottom: 16, fontWeight: 700 }}>{success}</p>}

      {loading ? <p>Loading...</p> : (
        <div className="ca-list">
          {pages.map((p) => (
            <div className="ca-card" key={p.id}>
              <div className="ca-thumb"><FileText size={18} /></div>
              <div className="ca-info">
                <div className="ca-name">
                  {PAGE_LABELS[p.slug] || p.slug}
                  <span className={`ca-pill ${p.status}`}>{p.status}</span>
                </div>
                <div className="ca-meta">/{p.slug}</div>
              </div>
              <div className="ca-actions">
                <button className="ca-btn-publish" onClick={() => toggleStatus(p)}>{p.status === "published" ? "Unpublish" : "Publish"}</button>
                <button className="ca-btn-edit" onClick={() => openEdit(p)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="ca-modal-overlay" onClick={closeForm}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ca-modal-close" onClick={closeForm}><X size={14} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Edit {PAGE_LABELS[form.slug] || form.slug}</h2>
            <form onSubmit={save}>
              <div className="ca-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="ca-lang-tabs">
                {LANGUAGES.map((l) => (
                  <button type="button" key={l.code} className={`ca-lang-tab${activeLang === l.code ? " active" : ""}`} onClick={() => setActiveLang(l.code)}>
                    {l.label}
                  </button>
                ))}
              </div>

              {(() => {
                const t = form.translations[activeLang];
                const setF = (field) => (e) => setTranslationField(activeLang, field, e.target.value);
                return (
                  <>
                    <div className="ca-field">
                      <label>Title</label>
                      <input value={t.title} onChange={setF("title")} />
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
                      <label>Content</label>
                      <textarea style={{ minHeight: 200 }} value={t.content} onChange={setF("content")} />
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
