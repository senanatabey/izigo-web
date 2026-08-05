import { useEffect, useState } from "react";
import { Home as HomeIcon } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useCurrency } from "../../i18n/CurrencyContext";
import AdminEmptyState from "../../components/AdminEmptyState";

const STATUSES = ["all", "pending", "approved", "rejected"];

export default function ListingsPage() {
  const { formatPrice } = useCurrency();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    let query = supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    query.then(({ data }) => setListings(data || [])).finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const remove = async (id) => {
    if (!window.confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;
    await supabase.from("listings").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <style>{`
        .admin-listings-filters { display: flex; gap: 8px; margin-bottom: 20px; }
        .admin-listings-filters button {
          border: 1px solid var(--border); background: #fff; border-radius: 999px; padding: 7px 16px;
          font-size: 13px; font-weight: 700; cursor: pointer; text-transform: capitalize;
        }
        .admin-listings-filters button.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .admin-listings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .admin-listings-table th, .admin-listings-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .admin-listings-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .status-pill.approved { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .admin-listings-table button.delete { border: none; background: none; color: #E0553F; font-weight: 700; cursor: pointer; font-size: 12.5px; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Listings</h1>
      <div className="admin-listings-filters">
        {STATUSES.map((s) => (
          <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>
      {loading ? <p>Loading...</p> : listings.length === 0 ? (
        <AdminEmptyState icon={HomeIcon} message="No listings yet." actionLabel="Add listing" actionTo="/add-listing" />
      ) : (
        <table className="admin-listings-table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>City</th><th>Price</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id}>
                <td>{l.title?.en || l.title?.az}</td>
                <td>{l.category}</td>
                <td>{l.city}</td>
                <td>{formatPrice(l.price)}</td>
                <td><span className={`status-pill ${l.status}`}>{l.status}</span></td>
                <td><button className="delete" onClick={() => remove(l.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
