import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import {
  MapPin, Wallet, MessageCircle, Users, BedDouble, Bath, Car, Calendar, Percent, Moon,
  CheckCircle2, Image as ImageIcon, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees, X,
  Waves, Thermometer, User, Mail, Lock, Ruler, Layers, Clock, Eye, Check, ChevronLeft,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";
import { compressImage } from "../../lib/imageOptimize";
import { isFounderCampaignJoinable } from "../../lib/founder";

const CITIES = ALL_DESTINATIONS;
const AMENITY_KEYS = ["wifi", "kitchen", "ac", "parking", "fireplace", "garden", "pool", "heated_pool"];
const AMENITY_ICONS = {
  wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees,
  pool: Waves, heated_pool: Thermometer,
};
const SERVICE_KEYS = ["ice", "bbq", "hookah", "flowers", "photographer", "breakfast", "market", "guide", "laundry", "babysitter"];
const HOUSE_RULE_KEYS = ["smoking", "pets", "parties"];
const BED_TYPE_KEYS = ["double", "single", "sofa_bed", "bunk"];
const BED_TYPE_SLEEPS = { double: 2, single: 1, sofa_bed: 2, bunk: 2 };
const VIEW_TYPE_KEYS = ["mountain", "sea", "forest", "city", "garden", "none"];

const VALID_CATEGORIES = ["villa", "car", "transfer", "event", "service"];
const MIN_PHOTOS = 4;
const MAX_PHOTOS_BY_CATEGORY = { villa: 20, car: 12, transfer: 10, event: 10, service: 10 };

export default function AddListingFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = !!params.id;
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [category, setCategory] = useState(params.category || "");
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [existingImages, setExistingImages] = useState([]);
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [guests, setGuests] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [areaSqm, setAreaSqm] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [landAreaSot, setLandAreaSot] = useState("");
  const [bedTypes, setBedTypes] = useState([]);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [houseRules, setHouseRules] = useState({ smoking: null, pets: null, parties: null });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursFrom, setQuietHoursFrom] = useState("22:00");
  const [quietHoursTo, setQuietHoursTo] = useState("08:00");
  const [houseRulesNotes, setHouseRulesNotes] = useState("");
  const [viewTypes, setViewTypes] = useState([]);

  const [longStayEnabled, setLongStayEnabled] = useState(false);
  const [longStayMinNights, setLongStayMinNights] = useState("2");
  const [longStayDiscountType, setLongStayDiscountType] = useState("percentage");
  const [longStayDiscountValue, setLongStayDiscountValue] = useState("");

  const [seats, setSeats] = useState("");
  const [transmission, setTransmission] = useState("automatic");

  const [type, setType] = useState("transfer");
  const [hasVehicle, setHasVehicle] = useState(true);

  const [date, setDate] = useState("");
  const [isFree, setIsFree] = useState(false);

  const [serviceType, setServiceType] = useState("");

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showFounderNote, setShowFounderNote] = useState(false);

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
      setBathrooms(d.bathrooms ? String(d.bathrooms) : "");
      setAmenities(d.amenities || []);
      setAreaSqm(d.area_sqm ? String(d.area_sqm) : "");
      setFloorCount(d.floor_count ? String(d.floor_count) : "");
      setLandAreaSot(d.land_area_sot ? String(d.land_area_sot) : "");
      setBedTypes(d.bed_types || []);
      setCheckInTime(d.check_in_time || "14:00");
      setCheckOutTime(d.check_out_time || "12:00");
      setHouseRules({
        smoking: d.house_rules?.smoking ?? null,
        pets: d.house_rules?.pets ?? null,
        parties: d.house_rules?.parties ?? null,
      });
      setQuietHoursEnabled(!!d.house_rules?.quiet_hours);
      setQuietHoursFrom(d.house_rules?.quiet_hours?.from || "22:00");
      setQuietHoursTo(d.house_rules?.quiet_hours?.to || "08:00");
      setHouseRulesNotes(d.house_rules?.additional_notes || "");
      setViewTypes(d.view_type || []);
      setLongStayEnabled(row.long_stay_discount_enabled || false);
      setLongStayMinNights(row.long_stay_min_nights ? String(row.long_stay_min_nights) : "2");
      setLongStayDiscountType(row.long_stay_discount_type || "percentage");
      setLongStayDiscountValue(row.long_stay_discount_value != null ? String(row.long_stay_discount_value) : "");
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

  const toggleViewType = (key) => {
    setViewTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const addBedType = () => {
    setBedTypes((prev) => [...prev, { type: "double", count: 1 }]);
  };
  const updateBedType = (index, field, value) => {
    setBedTypes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const removeBedType = (index) => {
    setBedTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const setHouseRule = (key, value) => {
    setHouseRules((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const totalPhotoCount = existingImages.length + photos.length;
  const maxPhotos = MAX_PHOTOS_BY_CATEGORY[category] || MIN_PHOTOS;

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, maxPhotos - totalPhotoCount);
    setPhotos((prev) => [...prev, ...files].slice(0, maxPhotos - existingImages.length));
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const urls = [];
    for (const file of photos) {
      // Resize + re-encode as WebP before it ever leaves the browser —
      // smaller uploads, smaller storage, smaller downloads for every visitor.
      const optimized = await compressImage(file);
      // The watermark-listing-image edge function draws "IZIGO.AZ" onto the
      // photo server-side and uploads the result itself (service-role key
      // never leaves the server) — this is the only place listing photos
      // reach Storage from, so every listing image is watermarked before it
      // ever becomes public. See supabase/functions/watermark-listing-image.
      const formData = new FormData();
      formData.append("file", optimized);
      const { data, error: fnError } = await supabase.functions.invoke("watermark-listing-image", { body: formData });
      if (fnError) {
        // fnError.context is the raw Response for an HTTP-level failure (bad
        // file type, processing error, upload error — all sent back as
        // { error: "..." } JSON by the function); a network-level failure
        // (offline, timeout) has no context and only a generic .message.
        let message = "Failed to upload photo — please try again.";
        if (fnError.context && typeof fnError.context.json === "function") {
          try {
            const body = await fnError.context.json();
            if (body?.error) message = body.error;
          } catch {
            // response body wasn't JSON — keep the generic message
          }
        } else if (fnError.message) {
          message = fnError.message;
        }
        throw new Error(message);
      }
      if (!data?.url) throw new Error("Failed to upload photo — please try again.");
      urls.push(data.url);
    }
    return urls;
  };

  // Split into per-step checkpoints purely so the stepper's "Next" buttons can
  // gate on just that step's own fields — the combined result (step1Valid &&
  // step2Valid && step3Valid) is exactly the same boolean the old single
  // canSubmit IIFE computed, just partitioned by which step each field lives
  // in now. No rule changed, nothing added or removed.
  const step1Valid = (() => {
    if (!title || !city) return false;
    if (!isFree && !price && category !== "event") return false;
    if (category === "event" && !isFree && !price) return false;
    if (category === "event") return !!date;
    if (category === "villa") {
      if (!(guests && bedrooms && bathrooms && Number(bathrooms) > 0)) return false;
      if (!areaSqm || Number(areaSqm) <= 0) return false;
      if (!floorCount || Number(floorCount) <= 0) return false;
      return true;
    }
    if (category === "car") return !!seats;
    if (category === "service") return !!serviceType;
    return true;
  })();

  const step2Valid = (() => {
    if (!description || !whatsapp) return false;
    if (totalPhotoCount < MIN_PHOTOS) return false;
    if (category === "villa" && longStayEnabled) {
      if (!longStayMinNights || Number(longStayMinNights) < 2) return false;
      if (longStayDiscountType === "percentage") {
        const pct = Number(longStayDiscountValue);
        if (!longStayDiscountValue || pct < 1 || pct > 100) return false;
      } else if (longStayDiscountType === "fixed_price") {
        const fixed = Number(longStayDiscountValue);
        if (!longStayDiscountValue || fixed <= 0) return false;
        if (price && fixed >= Number(price)) return false;
      } else {
        return false;
      }
    }
    return true;
  })();

  const step3Valid = (() => {
    if (!isEdit && !agreedToRules) return false;
    if (!user && (!accountName || !accountEmail || accountPassword.length < 6)) return false;
    return true;
  })();

  const canSubmit = step1Valid && step2Valid && step3Valid;

  // A step is reachable (clickable in the stepper, or advance-able via
  // "Next") once every step before it is valid — this is what stops someone
  // jumping straight to step 3 with step 1 incomplete via the stepper.
  const maxReachableStep = step1Valid ? (step2Valid ? 3 : 2) : 1;
  const goToStep = (n) => { if (n <= maxReachableStep || n < step) setStep(n); };

  const buildDetails = () => {
    if (category === "villa") {
      const hasHouseRules =
        houseRules.smoking !== null || houseRules.pets !== null || houseRules.parties !== null ||
        quietHoursEnabled || houseRulesNotes.trim();
      return {
        guests: Number(guests), bedrooms: Number(bedrooms), bathrooms: Number(bathrooms), amenities,
        area_sqm: Number(areaSqm), floor_count: Number(floorCount),
        land_area_sot: landAreaSot ? Number(landAreaSot) : null,
        bed_types: bedTypes.length > 0 ? bedTypes : null,
        check_in_time: checkInTime, check_out_time: checkOutTime,
        house_rules: hasHouseRules ? {
          smoking: houseRules.smoking, pets: houseRules.pets, parties: houseRules.parties,
          quiet_hours: quietHoursEnabled ? { from: quietHoursFrom, to: quietHoursTo } : null,
          additional_notes: houseRulesNotes.trim(),
        } : null,
        view_type: viewTypes.length > 0 ? viewTypes : null,
      };
    }
    if (category === "car") return { seats: Number(seats), transmission };
    if (category === "transfer") return { type, hasVehicle, seats: Number(seats) || 0 };
    if (category === "event") return { date, isFree };
    if (category === "service") return { serviceType };
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isEdit && !user) return;
    setError("");
    setSubmitting(true);
    try {
      let hostId = user?.id;

      // Guests can publish without an account first — we create it here,
      // right alongside the listing, tap.az-style.
      if (!user) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: accountEmail,
          password: accountPassword,
          options: { data: { full_name: accountName, phone: `+994${whatsapp}` } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          // Email confirmation is required — we can't upload photos or
          // insert the listing without an authenticated session, so ask
          // the guest to confirm and come back. Their entered fields stay
          // filled so they can just log in and resubmit.
          setNeedsEmailConfirmation(true);
          setSubmitting(false);
          return;
        }
        hostId = data.user.id;
      }

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
        long_stay_discount_enabled: category === "villa" && longStayEnabled,
        long_stay_min_nights: category === "villa" && longStayEnabled ? Number(longStayMinNights) : 2,
        long_stay_discount_type: category === "villa" && longStayEnabled ? longStayDiscountType : null,
        long_stay_discount_value: category === "villa" && longStayEnabled ? Number(longStayDiscountValue) : null,
      };
      if (isEdit) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ ...payload, status: "pending", reject_reason: null })
          .eq("id", params.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("listings").insert({ ...payload, host_id: hostId });
        if (insertError) throw insertError;
      }

      // Founder benefits only apply to Villa, Cars, Transfers and Local
      // Services — Events are excluded, so no Founder messaging there.
      if (!isEdit && category !== "event") {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("host_id", hostId);
        const isFirstListing = (count || 0) <= 1;
        if (isFirstListing) {
          const joinable = await isFounderCampaignJoinable();
          setShowFounderNote(joinable);
        }
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
        .add-listing-form-page { max-width: 1280px; margin: 0 auto; padding: 40px 5vw 80px; }
        .add-listing-form-page .alf-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 16px; }
        .add-listing-form-page .alf-head { margin-bottom: 24px; }
        .add-listing-form-page .alf-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
        .add-listing-form-page .alf-head p { font-size: 13.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .add-listing-form-page form { border: 1px solid var(--border); border-radius: 18px; padding: 28px; max-width: 640px; }
        .add-listing-form-page .alf-section-title { font-size: 14px; font-weight: 800; margin: 24px 0 14px; color: var(--text); }
        .add-listing-form-page .alf-section-title:first-child { margin-top: 0; }
        .add-listing-form-page .alf-account-note { font-size: 12.5px; color: var(--text-soft); line-height: 1.5; margin: -6px 0 16px; }
        .add-listing-form-page .alf-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .add-listing-form-page .alf-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
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
        .add-listing-form-page .alf-field input.error { border-color: #E0553F; }
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
        .add-listing-form-page .alf-photo-rules { font-size: 12px; color: var(--text-soft); line-height: 1.5; margin: -8px 0 12px; }
        .add-listing-form-page .alf-photo-count { font-size: 12px; color: var(--text-soft); margin: -4px 0 16px; }
        .add-listing-form-page .alf-photo-count.short { color: #E0553F; font-weight: 600; }
        .add-listing-form-page .alf-field-note { font-size: 11.5px; color: var(--text-soft); margin: 4px 0 0; line-height: 1.4; }
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
        .add-listing-form-page .alf-rules-box { border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; background: var(--bg-soft); }
        .add-listing-form-page .alf-rules-title { font-size: 13px; font-weight: 800; margin: 0 0 8px; }
        .add-listing-form-page .alf-rules-list { margin: 0 0 14px; padding-left: 18px; font-size: 12.5px; color: var(--text-soft); line-height: 1.7; }
        .add-listing-form-page .alf-rules-box .alf-checkbox-row { margin-bottom: 0; font-size: 13px; }

        .add-listing-form-page .alf-stepper { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; max-width: 640px; }
        .add-listing-form-page .alf-stepper-item {
          display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 4px 0; cursor: pointer;
          font-family: var(--sans); flex: 1;
        }
        .add-listing-form-page .alf-stepper-item:disabled { cursor: not-allowed; opacity: 0.5; }
        .add-listing-form-page .alf-stepper-item:not(:last-child)::after {
          content: ""; flex: 1; height: 2px; background: var(--border); margin-left: 8px;
        }
        .add-listing-form-page .alf-stepper-item.done:not(:last-child)::after { background: var(--izigo-green); }
        .add-listing-form-page .alf-stepper-dot {
          width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; font-weight: 700; background: var(--bg-soft); color: var(--text-soft); border: 2px solid var(--border);
        }
        .add-listing-form-page .alf-stepper-item.active .alf-stepper-dot { background: var(--izigo-orange); border-color: var(--izigo-orange); color: #fff; }
        .add-listing-form-page .alf-stepper-item.done .alf-stepper-dot { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .add-listing-form-page .alf-stepper-label { font-size: 12.5px; font-weight: 700; color: var(--text-soft); white-space: nowrap; }
        .add-listing-form-page .alf-stepper-item.active .alf-stepper-label { color: var(--text); }
        .add-listing-form-page .alf-stepper-mobile { display: none; font-size: 12.5px; font-weight: 700; color: var(--text-soft); margin: 0 0 8px; }
        .add-listing-form-page .alf-stepper-bar { display: none; height: 4px; border-radius: 999px; background: var(--bg-soft); overflow: hidden; margin-bottom: 20px; max-width: 640px; }
        .add-listing-form-page .alf-stepper-bar-fill { height: 100%; background: var(--izigo-orange); transition: width 0.2s ease; }

        .add-listing-form-page .alf-step-heading { font-size: 16px; font-weight: 800; margin: 0 0 4px; }
        .add-listing-form-page .alf-step-subheading { font-size: 12.5px; color: var(--text-soft); margin: 0 0 20px; }

        .add-listing-form-page .alf-step-nav { display: flex; justify-content: space-between; gap: 12px; margin: 24px 0 8px; }
        .add-listing-form-page .alf-btn-next {
          margin-left: auto; background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 12px 24px; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .add-listing-form-page .alf-btn-next:disabled { opacity: 0.45; cursor: not-allowed; }
        .add-listing-form-page .alf-btn-back {
          display: flex; align-items: center; gap: 4px; background: none; border: 1.5px solid var(--border); border-radius: 10px;
          padding: 11px 18px; font-weight: 700; font-size: 14px; cursor: pointer; color: var(--text); font-family: var(--sans);
        }

        @media (max-width: 640px) {
          .add-listing-form-page .alf-stepper { display: none; }
          .add-listing-form-page .alf-stepper-mobile { display: block; }
          .add-listing-form-page .alf-stepper-bar { display: block; }
          .add-listing-form-page .alf-step-nav { flex-direction: column-reverse; }
          .add-listing-form-page .alf-btn-next, .add-listing-form-page .alf-btn-back { width: 100%; justify-content: center; min-height: 44px; }
        }
        .add-listing-form-page .alf-longstay-note { font-size: 12.5px; color: var(--text-soft); margin: -8px 0 16px; }
        .add-listing-form-page .alf-longstay-warning { font-size: 12.5px; color: #E0553F; margin: -8px 0 16px; font-weight: 600; }

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


        .add-listing-form-page .alf-bedtype-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .add-listing-form-page .alf-bedtype-row select { flex: 2; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 14px; background: #fff; font-family: var(--sans); }
        .add-listing-form-page .alf-bedtype-row input { flex: 1; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 14px; width: 100%; }
        .add-listing-form-page .alf-bedtype-row button { width: 36px; height: 36px; flex-shrink: 0; border: none; background: none; color: #E0553F; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .add-listing-form-page .alf-bedtype-add { border: 1px dashed var(--border); border-radius: 10px; background: none; padding: 10px; width: 100%; font-size: 13px; font-weight: 700; color: var(--izigo-green); cursor: pointer; min-height: 44px; }

        .add-listing-form-page .alf-houserules-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 16px; }
        .add-listing-form-page .alf-houserule-item { display: flex; flex-direction: column; gap: 8px; }
        .add-listing-form-page .alf-houserule-item span { font-size: 13.5px; font-weight: 600; color: var(--text); }
        .add-listing-form-page .alf-houserule-toggles { display: flex; gap: 8px; }
        .add-listing-form-page .alf-houserule-toggles .alf-chip { padding: 7px 12px; font-size: 12.5px; }

        @media (max-width: 640px) {
          .add-listing-form-page .alf-row { grid-template-columns: 1fr; }
          .add-listing-form-page .alf-row-3 { grid-template-columns: 1fr; }
          .add-listing-form-page .alf-houserules-grid { grid-template-columns: 1fr; }
          .add-listing-form-page form { padding: 20px; }
        }
      `}</style>

      <Link to="/add-listing" className="alf-back">{t("addListing.back")}</Link>

      {needsEmailConfirmation ? (
        <div className="alf-success">
          <CheckCircle2 size={44} className="alf-success-icon" />
          <h2>{t("auth.checkEmailTitle")}</h2>
          <p>{t("auth.checkEmailText").replace("{email}", accountEmail)}</p>
          <p>{t("addListing.confirmThenResubmit")}</p>
          <div className="alf-success-actions">
            <Link to="/login" className="alf-btn-primary">{t("nav.login")}</Link>
          </div>
        </div>
      ) : submitted ? (
        <div className="alf-success">
          <CheckCircle2 size={44} className="alf-success-icon" />
          <h2>{t("addListing.successHeading")}</h2>
          <p>{t("addListing.successText")}</p>
          {showFounderNote && <p>{t("addListing.founderSuccessNote")}</p>}
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

          <div className="alf-stepper">
            {[1, 2, 3].map((n) => (
              <button
                type="button"
                key={n}
                className={`alf-stepper-item${n === step ? " active" : ""}${n < step ? " done" : ""}`}
                disabled={n > maxReachableStep && n > step}
                onClick={() => goToStep(n)}
              >
                <span className="alf-stepper-dot">{n < step ? <Check size={12} /> : n}</span>
                <span className="alf-stepper-label">{t(`addListing.step${n}Title`)}</span>
              </button>
            ))}
          </div>
          <p className="alf-stepper-mobile">{t("addListing.stepOfLabel").replace("{step}", step)}</p>
          <div className="alf-stepper-bar"><div className="alf-stepper-bar-fill" style={{ width: `${(step / 3) * 100}%` }} /></div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
            <>
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
                <div className="alf-row-3">
                  <div className="alf-field">
                    <label><Users size={13} />{t("addListing.guestsLabel")}</label>
                    <input type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label><BedDouble size={13} />{t("addListing.bedroomsLabel")}</label>
                    <input type="number" min="1" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label><Bath size={13} />{t("addListing.bathroomsLabel")}</label>
                    <input type="number" min="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                  </div>
                </div>
                <div className="alf-row">
                  <div className="alf-field">
                    <label><Ruler size={13} />{t("addListing.areaLabel")}</label>
                    <input type="number" min="1" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label><Layers size={13} />{t("addListing.floorCountLabel")}</label>
                    <input type="number" min="1" value={floorCount} onChange={(e) => setFloorCount(e.target.value)} />
                  </div>
                </div>
                <div className="alf-field">
                  <label><Ruler size={13} />{t("addListing.landAreaLabel")}</label>
                  <input type="number" min="0" step="0.1" placeholder={t("addListing.landAreaPlaceholder")} value={landAreaSot} onChange={(e) => setLandAreaSot(e.target.value)} />
                </div>
                <div className="alf-field full">
                  <label><BedDouble size={13} />{t("addListing.bedTypesLabel")}</label>
                  <p className="alf-field-note" style={{ marginTop: 0, marginBottom: 10 }}>{t("addListing.bedTypesNote")}</p>
                  {bedTypes.map((row, i) => (
                    <div className="alf-bedtype-row" key={i}>
                      <select value={row.type} onChange={(e) => updateBedType(i, "type", e.target.value)}>
                        {BED_TYPE_KEYS.map((key) => <option key={key} value={key}>{t(`bedTypes.${key}`)}</option>)}
                      </select>
                      <input type="number" min="1" value={row.count} onChange={(e) => updateBedType(i, "count", Number(e.target.value))} />
                      <button type="button" onClick={() => removeBedType(i)} aria-label={t("addListing.bedRemove")}><X size={15} /></button>
                    </div>
                  ))}
                  <button type="button" className="alf-bedtype-add" onClick={addBedType}>{t("addListing.bedConfigAddRow")}</button>
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

            <div className="alf-step-nav">
              <button type="button" className="alf-btn-next" disabled={!step1Valid} onClick={() => goToStep(2)}>{t("addListing.nextStep")}</button>
            </div>
            </>
            )}

            {step === 2 && (
            <>
            <div className="alf-head">
              <h2 className="alf-step-heading">{t(category === "villa" ? "addListing.step2TitleVilla" : "addListing.step2TitleOther")}</h2>
              <p className="alf-step-subheading">{t(category === "villa" ? "addListing.step2SubVilla" : "addListing.step2SubOther")}</p>
            </div>
            {category === "villa" && (
              <>
                <p className="alf-section-title">{t("addListing.checkInOutTitle")}</p>
                <div className="alf-row">
                  <div className="alf-field">
                    <label><Clock size={13} />{t("addListing.checkInLabel")}</label>
                    <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                  </div>
                  <div className="alf-field">
                    <label><Clock size={13} />{t("addListing.checkOutLabel")}</label>
                    <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
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

                <p className="alf-section-title">{t("addListing.houseRulesTitle")}</p>
                <div className="alf-houserules-grid">
                  {HOUSE_RULE_KEYS.map((key) => (
                    <div className="alf-houserule-item" key={key}>
                      <span>{t(`houseRules.${key}`)}</span>
                      <div className="alf-houserule-toggles">
                        <button type="button" className={`alf-chip${houseRules[key] === true ? " active" : ""}`} onClick={() => setHouseRule(key, true)}>{t("addListing.ruleAllowed")}</button>
                        <button type="button" className={`alf-chip${houseRules[key] === false ? " active" : ""}`} onClick={() => setHouseRule(key, false)}>{t("addListing.ruleNotAllowed")}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="alf-checkbox-row">
                  <input type="checkbox" checked={quietHoursEnabled} onChange={(e) => setQuietHoursEnabled(e.target.checked)} />
                  {t("addListing.quietHoursEnable")}
                </label>
                {quietHoursEnabled && (
                  <div className="alf-row">
                    <div className="alf-field">
                      <label>{t("addListing.quietHoursFrom")}</label>
                      <input type="time" value={quietHoursFrom} onChange={(e) => setQuietHoursFrom(e.target.value)} />
                    </div>
                    <div className="alf-field">
                      <label>{t("addListing.quietHoursTo")}</label>
                      <input type="time" value={quietHoursTo} onChange={(e) => setQuietHoursTo(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="alf-field full">
                  <label>{t("addListing.houseRulesNotesLabel")}</label>
                  <textarea placeholder={t("addListing.houseRulesNotesPlaceholder")} value={houseRulesNotes} onChange={(e) => setHouseRulesNotes(e.target.value)} />
                </div>

                <div className="alf-field full">
                  <label><Eye size={13} />{t("addListing.viewTypeLabel")}</label>
                </div>
                <div className="alf-chips">
                  {VIEW_TYPE_KEYS.map((key) => (
                    <button type="button" key={key} className={`alf-chip${viewTypes.includes(key) ? " active" : ""}`} onClick={() => toggleViewType(key)}>
                      {t(`viewTypes.${key}`)}
                    </button>
                  ))}
                </div>

                <p className="alf-section-title">{t("addListing.longStay.title")}</p>
                <label className="alf-checkbox-row">
                  <input type="checkbox" checked={longStayEnabled} onChange={(e) => setLongStayEnabled(e.target.checked)} />
                  {t("addListing.longStay.enableLabel")}
                </label>
                {longStayEnabled && (
                  <>
                    <div className="alf-row">
                      <div className="alf-field">
                        <label><Moon size={13} />{t("addListing.longStay.minNightsLabel")}</label>
                        <input type="number" min="2" value={longStayMinNights} onChange={(e) => setLongStayMinNights(e.target.value)} />
                      </div>
                      <div className="alf-field">
                        <label>{t("addListing.longStay.discountTypeLabel")}</label>
                        <div className="alf-radio-row">
                          <label className="alf-radio">
                            <input
                              type="radio"
                              name="longStayDiscountType"
                              checked={longStayDiscountType === "percentage"}
                              onChange={() => setLongStayDiscountType("percentage")}
                            />
                            {t("addListing.longStay.percentage")}
                          </label>
                          <label className="alf-radio">
                            <input
                              type="radio"
                              name="longStayDiscountType"
                              checked={longStayDiscountType === "fixed_price"}
                              onChange={() => setLongStayDiscountType("fixed_price")}
                            />
                            {t("addListing.longStay.fixedPrice")}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="alf-field">
                      <label>
                        <Percent size={13} />
                        {longStayDiscountType === "percentage"
                          ? t("addListing.longStay.percentageValueLabel")
                          : t("addListing.longStay.fixedPriceValueLabel")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={longStayDiscountType === "percentage" ? "100" : undefined}
                        placeholder={longStayDiscountType === "percentage" ? "10" : "90"}
                        value={longStayDiscountValue}
                        onChange={(e) => setLongStayDiscountValue(e.target.value)}
                      />
                    </div>
                    {longStayDiscountType === "fixed_price" && price && longStayDiscountValue && Number(longStayDiscountValue) >= Number(price) && (
                      <p className="alf-longstay-warning">{t("addListing.longStay.fixedPriceWarning")}</p>
                    )}
                    {price && longStayDiscountValue && !(longStayDiscountType === "fixed_price" && Number(longStayDiscountValue) >= Number(price)) && (
                      <p className="alf-longstay-note">
                        {t("addListing.longStay.previewText")
                          .replace("{regular}", price)
                          .replace(
                            "{discounted}",
                            longStayDiscountType === "percentage"
                              ? Math.round(Number(price) * (1 - Number(longStayDiscountValue) / 100))
                              : longStayDiscountValue
                          )}
                      </p>
                    )}
                  </>
                )}
              </>
            )}


            <p className="alf-section-title">{t("addListing.photosLabel")}</p>
            <p className="alf-photo-rules">{t("addListing.photoRulesNote")}</p>
            {(existingImages.length > 0 || photos.length > 0) && (
              <div className="alf-photo-previews">
                {existingImages.map((url, i) => (
                  <div className="alf-photo-thumb" key={`existing-${i}`}>
                    <img src={url} alt="" loading="lazy" decoding="async" />
                    <button type="button" onClick={() => removeExistingImage(i)}><X size={12} /></button>
                  </div>
                ))}
                {photos.map((file, i) => (
                  <div className="alf-photo-thumb" key={i}>
                    <img src={URL.createObjectURL(file)} alt="" loading="lazy" decoding="async" />
                    <button type="button" onClick={() => removePhoto(i)}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {totalPhotoCount < maxPhotos && (
              <label className="alf-photos">
                <ImageIcon size={18} />
                <p>{t("addListing.photosNote")}</p>
                <input type="file" accept="image/*" multiple onChange={handlePhotosChange} hidden />
              </label>
            )}
            <p className={`alf-photo-count${totalPhotoCount < MIN_PHOTOS ? " short" : ""}`}>
              {t("addListing.photoCountNote")
                .replace("{count}", totalPhotoCount)
                .replace("{max}", maxPhotos)
                .replace("{min}", MIN_PHOTOS)}
            </p>

            <div className="alf-field full">
              <label>{t("addListing.descriptionLabel")}</label>
              <textarea placeholder={t("addListing.descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} />
              <p className="alf-field-note">{t("addListing.descriptionContactWarning")}</p>
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

            <div className="alf-step-nav">
              <button type="button" className="alf-btn-back" onClick={() => setStep(1)}><ChevronLeft size={15} />{t("addListing.backStep")}</button>
              <button type="button" className="alf-btn-next" disabled={!step2Valid} onClick={() => goToStep(3)}>{t("addListing.nextStep")}</button>
            </div>
            </>
            )}

            {step === 3 && (
            <>
            {!user && (
              <>
                <p className="alf-section-title">{t("addListing.accountSectionTitle")}</p>
                <p className="alf-account-note">{t("addListing.accountSectionNote")}</p>
                <div className="alf-field full">
                  <label><User size={13} />{t("auth.nameLabel")}</label>
                  <input type="text" placeholder={t("auth.namePlaceholder")} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                </div>
                <div className="alf-field full">
                  <label><Mail size={13} />{t("auth.emailLabel")}</label>
                  <input type="email" placeholder={t("auth.emailPlaceholder")} value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
                </div>
                <div className="alf-field full">
                  <label><Lock size={13} />{t("auth.passwordLabel")}</label>
                  <input type="password" placeholder={t("auth.passwordPlaceholder")} value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} />
                </div>
              </>
            )}

            {!isEdit && (
              <div className="alf-rules-box">
                <p className="alf-rules-title">{t("addListing.rulesTitle")}</p>
                <ul className="alf-rules-list">
                  <li>{t("addListing.rule1")}</li>
                  <li>{t("addListing.rule2")}</li>
                  <li>{t("addListing.rule3")}</li>
                  <li>{t("addListing.rule4")}</li>
                  <li>{t("addListing.rule5")}</li>
                </ul>
                <label className="alf-checkbox-row">
                  <input type="checkbox" checked={agreedToRules} onChange={(e) => setAgreedToRules(e.target.checked)} />
                  {t("addListing.agreeToRules")}
                </label>
              </div>
            )}

            {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div className="alf-step-nav">
              <button type="button" className="alf-btn-back" onClick={() => setStep(2)}><ChevronLeft size={15} />{t("addListing.backStep")}</button>
            </div>
            <button type="submit" className="alf-submit" disabled={!canSubmit || submitting}>
              {submitting ? "..." : t("addListing.submit")}
            </button>
            </>
            )}
          </form>
        </>
      )}
    </div>
  );
}
