import { useEffect, useState } from "react";
import { Image as ImageIcon, X, Upload, Trash2 } from "lucide-react";
import { listMedia, uploadMedia, updateMedia, deleteMedia, listMediaFolders } from "../../../lib/cms";
import { CONTENT_ADMIN_STYLES } from "./contentAdminStyles";

const SORT_OPTIONS = [
  { value: "newest", label: "Əvvəlcə ən yeni" },
  { value: "oldest", label: "Əvvəlcə ən köhnə" },
  { value: "name", label: "Ad (A-Z)" },
  { value: "size", label: "Əvvəlcə ən böyük" },
];

export default function MediaLibraryPage() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderFilter, setFolderFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("general");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      listMedia({ folder: folderFilter || undefined, search: search || undefined, sort }),
      listMediaFolders(),
    ]).then(([mediaItems, folderList]) => {
      setItems(mediaItems);
      setFolders(folderList);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [folderFilter, sort]);
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const runSearch = (e) => { e.preventDefault(); load(); };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const failures = [];
    let uploaded = 0;
    for (const file of files) {
      try {
        await uploadMedia(file, { folder: uploadFolder || "general" });
        uploaded += 1;
      } catch (err) {
        failures.push(err.message || `"${file.name}" yüklənə bilmədi`);
      }
    }
    setUploading(false);
    e.target.value = "";
    if (uploaded > 0) {
      setSuccess(`${uploaded} fayl yükləndi.`);
      load();
    }
    if (failures.length > 0) setError(failures.join(" "));
  };

  const saveDetails = async () => {
    await updateMedia(selected.id, {
      alt_text: selected.alt_text || "",
      caption: selected.caption || "",
      tags: selected.tagsInput ? selected.tagsInput.split(",").map((t) => t.trim()).filter(Boolean) : [],
      folder: selected.folder || "general",
    });
    setSelected(null);
    setSuccess("Media məlumatları yadda saxlanıldı.");
    load();
  };

  const remove = async (item) => {
    if (!window.confirm(`"${item.filename}" silinsin?`)) return;
    await deleteMedia(item);
    if (selected?.id === item.id) setSelected(null);
    load();
  };

  return (
    <div>
      <style>{CONTENT_ADMIN_STYLES}</style>
      <style>{`
        .ml-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .ml-item { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; background: var(--bg); }
        .ml-item:hover { border-color: var(--izigo-green); }
        .ml-item-thumb { aspect-ratio: 1; background: var(--bg-soft); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: var(--text-soft); }
        .ml-item-info { padding: 8px 10px; }
        .ml-item-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ml-item-folder { font-size: 11px; color: var(--text-soft); }
        .ml-upload-btn { display: inline-flex; align-items: center; gap: 6px; }
      `}</style>

      <div className="ca-head">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Media Kitabxanası</h1>
        <label className="ca-new-btn ml-upload-btn">
          <Upload size={14} />{uploading ? "Yüklənir..." : "Yüklə"}
          <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={handleUpload} />
        </label>
      </div>
      <p className="ca-subtitle">Travel Guides, Places və digər kontentlərdə istifadə olunan ortaq şəkil kitabxanası.</p>

      <form className="ca-toolbar" onSubmit={runSearch}>
        <input placeholder="Yükləmə qovluğu (məs. travel-guides)" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} style={{ width: 200 }} />
        <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
          <option value="">Bütün qovluqlar</option>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input placeholder="Fayl adı, alt mətn, izahat üzrə axtar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <button type="submit" className="ca-btn-edit" style={{ border: "1px solid var(--border)" }}>Axtar</button>
      </form>

      {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      {success && <p style={{ color: "var(--izigo-green)", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>{success}</p>}

      {loading ? <p>Yüklənir...</p> : items.length === 0 ? (
        <div className="ca-empty">
          <ImageIcon size={32} />
          <h2>Hələ media yoxdur</h2>
          <p>Travel guides, places və digər kontentlərdə təkrar istifadə etmək üçün burada şəkil yükləyin.</p>
        </div>
      ) : (
        <div className="ml-grid">
          {items.map((item) => (
            <div className="ml-item" key={item.id} onClick={() => setSelected({ ...item, tagsInput: (item.tags || []).join(", ") })}>
              <div className="ml-item-thumb" style={{ backgroundImage: `url("${item.url}")` }} />
              <div className="ml-item-info">
                <div className="ml-item-name">{item.filename}</div>
                <div className="ml-item-folder">{item.folder}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="ca-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ca-modal-close" onClick={() => setSelected(null)}><X size={14} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>{selected.filename}</h2>
            <img src={selected.url} alt={selected.alt_text || ""} loading="lazy" decoding="async" style={{ width: "100%", borderRadius: 10, marginBottom: 16, maxHeight: 260, objectFit: "cover" }} />
            <div className="ca-field">
              <label>Qovluq</label>
              <input value={selected.folder} onChange={(e) => setSelected({ ...selected, folder: e.target.value })} />
            </div>
            <div className="ca-field">
              <label>Alt mətn</label>
              <input value={selected.alt_text || ""} onChange={(e) => setSelected({ ...selected, alt_text: e.target.value })} />
            </div>
            <div className="ca-field">
              <label>İzahat</label>
              <input value={selected.caption || ""} onChange={(e) => setSelected({ ...selected, caption: e.target.value })} />
            </div>
            <div className="ca-field">
              <label>Etiketlər (vergüllə ayrılmış)</label>
              <input value={selected.tagsInput} onChange={(e) => setSelected({ ...selected, tagsInput: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="ca-save-btn" onClick={saveDetails}>Yadda saxla</button>
              <button type="button" className="ca-btn-remove" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={() => remove(selected)}>
                <Trash2 size={14} /> Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
