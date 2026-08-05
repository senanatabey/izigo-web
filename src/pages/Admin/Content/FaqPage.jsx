import { useEffect, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { LANGUAGES } from "../../../i18n/translations";
import { faqsApi } from "../../../lib/cms";
import { CONTENT_ADMIN_STYLES } from "./contentAdminStyles";

const DEFAULT_LANG = LANGUAGES[0].code;
const EMPTY_TRANSLATION = { question: "", answer: "" };

function emptyForm() {
  return {
    id: null,
    category: "general",
    sort_order: 0,
    status: "published",
    translations: Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION }])),
  };
}

function rowToForm(row) {
  const translations = Object.fromEntries(LANGUAGES.map((l) => [l.code, { ...EMPTY_TRANSLATION }]));
  for (const t of row.translations || []) {
    translations[t.language] = { question: t.question || "", answer: t.answer || "" };
  }
  return { id: row.id, category: row.category, sort_order: row.sort_order, status: row.status, translations };
}

function questionFor(row) {
  const t = (row.translations || []).find((tr) => tr.language === DEFAULT_LANG) || (row.translations || [])[0];
  return t?.question || "(no question)";
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLang, setActiveLang] = useState(DEFAULT_LANG);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const initialFormRef = useRef(null);

  const load = () => {
    setLoading(true);
    faqsApi.list({ limit: 200 }).then(({ rows }) => setFaqs(rows)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const categories = ["all", ...new Set(faqs.map((f) => f.category))];
  const filtered = categoryFilter === "all" ? faqs : faqs.filter((f) => f.category === categoryFilter);

  const openNew = () => { const f = emptyForm(); setForm(f); initialFormRef.current = JSON.stringify(f); setActiveLang(DEFAULT_LANG); setError(""); };
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
    if (!form.category.trim()) { setError("Category is required."); return; }
    if (!form.translations[DEFAULT_LANG].question.trim()) {
      setError(`Question is required (at least in ${DEFAULT_LANG.toUpperCase()}).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await faqsApi.save({
        id: form.id,
        parent: { category: form.category, sort_order: Number(form.sort_order) || 0, status: form.status },
        translations: form.translations,
      });
      closeFormSilently();
      setSuccess("FAQ saved.");
      load();
    } catch (err) {
      setError(err.message || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this FAQ entry?")) return;
    await faqsApi.remove(id);
    load();
  };

  const toggleStatus = async (row) => {
    await faqsApi.setStatus(row.id, row.status === "published" ? "draft" : "published");
    load();
  };

  return (
    <div>
      <style>{CONTENT_ADMIN_STYLES}</style>

      <div className="ca-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>FAQ</h1>
        <button className="ca-new-btn" onClick={openNew}>+ New FAQ</button>
      </div>
      <p className="ca-subtitle">Grouped by category — used later to power FAQ sections across the site.</p>

      {success && <p style={{ color: "var(--izigo-green)", fontSize: 13, marginBottom: 16, fontWeight: 700 }}>{success}</p>}

      {faqs.length > 0 && (
        <div className="ca-toolbar">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
        </div>
      )}

      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <div className="ca-empty">
          <HelpCircle size={32} />
          <h2>No FAQ entries yet</h2>
          <p>Add common questions and answers, grouped by category, per language.</p>
          <button className="ca-new-btn" onClick={openNew}>+ Add FAQ</button>
        </div>
      ) : (
        <div className="ca-list">
          {filtered.map((f) => (
            <div className="ca-card" key={f.id}>
              <div className="ca-info">
                <div className="ca-name">
                  {questionFor(f)}
                  <span className={`ca-pill ${f.status}`}>{f.status}</span>
                </div>
                <div className="ca-meta">{f.category} · order {f.sort_order}</div>
              </div>
              <div className="ca-actions">
                <button className="ca-btn-publish" onClick={() => toggleStatus(f)}>{f.status === "published" ? "Unpublish" : "Publish"}</button>
                <button className="ca-btn-edit" onClick={() => openEdit(f)}>Edit</button>
                <button className="ca-btn-remove" onClick={() => remove(f.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="ca-modal-overlay" onClick={closeForm}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ca-modal-close" onClick={closeForm}><X size={14} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{form.id ? "Edit FAQ" : "New FAQ"}</h2>
            <form onSubmit={save}>
              <div className="ca-row">
                <div className="ca-field">
                  <label>Category *</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. booking, payments" required />
                </div>
                <div className="ca-field">
                  <label>Sort order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>
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
                return (
                  <>
                    <div className="ca-field">
                      <label>Question{activeLang === DEFAULT_LANG ? " *" : ""}</label>
                      <input value={t.question} onChange={(e) => setTranslationField(activeLang, "question", e.target.value)} required={activeLang === DEFAULT_LANG} />
                    </div>
                    <div className="ca-field">
                      <label>Answer</label>
                      <textarea style={{ minHeight: 100 }} value={t.answer} onChange={(e) => setTranslationField(activeLang, "answer", e.target.value)} />
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
