import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { supabase } from "../../lib/supabaseClient";
import { toneForId } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";

const CATEGORY_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", event: "events" };

function toPath(row) {
  return `/${CATEGORY_TO_PATH[row.category]}/${row.id}`;
}

export default function HostProfilePage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [host, setHost] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id, full_name, created_at").eq("id", id).single(),
      supabase.from("listings").select("*").eq("host_id", id).eq("status", "approved").order("created_at", { ascending: false }),
    ]).then(([{ data: p }, { data: l }]) => {
      setHost(p);
      setListings(l || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return null;

  if (!host) {
    return (
      <div className="host-profile-page">
        <style>{`.host-profile-page { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>Host not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="host-profile-page">
      <style>{`
        .host-profile-page { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .hp-head { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .hp-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .hp-name { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
        .hp-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--izigo-green); font-weight: 600; }
        .hp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .hp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .hp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .hp-thumb { aspect-ratio: 4 / 2.8; background-size: cover; background-position: center; }
        .hp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .hp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .hp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .hp-body { padding: 16px; }
        .hp-city { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--izigo-green); margin-bottom: 6px; }
        .hp-title { font-size: 14.5px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .hp-price { font-size: 14px; font-weight: 800; color: var(--text); }
        .hp-empty { color: var(--text-soft); font-size: 14px; }
        @media (max-width: 1024px) { .hp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .hp-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="hp-head">
        <div className="hp-avatar"><ShieldCheck size={28} /></div>
        <div>
          <h1 className="hp-name">{host.full_name || "IZIGO Host"}</h1>
          <div className="hp-badge"><ShieldCheck size={13} />Verified Host</div>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="hp-empty">No published listings yet.</p>
      ) : (
        <div className="hp-grid">
          {listings.map((row) => (
            <Link to={toPath(row)} className="hp-card" key={row.id}>
              <div className={`hp-thumb ${row.images?.[0] ? "" : toneForId(row.id)}`} style={row.images?.[0] ? { backgroundImage: `url("${row.images[0]}")` } : undefined} />
              <div className="hp-body">
                <div className="hp-city"><MapPin size={12} />{cityLabel(row.city, language)}</div>
                <div className="hp-title">{row.title[language] || row.title.en}</div>
                <div className="hp-price">{formatPrice(row.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
