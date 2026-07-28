import { useEffect, useState } from "react";
import { MapPin, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { supabase } from "../../lib/supabaseClient";
import { toneForId } from "../../lib/listings";
import SaveHeart from "../../components/SaveHeart";

const CATEGORY_TO_PATH = { villa: "villas", car: "cars", event: "events" };

function toPath(row) {
  if (row.category === "transfer") {
    return row.details?.type === "tour" ? `/experiences/${row.id}` : `/transfers/${row.id}`;
  }
  return `/${CATEGORY_TO_PATH[row.category]}/${row.id}`;
}

function saveType(row) {
  if (row.category === "transfer") return row.details?.type === "tour" ? "experience" : "transfer";
  return row.category;
}

export default function DealsPage() {
  const { t, language } = useLanguage();
  const [dealItems, setDealItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .not("discount", "is", null)
      .then(({ data }) => setDealItems((data || []).map((row) => ({
        id: row.id,
        city: row.city,
        tone: toneForId(row.id),
        title: row.title,
        price: row.price,
        discount: row.discount,
        saveType: saveType(row),
        to: toPath(row),
      }))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="deals-page">
      <style>{`
        .deals-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .deals-page .dp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .deals-page .dp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .deals-page .dp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .deals-page .dp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .deals-page .dp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .deals-page .dp-thumb { aspect-ratio: 4 / 3; position: relative; }
        .deals-page .dp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .deals-page .dp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .deals-page .dp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .deals-page .dp-discount {
          position: absolute; top: 10px; left: 10px; display: inline-flex; align-items: center; gap: 4px;
          background: var(--izigo-orange); color: #fff; font-size: 12px; font-weight: 800;
          padding: 5px 10px; border-radius: 999px;
        }
        .deals-page .dp-body { padding: 16px; }
        .deals-page .dp-city { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; margin-bottom: 5px; color: var(--izigo-orange); }
        .deals-page .dp-title { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.35; min-height: 36px; }
        .deals-page .dp-price-row { display: flex; align-items: baseline; gap: 8px; }
        .deals-page .dp-price-new { font-size: 15px; font-weight: 800; color: var(--text); }
        .deals-page .dp-price-old { font-size: 12.5px; font-weight: 600; color: #E0553F !important; text-decoration: line-through; }

        .deals-page .dp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .deals-page .dp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .deals-page { padding: 32px 5vw 56px; }
          .deals-page .dp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dp-head">
        <h1>{t("dealsPage.heading")}</h1>
        <p>{t("dealsPage.subtitle")}</p>
      </div>

      {loading ? null : dealItems.length === 0 ? (
        <div className="dp-empty">{t("dealsPage.noResults")}</div>
      ) : (
        <div className="dp-grid">
          {dealItems.map((item) => {
            const discounted = Math.round(item.price * (1 - item.discount / 100));
            return (
              <Link to={item.to} className="dp-card" key={`${item.saveType}-${item.id}`}>
                <SaveHeart type={item.saveType} id={item.id} />
                <div className={`dp-thumb ${item.tone}`}>
                  <span className="dp-discount"><Percent size={11} />-{item.discount}%</span>
                </div>
                <div className="dp-body">
                  <div className="dp-city"><MapPin size={12} />{item.city}</div>
                  <div className="dp-title">{item.title[language] || item.title.en}</div>
                  <div className="dp-price-row">
                    <span className="dp-price-new">{discounted} AZN</span>
                    <span className="dp-price-old">{item.price} AZN</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
