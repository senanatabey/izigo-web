import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Search, ArrowUpDown, Eye } from "lucide-react";
import { fetchTripRequests, TRIP_STATUSES } from "../../../lib/tripRequests";
import { useCurrency } from "../../../i18n/CurrencyContext";
import AdminEmptyState from "../../../components/AdminEmptyState";

const FILTERS = ["all", ...TRIP_STATUSES];

const STATUS_LABEL = {
  new: "New",
  in_progress: "In Progress",
  offer_sent: "Offer Sent",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SOURCE_LABEL = {
  plan_my_trip: "Plan My Trip",
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
};

function tripDates(r) {
  if (r.check_in && r.check_out) return `${r.check_in} → ${r.check_out}`;
  if (r.trip_length_days) return `${r.trip_length_days} days (dates TBD)`;
  return "—";
}

export default function TripRequestsListPage() {
  const { formatPrice } = useCurrency();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const load = () => {
    setLoading(true);
    fetchTripRequests(statusFilter)
      .then(setRequests)
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = !q
      ? requests
      : requests.filter((r) =>
          [r.guest_name, r.whatsapp, r.city, r.country, r.request_number]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        );
    if (sortOrder === "oldest") rows = [...rows].reverse();
    return rows;
  }, [requests, search, sortOrder]);

  return (
    <div>
      <style>{`
        .trip-requests-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .trip-requests-search {
          display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 10px;
          padding: 8px 12px; flex: 1; min-width: 220px; max-width: 320px;
        }
        .trip-requests-search input { border: none; outline: none; font-size: 13.5px; width: 100%; }
        .trip-requests-sort {
          display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: #fff;
          border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .trip-requests-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .trip-requests-filters button {
          border: 1px solid var(--border); background: #fff; border-radius: 999px; padding: 7px 16px;
          font-size: 13px; font-weight: 700; cursor: pointer; text-transform: capitalize;
        }
        .trip-requests-filters button.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .trip-requests-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .trip-requests-table th, .trip-requests-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .trip-requests-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .trip-requests-table tbody tr:hover { background: var(--bg-soft); }
        .trip-request-id { font-family: monospace; font-size: 12px; color: var(--text-soft); }
        .trip-status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
        .trip-status-pill.new { background: rgba(0,150,255,0.14); color: #0A6FBD; }
        .trip-status-pill.in_progress { background: rgba(255,180,0,0.16); color: #B87700; }
        .trip-status-pill.offer_sent { background: rgba(148,86,222,0.14); color: #7B3FE0; }
        .trip-status-pill.confirmed { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .trip-status-pill.completed { background: rgba(0,0,0,0.08); color: var(--text-soft); }
        .trip-status-pill.cancelled { background: rgba(224,85,63,0.14); color: #E0553F; }
        .trip-view-btn {
          display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--border); background: #fff;
          border-radius: 8px; padding: 6px 12px; font-size: 12.5px; font-weight: 700; color: var(--text); text-decoration: none;
        }
        .trip-view-btn:hover { background: var(--bg-soft); }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Travel Concierge — Trip Requests</h1>

      <div className="trip-requests-toolbar">
        <div className="trip-requests-search">
          <Search size={14} color="var(--text-soft)" />
          <input
            placeholder="Search by guest, WhatsApp, city, country or request number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="trip-requests-sort"
          onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
        >
          <ArrowUpDown size={14} />{sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      <div className="trip-requests-filters">
        {FILTERS.map((s) => (
          <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : visible.length === 0 ? (
        <AdminEmptyState icon={Compass} message="No trip requests match." />
      ) : (
        <table className="trip-requests-table">
          <thead>
            <tr>
              <th>Request #</th>
              <th>Created</th>
              <th>Guest Name</th>
              <th>Source</th>
              <th>Country</th>
              <th>Travel Dates</th>
              <th>Guests</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td className="trip-request-id">{r.request_number || "—"}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>{r.guest_name || "—"}</td>
                <td>{SOURCE_LABEL[r.source] || r.source || "—"}</td>
                <td>{r.country || "—"}</td>
                <td>{tripDates(r)}</td>
                <td>{r.guests_count ?? "—"}</td>
                <td>{r.budget != null ? formatPrice(r.budget) : "—"}</td>
                <td><span className={`trip-status-pill ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                <td>
                  <Link className="trip-view-btn" to={`/admin/trip-requests/${r.id}`}>
                    <Eye size={13} />View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
