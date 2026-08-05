import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, MessageCircle, Copy, Check } from "lucide-react";
import {
  fetchTripRequest, updateTripRequest, fetchTripServices,
  addTripService, deleteTripService, TRIP_STATUSES, TRIP_SOURCES, TRIP_RESULTS,
} from "../../../lib/tripRequests";
import { fetchApprovedListings } from "../../../lib/listings";
import { useCurrency } from "../../../i18n/CurrencyContext";

const STATUS_LABEL = {
  new: "New",
  in_progress: "In Progress",
  offer_sent: "Offer Sent",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SERVICE_LABEL = { villa: "Villa", transfer: "Transfer", tour: "Tour", extra: "Extra" };

const SOURCE_LABEL = {
  plan_my_trip: "Plan My Trip",
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
};

const RESULT_LABEL = {
  completed: "Completed",
  cancelled: "Cancelled",
  no_reply: "No Reply",
  budget_too_low: "Budget Too Low",
  guest_changed_mind: "Guest Changed Mind",
};

// The happy-path progression shown in the timeline — "cancelled" is a
// separate exit state handled by its own pill rather than a timeline step.
const TIMELINE_STEPS = ["new", "in_progress", "offer_sent", "confirmed", "completed"];

const EMPTY_NEW_SERVICE = {
  service_type: "villa",
  listing_id: "",
  title: "",
  price: "",
  notes: "",
  driver_name: "",
  driver_phone: "",
  pickup_location: "",
  pickup_time: "",
};

function toDateInputValue(d) {
  if (!d) return "";
  return d.slice(0, 10);
}

export default function TripRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [trip, setTrip] = useState(null);
  const [services, setServices] = useState([]);
  const [villaListings, setVillaListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [newService, setNewService] = useState(EMPTY_NEW_SERVICE);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const [tripData, servicesData] = await Promise.all([fetchTripRequest(id), fetchTripServices(id)]);
    setTrip(tripData);
    setServices(servicesData);
    setForm({
      guest_name: tripData.guest_name || "",
      whatsapp: tripData.whatsapp || "",
      country: tripData.country || "",
      city: tripData.city || "",
      check_in: toDateInputValue(tripData.check_in),
      check_out: toDateInputValue(tripData.check_out),
      guests_count: tripData.guests_count ?? "",
      budget: tripData.budget ?? "",
      internal_notes: tripData.internal_notes || "",
    });
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { fetchApprovedListings("villa").then(setVillaListings).catch(() => setVillaListings([])); }, []);

  const changeStatus = async (status) => {
    await updateTripRequest(id, { status });
    setTrip((t) => ({ ...t, status }));
  };

  const changeSource = async (source) => {
    await updateTripRequest(id, { source });
    setTrip((t) => ({ ...t, source }));
  };

  const changeResult = async (result) => {
    await updateTripRequest(id, { result: result || null });
    setTrip((t) => ({ ...t, result: result || null }));
  };

  const saveForm = async () => {
    setSaving(true);
    await updateTripRequest(id, {
      guest_name: form.guest_name || null,
      whatsapp: form.whatsapp || null,
      country: form.country || null,
      city: form.city || null,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      guests_count: form.guests_count === "" ? null : Number(form.guests_count),
      budget: form.budget === "" ? null : Number(form.budget),
      internal_notes: form.internal_notes || null,
    });
    await load();
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const submitNewService = async (e) => {
    e.preventDefault();
    const payload = { service_type: newService.service_type, price: newService.price === "" ? null : Number(newService.price), notes: newService.notes || null };
    if (newService.service_type === "villa") {
      const listing = villaListings.find((l) => l.id === newService.listing_id);
      payload.listing_id = newService.listing_id || null;
      payload.title = listing ? (listing.title?.en || listing.title?.az) : (newService.title || null);
    } else if (newService.service_type === "transfer") {
      payload.driver_name = newService.driver_name || null;
      payload.driver_phone = newService.driver_phone || null;
      payload.pickup_location = newService.pickup_location || null;
      payload.pickup_time = newService.pickup_time || null;
      payload.title = "Transfer";
    } else {
      payload.title = newService.title || null;
    }
    await addTripService(id, payload);
    setNewService(EMPTY_NEW_SERVICE);
    setServices(await fetchTripServices(id));
  };

  const removeService = async (serviceId) => {
    if (!window.confirm("Remove this service?")) return;
    await deleteTripService(serviceId);
    setServices(await fetchTripServices(id));
  };

  const totalCost = useMemo(
    () => services.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
    [services]
  );
  const remaining = trip?.budget != null ? Number(trip.budget) - totalCost : null;

  const whatsappMessage = useMemo(() => {
    if (!trip) return "";
    const lines = [`Hi ${trip.guest_name || "there"}! Here is your IZIGO trip summary:`];
    if (form?.check_in && form?.check_out) lines.push(`Dates: ${form.check_in} to ${form.check_out}`);
    else if (trip.trip_length_days) lines.push(`Trip length: ${trip.trip_length_days} days in ${trip.city || ""}`);
    const villa = services.find((s) => s.service_type === "villa");
    if (villa) lines.push(`Villa: ${villa.title || "Selected villa"} — ${formatPrice(villa.price || 0)}`);
    const transfer = services.find((s) => s.service_type === "transfer");
    if (transfer) lines.push(`Transfer: ${transfer.driver_name || "Driver"}${transfer.pickup_time ? ` (pickup ${transfer.pickup_time})` : ""} — ${formatPrice(transfer.price || 0)}`);
    services.filter((s) => s.service_type === "tour").forEach((t) => lines.push(`Tour: ${t.title || "Tour"} — ${formatPrice(t.price || 0)}`));
    services.filter((s) => s.service_type === "extra").forEach((e) => lines.push(`${e.title || "Extra"} — ${formatPrice(e.price || 0)}`));
    lines.push(`Total: ${formatPrice(totalCost)}`);
    return lines.join("\n");
  }, [trip, services, totalCost, formatPrice, form]);

  const whatsappHref = useMemo(() => {
    const digits = (trip?.whatsapp || "").replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage)}` : "#";
  }, [trip, whatsappMessage]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !trip || !form) return <p>Loading...</p>;

  return (
    <div className="trip-detail">
      <style>{`
        .trip-detail { max-width: 980px; }
        .trip-detail-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-soft); margin-bottom: 14px; }
        .trip-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .trip-detail-head-left { display: flex; flex-direction: column; gap: 3px; }
        .trip-detail-head h1 { font-size: 22px; font-weight: 800; margin: 0; }
        .trip-detail-request-number { font-family: monospace; font-size: 13px; font-weight: 700; color: var(--text-soft); }
        .trip-detail-head-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .trip-detail-head select { border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; font-weight: 700; font-size: 13.5px; }
        .trip-detail-head-field { display: flex; flex-direction: column; gap: 3px; }
        .trip-detail-head-field label { font-size: 10.5px; font-weight: 700; color: var(--text-soft); text-transform: uppercase; }

        .trip-timeline { display: flex; align-items: center; margin-bottom: 4px; }
        .trip-timeline-step { display: flex; align-items: center; flex: 1; }
        .trip-timeline-step:last-child { flex: 0; }
        .trip-timeline-dot {
          width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; border: 2px solid var(--border); background: #fff; color: var(--text-soft); flex-shrink: 0;
        }
        .trip-timeline-dot.done { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .trip-timeline-dot.current { background: #fff; border-color: var(--izigo-green); color: var(--izigo-green); }
        .trip-timeline-line { flex: 1; height: 2px; background: var(--border); margin: 0 6px; }
        .trip-timeline-line.done { background: var(--izigo-green); }
        .trip-timeline-label { font-size: 11px; font-weight: 700; color: var(--text-soft); text-align: center; margin-top: 6px; white-space: nowrap; }
        .trip-timeline-wrap { margin-bottom: 18px; }
        .trip-timeline-labels { display: flex; }
        .trip-timeline-labels > div { flex: 1; }
        .trip-timeline-labels > div:last-child { flex: 0 0 26px; }
        .trip-cancelled-note { color: #E0553F; font-weight: 700; font-size: 13px; margin-top: 8px; }
        .trip-section { border: 1px solid var(--border); border-radius: 16px; padding: 20px 22px; margin-bottom: 18px; background: #fff; }
        .trip-section h2 { font-size: 15px; font-weight: 800; margin: 0 0 14px; }
        .trip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .trip-field { display: flex; flex-direction: column; gap: 5px; }
        .trip-field label { font-size: 11.5px; font-weight: 700; color: var(--text-soft); text-transform: uppercase; }
        .trip-field input, .trip-field textarea, .trip-field select {
          border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; font-size: 13.5px; font-family: inherit;
        }
        .trip-field textarea { resize: vertical; min-height: 70px; }
        .trip-readonly { font-size: 13.5px; color: var(--text); white-space: pre-wrap; }
        .trip-save-btn {
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px; padding: 10px 20px;
          font-weight: 700; font-size: 13.5px; cursor: pointer; margin-top: 4px;
        }
        .trip-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .trip-saved-flash { color: var(--izigo-green); font-size: 12.5px; font-weight: 700; margin-left: 10px; }

        .service-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .service-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 13.5px;
        }
        .service-row-type {
          font-size: 10.5px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 999px;
          background: var(--bg-soft); color: var(--text-soft); margin-right: 8px;
        }
        .service-row-meta { color: var(--text-soft); font-size: 12.5px; }
        .service-row button { border: none; background: none; color: #E0553F; cursor: pointer; display: flex; }
        .new-service-form { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--border); padding-top: 16px; }
        .new-service-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .new-service-row select, .new-service-row input {
          border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; font-size: 13.5px; font-family: inherit;
        }
        .new-service-add {
          align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: var(--text);
          color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer;
        }

        .cost-summary-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; }
        .cost-summary-row.total { font-weight: 800; border-top: 1px solid var(--border); margin-top: 6px; padding-top: 12px; }
        .cost-summary-row.exceeded { color: #E0553F; font-weight: 800; }
        .cost-summary-row.ok { color: var(--izigo-green); font-weight: 800; }

        .wa-message { white-space: pre-wrap; background: var(--bg-soft); border-radius: 10px; padding: 14px; font-size: 13.5px; margin-bottom: 12px; }
        .wa-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .wa-copy-btn, .wa-send-btn {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 10px; padding: 9px 16px;
          font-weight: 700; font-size: 13px; cursor: pointer; border: none; text-decoration: none;
        }
        .wa-copy-btn { background: #F1F1F1; color: #333; }
        .wa-send-btn { background: var(--izigo-green); color: #fff; }

        @media (max-width: 860px) {
          .trip-grid, .new-service-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <Link to="/admin/trip-requests" className="trip-detail-back"><ArrowLeft size={14} />Back to Trip Requests</Link>

      <div className="trip-detail-head">
        <div className="trip-detail-head-left">
          <h1>{trip.guest_name || "Trip Request"}</h1>
          <span className="trip-detail-request-number">{trip.request_number || "—"}</span>
        </div>
        <div className="trip-detail-head-right">
          <div className="trip-detail-head-field">
            <label>Source</label>
            <select value={trip.source} onChange={(e) => changeSource(e.target.value)}>
              {TRIP_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="trip-detail-head-field">
            <label>Result</label>
            <select value={trip.result || ""} onChange={(e) => changeResult(e.target.value)}>
              <option value="">Not set</option>
              {TRIP_RESULTS.map((r) => <option key={r} value={r}>{RESULT_LABEL[r]}</option>)}
            </select>
          </div>
          <div className="trip-detail-head-field">
            <label>Status</label>
            <select value={trip.status} onChange={(e) => changeStatus(e.target.value)}>
              {TRIP_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="trip-section trip-timeline-wrap">
        {trip.status === "cancelled" ? (
          <p className="trip-cancelled-note">This trip request was cancelled.</p>
        ) : (
          <>
            <div className="trip-timeline">
              {TIMELINE_STEPS.map((step, i) => {
                const currentIndex = TIMELINE_STEPS.indexOf(trip.status);
                const isDone = currentIndex > i;
                const isCurrent = currentIndex === i;
                return (
                  <div className="trip-timeline-step" key={step}>
                    <div className={`trip-timeline-dot${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && <div className={`trip-timeline-line${isDone ? " done" : ""}`} />}
                  </div>
                );
              })}
            </div>
            <div className="trip-timeline-labels">
              {TIMELINE_STEPS.map((step) => (
                <div className="trip-timeline-label" key={step}>{STATUS_LABEL[step]}</div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="trip-section">
        <h2>Guest Information</h2>
        <div className="trip-grid">
          <div className="trip-field">
            <label>Name</label>
            <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Not provided yet" />
          </div>
        </div>
      </div>

      <div className="trip-section">
        <h2>Trip Information</h2>
        <div className="trip-grid">
          <div className="trip-field">
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>Guests</label>
            <input type="number" min="1" value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>Requested trip length</label>
            <p className="trip-readonly">{trip.trip_length_days ? `${trip.trip_length_days} days` : "—"}</p>
          </div>
          <div className="trip-field">
            <label>Check-in</label>
            <input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>Check-out</label>
            <input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
          </div>
          <div className="trip-field">
            <label>Traveler type / occasion</label>
            <p className="trip-readonly">{[trip.traveler_type, trip.occasion].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      </div>

      <div className="trip-section">
        <h2>Budget</h2>
        <div className="trip-grid">
          <div className="trip-field">
            <label>Guest budget</label>
            <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="trip-section">
        <h2>Special Requests</h2>
        <p className="trip-readonly">{trip.special_requests || "No special requests submitted."}</p>
      </div>

      <div className="trip-section">
        <h2>Internal Notes</h2>
        <div className="trip-field">
          <textarea
            value={form.internal_notes}
            onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
            placeholder="Working notes for the team — not visible to the guest."
          />
        </div>
      </div>

      <div className="trip-section">
        <button className="trip-save-btn" onClick={saveForm} disabled={saving}>
          {saving ? "Saving..." : "Save Trip Details"}
        </button>
        {savedFlash && <span className="trip-saved-flash">Saved ✓</span>}
      </div>

      <div className="trip-section">
        <h2>Services</h2>
        {services.length > 0 && (
          <div className="service-list">
            {services.map((s) => (
              <div className="service-row" key={s.id}>
                <div>
                  <span className="service-row-type">{SERVICE_LABEL[s.service_type]}</span>
                  <strong>{s.title || (s.service_type === "transfer" ? s.driver_name : "Untitled")}</strong>
                  {s.service_type === "transfer" && (
                    <span className="service-row-meta">
                      {" "}· {s.pickup_location || "pickup TBD"}{s.pickup_time ? ` at ${s.pickup_time}` : ""}
                    </span>
                  )}
                  {s.notes && <span className="service-row-meta"> · {s.notes}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <strong>{formatPrice(s.price || 0)}</strong>
                  <button onClick={() => removeService(s.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="new-service-form" onSubmit={submitNewService}>
          <div className="new-service-row">
            <select value={newService.service_type} onChange={(e) => setNewService({ ...EMPTY_NEW_SERVICE, service_type: e.target.value })}>
              <option value="villa">Villa</option>
              <option value="transfer">Transfer</option>
              <option value="tour">Tour</option>
              <option value="extra">Extra</option>
            </select>

            {newService.service_type === "villa" && (
              <select value={newService.listing_id} onChange={(e) => setNewService({ ...newService, listing_id: e.target.value })}>
                <option value="">Select listing...</option>
                {villaListings.map((l) => <option key={l.id} value={l.id}>{l.title?.en || l.title?.az}</option>)}
              </select>
            )}
            {newService.service_type === "transfer" && (
              <>
                <input placeholder="Driver name" value={newService.driver_name} onChange={(e) => setNewService({ ...newService, driver_name: e.target.value })} />
                <input placeholder="Phone number" value={newService.driver_phone} onChange={(e) => setNewService({ ...newService, driver_phone: e.target.value })} />
              </>
            )}
            {(newService.service_type === "tour" || newService.service_type === "extra") && (
              <input
                placeholder={newService.service_type === "tour" ? "Tour name" : "Item name"}
                value={newService.title}
                onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              />
            )}

            <input type="number" min="0" placeholder="Price (AZN)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
          </div>

          {newService.service_type === "transfer" && (
            <div className="new-service-row">
              <input placeholder="Pickup location" value={newService.pickup_location} onChange={(e) => setNewService({ ...newService, pickup_location: e.target.value })} />
              <input placeholder="Pickup time" value={newService.pickup_time} onChange={(e) => setNewService({ ...newService, pickup_time: e.target.value })} />
              <input placeholder="Notes" value={newService.notes} onChange={(e) => setNewService({ ...newService, notes: e.target.value })} />
            </div>
          )}
          {newService.service_type !== "transfer" && (
            <div className="new-service-row">
              <input placeholder="Notes" value={newService.notes} onChange={(e) => setNewService({ ...newService, notes: e.target.value })} />
            </div>
          )}

          <button type="submit" className="new-service-add"><Plus size={15} />Add Service</button>
        </form>
      </div>

      <div className="trip-section">
        <h2>Cost Summary</h2>
        {["villa", "transfer", "tour", "extra"].map((type) => {
          const subtotal = services.filter((s) => s.service_type === type).reduce((sum, s) => sum + (Number(s.price) || 0), 0);
          if (subtotal === 0 && !services.some((s) => s.service_type === type)) return null;
          return (
            <div className="cost-summary-row" key={type}>
              <span>{SERVICE_LABEL[type]}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          );
        })}
        <div className="cost-summary-row total">
          <span>Total Trip Cost</span>
          <span>{formatPrice(totalCost)}</span>
        </div>
        <div className="cost-summary-row">
          <span>Guest Budget</span>
          <span>{trip.budget != null ? formatPrice(trip.budget) : "Not set"}</span>
        </div>
        {remaining != null && (
          <div className={`cost-summary-row ${remaining < 0 ? "exceeded" : "ok"}`}>
            <span>{remaining < 0 ? "Budget Exceeded" : "Remaining Budget"}</span>
            <span>{formatPrice(Math.abs(remaining))}</span>
          </div>
        )}
      </div>

      <div className="trip-section">
        <h2><MessageCircle size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />WhatsApp Summary</h2>
        <div className="wa-message">{whatsappMessage}</div>
        <div className="wa-actions">
          <button type="button" className="wa-copy-btn" onClick={copyMessage}>
            {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy message"}
          </button>
          <a className="wa-send-btn" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={15} />Send via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
