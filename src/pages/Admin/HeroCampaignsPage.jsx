import { useEffect, useState } from "react";
import { Image as ImageIcon, X, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { fetchSiteSettings, updateDefaultHeroImages } from "../../lib/heroCampaigns";
import { compressImage } from "../../lib/imageOptimize";

const STATUSES = ["draft", "scheduled", "published", "archived"];

// Storage keys must stay ASCII-safe — the original filename (accents, spaces,
// parentheses) can otherwise be rejected by Supabase Storage as an "Invalid key".
function safeExt(file) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return match ? match[1].toLowerCase() : "jpg";
}

const EMPTY_FORM = {
  id: null,
  name: "",
  status: "draft",
  title_en: "",
  title_az: "",
  subtitle_en: "",
  subtitle_az: "",
  start_date: "",
  end_date: "",
};

export default function HeroCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState(null);
  const [defaultDesktopFile, setDefaultDesktopFile] = useState(null);
  const [defaultMobileFile, setDefaultMobileFile] = useState(null);
  const [savingDefault, setSavingDefault] = useState(false);

  const loadSettings = () => fetchSiteSettings().then(setSettings);

  const uploadDefaultImage = async (file) => {
    const optimized = await compressImage(file);
    const path = `default-${crypto.randomUUID()}.${safeExt(optimized)}`;
    const { error: uploadError } = await supabase.storage.from("hero-images").upload(path, optimized);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("hero-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveDefaultImages = async () => {
    if (!defaultDesktopFile && !defaultMobileFile) return;
    setSavingDefault(true);
    try {
      const desktopUrl = defaultDesktopFile ? await uploadDefaultImage(defaultDesktopFile) : null;
      const mobileUrl = defaultMobileFile ? await uploadDefaultImage(defaultMobileFile) : null;
      await updateDefaultHeroImages({ desktopUrl, mobileUrl });
      setDefaultDesktopFile(null);
      setDefaultMobileFile(null);
      loadSettings();
    } catch (err) {
      setError(err.message || "Failed to save default hero image");
    } finally {
      setSavingDefault(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const load = () => {
    setLoading(true);
    supabase
      .from("hero_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampaigns(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setDesktopFile(null);
    setMobileFile(null);
    setError("");
  };

  const openEdit = (c) => {
    setForm({ ...c, start_date: c.start_date || "", end_date: c.end_date || "" });
    setDesktopFile(null);
    setMobileFile(null);
    setError("");
  };

  const closeForm = () => setForm(null);

  const uploadImage = async (file) => {
    const optimized = await compressImage(file);
    const path = `${crypto.randomUUID()}.${safeExt(optimized)}`;
    const { error: uploadError } = await supabase.storage.from("hero-images").upload(path, optimized);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("hero-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        status: form.status,
        title_en: form.title_en || "",
        title_az: form.title_az || "",
        subtitle_en: form.subtitle_en || null,
        subtitle_az: form.subtitle_az || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (desktopFile) payload.image_desktop_url = await uploadImage(desktopFile);
      if (mobileFile) payload.image_mobile_url = await uploadImage(mobileFile);

      if (form.id) {
        const { error: updateError } = await supabase.from("hero_campaigns").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("hero_campaigns").insert(payload);
        if (insertError) throw insertError;
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  // One-click publish: if the campaign has a future start date, it goes live
  // automatically on that date (status "scheduled"); otherwise it's live now.
  const publish = async (c) => {
    const isFuture = c.start_date && c.start_date > new Date().toISOString().slice(0, 10);
    await supabase.from("hero_campaigns").update({ status: isFuture ? "scheduled" : "published" }).eq("id", c.id);
    load();
  };

  const setStatus = async (id, status) => {
    await supabase.from("hero_campaigns").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Bu kampaniyanı silmək istədiyinizə əminsiniz?")) return;
    await supabase.from("hero_campaigns").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <style>{`
        .hc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .hc-subtitle { font-size: 13.5px; color: var(--text-soft); margin: 0 0 24px; }
        .hc-new-btn { border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
        .hc-new-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .hc-default-box { border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-bottom: 24px; background: var(--bg-soft); }
        .hc-default-box h2 { font-size: 15px; font-weight: 800; margin: 0 0 4px; }
        .hc-default-box p { font-size: 12.5px; color: var(--text-soft); margin: 0 0 14px; line-height: 1.5; }
        .hc-default-row { display: flex; gap: 16px; align-items: flex-start; }
        .hc-default-thumb {
          width: 110px; height: 74px; border-radius: 10px; background: #fff; background-size: cover; background-position: center;
          border: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-soft);
        }
        .hc-default-uploads { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .hc-list { display: flex; flex-direction: column; gap: 12px; }
        .hc-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; }
        .hc-thumb { width: 64px; height: 44px; border-radius: 8px; background: var(--bg-soft); background-size: cover; background-position: center; flex-shrink: 0; }
        .hc-info { flex: 1; min-width: 0; }
        .hc-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .hc-meta { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
        .hc-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .hc-pill.draft { background: var(--bg-soft); color: var(--text-soft); }
        .hc-pill.scheduled { background: rgba(255,180,0,0.16); color: #B87700; }
        .hc-pill.published { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .hc-pill.archived { background: var(--bg-soft); color: var(--text-soft); }
        .hc-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
        .hc-actions button, .hc-actions select { border: none; border-radius: 8px; padding: 7px 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .btn-publish { background: var(--izigo-green); color: #fff; }
        .btn-edit { background: var(--bg-soft); color: var(--text); }
        .btn-remove { background: none; color: #E0553F; }
        .hc-status-select { background: var(--bg-soft); color: var(--text); font-family: var(--sans); }

        .hc-empty { text-align: center; padding: 60px 20px; border: 1px dashed var(--border); border-radius: 16px; }
        .hc-empty svg { color: var(--izigo-green); margin-bottom: 12px; }
        .hc-empty h2 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
        .hc-empty p { font-size: 13.5px; color: var(--text-soft); max-width: 420px; margin: 0 auto 20px; line-height: 1.6; }

        .hc-modal-overlay { position: fixed; inset: 0; background: rgba(5,22,20,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
        .hc-modal { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; position: relative; }
        .hc-modal-close { position: absolute; top: 16px; right: 16px; border: none; background: var(--bg-soft); border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .hc-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .hc-field label { font-size: 12.5px; font-weight: 700; }
        .hc-field input, .hc-field select, .hc-field textarea {
          border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: var(--sans);
        }
        .hc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .hc-upload { display: flex; align-items: center; gap: 10px; border: 1px dashed var(--border); border-radius: 10px; padding: 12px; cursor: pointer; background: var(--bg-soft); font-size: 12.5px; color: var(--text-soft); }
        .hc-save-btn { width: 100%; background: var(--izigo-orange); color: #fff; border: none; border-radius: 8px; padding: 12px; font-weight: 700; cursor: pointer; margin-top: 6px; }
      `}</style>

      <div className="hc-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Hero campaigns</h1>
        <button className="hc-new-btn" onClick={openNew}>+ New campaign</button>
      </div>
      <p className="hc-subtitle">Change the homepage hero's image and text — the layout always stays the same.</p>

      <div className="hc-default-box">
        <h2>Default hero image</h2>
        <p>Shown whenever no campaign is published. Upload a new image to replace it anytime — no code changes needed.</p>
        <div className="hc-default-row">
          <div className="hc-default-thumb" style={settings?.default_hero_desktop_url ? { backgroundImage: `url("${settings.default_hero_desktop_url}")` } : undefined}>
            {!settings?.default_hero_desktop_url && <ImageIcon size={20} />}
          </div>
          <div className="hc-default-uploads">
            <label className="hc-upload">
              <ImageIcon size={16} />
              {defaultDesktopFile ? defaultDesktopFile.name : "Desktop image (leave empty to keep current)"}
              <input type="file" accept="image/*" hidden onChange={(e) => setDefaultDesktopFile(e.target.files?.[0] || null)} />
            </label>
            <label className="hc-upload">
              <ImageIcon size={16} />
              {defaultMobileFile ? defaultMobileFile.name : "Mobile image (leave empty to keep current)"}
              <input type="file" accept="image/*" hidden onChange={(e) => setDefaultMobileFile(e.target.files?.[0] || null)} />
            </label>
            <button
              type="button"
              className="hc-new-btn"
              disabled={(!defaultDesktopFile && !defaultMobileFile) || savingDefault}
              onClick={saveDefaultImages}
            >
              {savingDefault ? "..." : "Save default image"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="hc-empty">
          <Sparkles size={32} />
          <h2>No hero campaigns yet</h2>
          <p>Upload an image, write a title and subtitle, and publish — the homepage hero updates instantly, without touching any code.</p>
          <button className="hc-new-btn" onClick={openNew}>+ Add new campaign</button>
        </div>
      ) : (
        <div className="hc-list">
          {campaigns.map((c) => (
            <div className="hc-card" key={c.id}>
              <div className="hc-thumb" style={c.image_desktop_url ? { backgroundImage: `url("${c.image_desktop_url}")` } : undefined} />
              <div className="hc-info">
                <div className="hc-name">
                  {c.name}
                  <span className={`hc-pill ${c.status}`}>{c.status}</span>
                </div>
                <div className="hc-meta">
                  {c.start_date || "no start"} → {c.end_date || "no end"}
                </div>
              </div>
              <div className="hc-actions">
                {(c.status === "draft" || c.status === "archived") && (
                  <button className="btn-publish" onClick={() => publish(c)}>Publish</button>
                )}
                {(c.status === "published" || c.status === "scheduled") && (
                  <button className="btn-edit" onClick={() => setStatus(c.id, "archived")}>Unpublish</button>
                )}
                <select className="hc-status-select" value={c.status} onChange={(e) => setStatus(c.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-edit" onClick={() => openEdit(c)}>Edit</button>
                <button className="btn-remove" onClick={() => remove(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="hc-modal-overlay" onClick={closeForm}>
          <div className="hc-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="hc-modal-close" onClick={closeForm}><X size={14} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{form.id ? "Edit campaign" : "New campaign"}</h2>
            <form onSubmit={save}>
              <div className="hc-field">
                <label>Internal name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="hc-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="hc-row">
                <div className="hc-field">
                  <label>Title (EN)</label>
                  <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
                </div>
                <div className="hc-field">
                  <label>Title (AZ)</label>
                  <input value={form.title_az} onChange={(e) => setForm({ ...form, title_az: e.target.value })} />
                </div>
              </div>
              <div className="hc-row">
                <div className="hc-field">
                  <label>Subtitle (EN)</label>
                  <textarea value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} />
                </div>
                <div className="hc-field">
                  <label>Subtitle (AZ)</label>
                  <textarea value={form.subtitle_az} onChange={(e) => setForm({ ...form, subtitle_az: e.target.value })} />
                </div>
              </div>

              <div className="hc-row">
                <div className="hc-field">
                  <label>Start date (optional)</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="hc-field">
                  <label>End date (optional)</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <label className="hc-upload">
                <ImageIcon size={16} />
                {desktopFile ? desktopFile.name : "Desktop image (leave empty to keep current)"}
                <input type="file" accept="image/*" hidden onChange={(e) => setDesktopFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{ height: 10 }} />
              <label className="hc-upload">
                <ImageIcon size={16} />
                {mobileFile ? mobileFile.name : "Mobile image (leave empty to keep current)"}
                <input type="file" accept="image/*" hidden onChange={(e) => setMobileFile(e.target.files?.[0] || null)} />
              </label>

              {error && <p style={{ color: "#E0553F", fontSize: 13, marginTop: 12 }}>{error}</p>}
              <button type="submit" className="hc-save-btn" disabled={saving}>{saving ? "..." : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
