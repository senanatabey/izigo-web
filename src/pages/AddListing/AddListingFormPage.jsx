import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import {
  MapPin, Wallet, MessageCircle, Users, BedDouble, Car, Calendar, Percent,
  CheckCircle2, Image as ImageIcon, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees, X,
  Waves, Thermometer,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

const CITIES = ALL_DESTINATIONS;
const AMENITY_KEYS = ["wifi", "kitchen", "ac", "parking", "fireplace", "garden", "pool", "heated_pool"];
const AMENITY_ICONS = {
  wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees,
  pool: Waves, heated_pool: Thermometer,
};
const SERVICE_KEYS = ["ice", "bbq", "hookah", "flowers", "photographer", "breakfast", "market", "guide", "laundry", "babysitter"];

const VALID_CATEGORIES = ["villa", "car", "transfer", "event", "service"];

export default function AddListingFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = !!params.id;
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [category, setCategory] = useState(params.category || "");
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [existingImages, setExistingImages] = useState([]);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [guests, setGuests] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [amenities, setAmenities] = useState([]);

  const [seats, setSeats] = useState("");
  const [transmission, setTransmission] = useState("automatic");

  const [type, setType] = useState("transfer");
  const [hasVehicle, setHasVehicle] = useState(true);

  const [date, setDate] = useState("");
  const [isFree, setIsFree] = useState(false);

  const [serviceType, setServiceType] = useState("");

  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !user) return;
    supabase.from("listings").select("*").eq("id", params.id).single().then(({ data: row }) => {
      if (!row || row.host_id !== user.id) {
        navigate("/my-listings", { replace: true });
        return;
      }
      setCategory(row.category);
      setTitle(row.title?.en || row.title?.az || "");
      setCity(row.city || "");
      setPrice(row.price ? String(row.price) : "");
      setDiscount(row.discount ? String(row.discount) : "");
      setDescription(row.description?.en || row.description?.az || "");
      setWhatsapp((row.whatsapp_phone || "").replace(/^\+994/, ""));
      setExistingImages(row.images || []);
      const d = row.details || {};
      setGuests(d.guests ? String(d.guests) : "");
      setBedrooms(d.bedrooms ? String(d.bedrooms) : "");
      setAmenities(d.amenities || []);
      setSeats(d.seats ? String(d.seats) : "");
      setTransmission(d.transmission || "automatic");
      setType(d.type || "transfer");
      setHasVehicle(d.hasVehicle ?? true);
      setDate(d.date || "");
      setIsFree(d.isFree || false);
      setServiceType(d.serviceType || "");
      setLoadingExisting(false);
    });
  }, [isEdit, user]);

  if (!isEdit && !VALID_CATEGORIES.includes(category)) {
    return <Navigate to="/add-listing" replace />;
  }

  if (loadingExisting) return null;

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (key) => {
    setAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const totalPhotoCount = existingImages.length + photos.length;

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - totalPhotoCount);
    setPhotos((prev) => [...prev, ...files].slice(0, 6 - existingImages.length));
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const urls = [];
    for (const file of photos) {
      // Storage keys must stay ASCII-safe — the original filename (accents,
      // spaces, parentheses) can otherwise be rejected as an "Invalid key".
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const canSubmit = (() => {
    if (!title || !city || !description || !whatsapp) return false;
    if (!isFree && !price && category !== "event") return false;
    if (category === "event" && !isFree && !price) return false;
    if (category === "villa") return !!(guests && bedrooms);
    if (category === "car") return !!seats;
    if (category === "transfer") return true;
    if (category === "event") return !!date;
    if (category === "service") return !!serviceType;
    return true;
  })();

  const buildDetails = () => {
    if (category === "villa") return { guests: Number(guests), bedrooms: Number(bedrooms), amenities };
    if (category === "car") return { seats: Number(seats), transmission };
    if (category === "transfer") return { type, hasVehicle, seats: Number(seats) || 0 };
    if (category === "event") return { date, isFree };
    if (category === "service") return { serviceType };
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setError("");
    setSubmitting(true);
    try {
      const uploaded = await uploadPhotos();
      const images = [...existingImages, ...uploaded];
      const payload = {
        category,
        city,
        title: { en: title, az: title },
        description: { en: description, az: description },
        price: isFree ? 0 : Number(price) || 0,
        discount: discount ? Number(discount) : null,
        details: buildDetails(),
        whatsapp_phone: `+994${whatsapp}`,
        images,
      };
      if (isEdit) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ ...payload, status: "pending", reject_reason: null })
          .eq("id", params.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("listings").insert({ ...payload, host_id: user.id });
        if (insertError) throw insertError;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to publish listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-listing-form-page">
      <style>{`
        .add-listing-form-page .alf-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 16px; }
        .add-listing-form-page .alf-head { margin-bottom: 24px; }
        .add-listing-form-page .alf-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
        .add-listing-form-page .alf-head p { font-size: 13.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .add-listing-form-page form { border: 1px solid var(--border); border-radius: 18px; padding: 28px; max-width: 640px; }
        .add-listing-form-page .alf-section-title { font-size: 14px; font-weight: 800; margin: 24px 0 14px; color: var(--text); }
        .add-listing-form-page .alf-section-title:first-child { margin-top: 0; }
        .add-listing-form-page .alf-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .add-listing-form-page .alf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .add-listing-form-page .alf-field.full { grid-column: 1 / -1; }
        .add-listing-form-page .alf-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .add-listing-form-page .alf-field input,
        .add-listing-form-page .alf-field select,
        .add-listing-form-page .alf-field textarea {
          border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px;
          font-size: 14px; color: var(--text); background: #fff; font-family: var(--sans);
        }
        .add-listing-form-page .alf-field textarea { resize: vertical; min-height: 90px; }
        .add-listing-form-page .alf-phone-input {
          display: flex; align-items: center; border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
        }
        .add-listing-form-page .alf-phone-input span {
          padding: 11px 12px; background: var(--bg-soft); font-size: 14px; font-weight: 700; color: var(--text-soft); flex-shrink: 0;
        }
        .add-listing-form-page .alf-phone-input input {
          border: none; padding: 11px 14px; font-size: 14px; color: var(--text); width: 100%; font-family: var(--sans);
        }

        .add-listing-form-page .alf-photos {
          display: flex; align-items: flex-start; gap: 12px; border: 1px dashed var(--border); border-radius: 12px;
          padding: 16px; background: var(--bg-soft); margin-bottom: 16px; cursor: pointer;
        }
        .add-listing-form-page .alf-photos svg { color: var(--text-soft); flex-shrink: 0; margin-top: 2px; }
        .add-listing-form-page .alf-photos p { font-size: 12.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }
        .add-listing-form-page .alf-photo-previews { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .add-listing-form-page .alf-photo-thumb { position: relative; width: 84px; height: 84px; border-radius: 10px; overflow: hidden; }
        .add-listing-form-page .alf-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .add-listing-form-page .alf-photo-thumb button {
          position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; border: none;
          background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .add-listing-form-page .alf-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .add-listing-form-page .alf-chip {
          display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); border-radius: 999px;
          padding: 9px 16px; font-size: 13px; font-weight: 600; color: var(--text); background: #fff; cursor: pointer;
        }
        .add-listing-form-page .alf-chip.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }

        .add-listing-form-page .alf-radio-row { display: flex; gap: 20px; margin-bottom: 16px; }
        .add-listing-form-page .alf-radio { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text); cursor: pointer; }

        .add-listing-form-page .alf-checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text); margin-bottom: 16px; cursor: pointer; }

        .add-listing-form-page .alf-submit {
          width: 100%; background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 14px; font-weight: 700; font-size: 15px; cursor: pointer;
        }
        .add-listing-form-page .alf-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .add-listing-form-page .alf-success { text-align: center; border: 1px solid var(--border); border-radius: 18px; padding: 56px 32px; max-width: 520px; }
        .add-listing-form-page .alf-success-icon { color: var(--izigo-green); margin-bottom: 16px; }
        .add-listing-form-page .alf-success h2 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
        .add-listing-form-page .alf-success p { font-size: 14.5px; color: var(--text-soft); line-height: 1.6; margin: 0 0 24px; }
        .add-listing-form-page .alf-success-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .add-listing-form-page .alf-success-actions a { font-weight: 700; font-size: 14px; }
        .add-listing-form-page .alf-btn-primary {
          background: var(--izigo-orange); color: #fff; border-radius: 10px; padding: 11px 20px; text-decoration: none;
        }
        .add-listing-form-page .alf-btn-outline {
          background: transparent; color: var(--izigo-green); border: 1.5px solid var(--izigo-green); border-radius: 10px;
          padding: 11px 20px; text-decoration: none;
        }

        @media (max-width: 640px) {
          .add-listing-form-page .alf-row { grid-template-columns: 1fr; }
          .add-listing-form-page form { padding: 20px; }
        }
      `}</style>

      <Link to="/add-listing" className="alf-back">{t("addListing.back")}</Link>

      {submitted ? (
        <div className="alf-success">
          <CheckCircle2 size={44} className="alf-success-icon" />
          <h2>{t("addListing.successHeading")}</h2>
          <p>{t("addListing.successText")}</p>
          <div className="alf-success-actions">
            <Link to="/my-listings" className="alf-btn-primary">{t("addListing.viewMyListings")}</Link>
            <Link to="/add-listing" className="alf-btn-outline">{t("addListing.addAnother")}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="alf-head">
            <h1>{t("addListing.formHeading").replace("{category}", t(`addListing.categories.${category}.title`))}</h1>
            <p>{t("addListing.formSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="alf-field full">
              <label>{t("addListing.titleLabel")}</label>
              <input type="text" placeholder={t("addListing.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="alf-row">
              <div className="alf-field">
                <label><MapPin size={13} />{t("addListing.cityLabel")}</label>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">{t("addListing.chooseCity")}</option>
                  {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, language)}</option>)}
                </select>
              </div>

              {category === "event" ? (
                <div className="alf-field">
                  <label><Calendar size={13} />{t("addListing.dateLabel")}</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              ) : (
                <div className="alf-field">
                  <label><Wallet size={13} />{t("addListing.priceLabel")}</label>
                  <input type="number" min="0" placeholder="AZN" value={price} onChange={(e) => setPrice(e.target.value)} disabled={category === "event" && isFree} />
                </div>
              )}
            </div>

            {category === "event" && (
              <label className="alf-checkbox-row">
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                {t("addListing.freeEvent")}
              </label>
            )}
            {category === "event" && !isFree && (
              <div className="alf-field">
                <label><Wallet size={13} />{t("addListing.priceLabel")}</label>
                <input type="number" min="0" placeholder="AZN" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            )}

            {!(category === "event" && isFree) && (
              <div className="alf-field">
                <label><Percent size={13} />Endirim (%) — istəyə bağlı</label>
                <input type="number" min="0" max="90" placeholder="məs. 15" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            )}

            {category === "villa" && (
              <>
                <p className="alf-section-title">{t("addListing.categories.villa.title")}</p>
                <div className="alf-row">
                  <div className="alf-field">
                    <label><Users size={13} />{t("addListing.guestsLabel")}</label>
                    <input type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label><BedDouble size={13} />{t("addListing.bedroomsLabel")}</label>
                    <input type="number" min="1" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                  </div>
                </div>
                <div className="alf-field full">
                  <label>{t("addListing.amenitiesLabel")}</label>
                </div>
                <div className="alf-chips">
                  {AMENITY_KEYS.map((key) => {
                    const Icon = AMENITY_ICONS[key];
                    return (
                      <button type="button" key={key} className={`alf-chip${amenities.includes(key) ? " active" : ""}`} onClick={() => toggleAmenity(key)}>
                        <Icon size={14} />{t(`amenities.${key}`)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {category === "car" && (
              <>
                <p className="alf-section-title">{t("addListing.categories.car.title")}</p>
                <div className="alf-row">
                  <div className="alf-field">
                    <label><Car size={13} />{t("addListing.seatsLabel")}</label>
                    <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label>{t("addListing.transmissionLabel")}</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                      <option value="automatic">{t("addListing.automatic")}</option>
                      <option value="manual">{t("addListing.manual")}</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {category === "transfer" && (
              <>
                <p className="alf-section-title">{t("addListing.categories.transfer.title")}</p>
                <div className="alf-field">
                  <label>{t("addListing.typeLabel")}</label>
                  <div className="alf-radio-row">
                    <label className="alf-radio"><input type="radio" name="type" checked={type === "transfer"} onChange={() => setType("transfer")} />{t("addListing.typeTransfer")}</label>
                    <label className="alf-radio"><input type="radio" name="type" checked={type === "tour"} onChange={() => setType("tour")} />{t("addListing.typeTour")}</label>
                  </div>
                </div>
                <div className="alf-field">
                  <label>{t("addListing.vehicleLabel")}</label>
                  <div className="alf-radio-row">
                    <label className="alf-radio"><input type="radio" name="vehicle" checked={hasVehicle} onChange={() => setHasVehicle(true)} />{t("addListing.withVehicle")}</label>
                    <label className="alf-radio"><input type="radio" name="vehicle" checked={!hasVehicle} onChange={() => setHasVehicle(false)} />{t("addListing.withoutVehicle")}</label>
                  </div>
                </div>
                <div className="alf-field">
                  <label><Users size={13} />{t("addListing.seatsLabel")}</label>
                  <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
                </div>
              </>
            )}

            {category === "service" && (
              <>
                <p className="alf-section-title">{t("addListing.categories.service.title")}</p>
                <div className="alf-field full">
                  <label>{t("addListing.serviceTypeLabel")}</label>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option value="">{t("addListing.chooseService")}</option>
                    {SERVICE_KEYS.map((key) => <option key={key} value={key}>{t(`conciergePage.services.${key}`)}</option>)}
                  </select>
                </div>
              </>
            )}

            <p className="alf-section-title">{t("addListing.photosLabel")}</p>
            {(existingImages.length > 0 || photos.length > 0) && (
              <div className="alf-photo-previews">
                {existingImages.map((url, i) => (
                  <div className="alf-photo-thumb" key={`existing-${i}`}>
                    <img src={url} alt="" />
                    <button type="button" onClick={() => removeExistingImage(i)}><X size={12} /></button>
                  </div>
                ))}
                {photos.map((file, i) => (
                  <div className="alf-photo-thumb" key={i}>
                    <img src={URL.createObjectURL(file)} alt="" />
                    <button type="button" onClick={() => removePhoto(i)}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {totalPhotoCount < 6 && (
              <label className="alf-photos">
                <ImageIcon size={18} />
                <p>{t("addListing.photosNote")}</p>
                <input type="file" accept="image/*" multiple onChange={handlePhotosChange} hidden />
              </label>
            )}

            <div className="alf-field full">
              <label>{t("addListing.descriptionLabel")}</label>
              <textarea placeholder={t("addListing.descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="alf-field full">
              <label><MessageCircle size={13} />{t("addListing.whatsappLabel")}</label>
              <div className="alf-phone-input">
                <span>+994</span>
                <input
                  type="tel"
                  placeholder="50 123 45 67"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
            </div>

            {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="alf-submit" disabled={!canSubmit || submitting}>
              {submitting ? "..." : t("addListing.submit")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
