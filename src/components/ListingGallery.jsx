import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Phone, MessageCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../App";
import { recordListingContact } from "../lib/reviews";
import { formatPhone } from "../lib/phone";

/**
 * Shared photo gallery for the four listing detail pages (Villa / Car /
 * Transfer / Event). Replaces the old fixed 2-3 image grid that had no way
 * to reach the rest of a listing's photos.
 *
 * The main stage is a 4:3 box (capped in height on large screens) with two
 * layers of the SAME image:
 *  - a blurred, darkened `cover` layer that fills the box, so a tall/portrait
 *    photo gets soft matching bars instead of empty gaps;
 *  - a `contain` layer on top that shows the whole photo, never cropped —
 *    which matters because the IZIGO.AZ watermark sits inside the frame and
 *    `cover` could clip it.
 *
 * Thumbnails below scroll horizontally; on a real pointer device hovering a
 * thumbnail swaps the main image (tap.az style), click always works as a
 * fallback. Arrows (desktop, on hover) and swipe (touch) move between photos.
 * Clicking the main image opens a full-screen lightbox with the same photo
 * set; the lightbox header carries the listing name + price and a compact
 * reveal-phone / WhatsApp control so a viewer can make contact without
 * leaving the photos. Purely presentational — no change to how photos are
 * stored, optimized or watermarked.
 */
export default function ListingGallery({
  images = [], tone = "forest", alt = "", priceLabel = "", phone = "", listingId = "",
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const photos = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [phoneShown, setPhoneShown] = useState(false);
  const thumbsRef = useRef(null);
  const lightboxThumbsRef = useRef(null);
  const touchStartX = useRef(null);

  // Only wire thumbnail hover-to-preview on devices with a real hovering
  // pointer — never on touch, where "hover" would fire on scroll/tap and
  // fight the existing tap/swipe behaviour.
  const [canHover, setCanHover] = useState(
    () => typeof window !== "undefined"
      && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = (e) => setCanHover(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Derived, never stored out of range — so a shorter `images` prop can't
  // leave a stale index behind (and no clamp-in-effect).
  const idx = Math.min(active, Math.max(0, photos.length - 1));

  // Keep the active thumbnail visible by scrolling ONLY the strip
  // horizontally — never el.scrollIntoView(), which also scrolls the page
  // vertically and made hovering an off-screen right-hand thumbnail jump the
  // whole page.
  const revealThumb = useCallback((strip, i) => {
    if (!strip) return;
    const el = strip.children[i];
    if (!el) return;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    if (left < strip.scrollLeft) {
      strip.scrollLeft = left - 12;
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = right - strip.clientWidth + 12;
    }
  }, []);

  useEffect(() => {
    revealThumb(thumbsRef.current, idx);
    if (lightboxOpen) revealThumb(lightboxThumbsRef.current, idx);
  }, [idx, lightboxOpen, revealThumb]);

  const go = useCallback((delta) => {
    setActive((cur) => {
      const base = Math.min(cur, Math.max(0, photos.length - 1));
      const next = base + delta;
      if (next < 0 || next > photos.length - 1) return cur;
      return next;
    });
  }, [photos.length]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setPhoneShown(false); // collapse the revealed number for next time
  }, []);

  const onWhatsappClick = () => {
    if (user?.id && listingId) recordListingContact(listingId, user.id);
  };

  // Esc closes the lightbox; arrow keys page through it. Body scroll is
  // locked while it's open.
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, go, closeLightbox]);

  const src = photos[idx];

  const thumbButtons = photos.map((url, i) => (
    <button
      type="button" key={i}
      className={`lg-thumb${i === idx ? " is-active" : ""}`}
      onClick={() => setActive(i)}
      onMouseEnter={canHover ? () => setActive(i) : undefined}
      aria-label={`${i + 1} / ${photos.length}`}
    >
      <img src={url} alt="" loading="lazy" decoding="async" />
    </button>
  ));

  return (
    <div className="listing-gallery">
      <style>{`
        .listing-gallery {
          margin-bottom: 32px;
          /* Cap the stage on large screens by BOTH axes together, so the
             visible box stays a true 4:3 instead of getting wide-and-short
             when only max-height bit. max-width = max-height * 4 / 3. */
          --lg-max-h: 520px;
          --lg-max-w: calc(520px * 4 / 3);
        }
        .listing-gallery .lg-stage {
          position: relative; width: 100%; aspect-ratio: 4 / 3;
          max-width: var(--lg-max-w); max-height: var(--lg-max-h); margin: 0 auto;
          border-radius: 16px; overflow: hidden; background: var(--bg-soft);
        }
        .listing-gallery .lg-stage.tone-dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .listing-gallery .lg-stage.tone-forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .listing-gallery .lg-stage.tone-meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .listing-gallery .lg-bg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transform: scale(1.1);
          filter: blur(20px) brightness(0.7);
        }
        .listing-gallery .lg-main {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; z-index: 1; cursor: zoom-in;
        }
        .listing-gallery .lg-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 2; width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255, 255, 255, 0.9); color: var(--text);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
          opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
        }
        .listing-gallery .lg-stage:hover .lg-arrow { opacity: 1; }
        .listing-gallery .lg-stage:hover .lg-arrow:not(:disabled) { pointer-events: auto; }
        .listing-gallery .lg-arrow:disabled { opacity: 0 !important; cursor: default; }
        .listing-gallery .lg-arrow.prev { left: 12px; }
        .listing-gallery .lg-arrow.next { right: 12px; }
        .listing-gallery .lg-counter {
          position: absolute; bottom: 12px; right: 12px; z-index: 2;
          font-size: 12px; font-weight: 700; color: #fff;
          background: rgba(0, 0, 0, 0.55); border-radius: 999px; padding: 4px 10px;
          pointer-events: none;
        }

        .listing-gallery .lg-thumbs {
          display: flex; gap: 10px; margin: 12px auto 0;
          max-width: var(--lg-max-w);
          overflow-x: auto; scrollbar-width: thin; padding-bottom: 4px;
          scroll-behavior: smooth;
        }
        .listing-gallery .lg-thumb {
          flex: 0 0 auto; width: 96px; height: 68px; border-radius: 10px;
          overflow: hidden; border: 2px solid transparent; cursor: pointer;
          padding: 0; background: var(--bg-soft);
        }
        .listing-gallery .lg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .listing-gallery .lg-thumb.is-active { border-color: var(--izigo-green); }
        .listing-gallery .lg-thumb:not(.is-active) img { opacity: 0.7; }

        /* ---- lightbox ---- */
        .listing-gallery .lg-lightbox {
          position: fixed; inset: 0; z-index: 4000;
          background: #000;
          display: flex; flex-direction: column;
        }
        .listing-gallery .lg-lb-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 20px; color: #fff;
        }
        .listing-gallery .lg-lb-meta { min-width: 0; }
        .listing-gallery .lg-lb-title { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .listing-gallery .lg-lb-price { font-size: 13px; font-weight: 700; color: var(--izigo-orange); margin-top: 2px; }
        .listing-gallery .lg-lb-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .listing-gallery .lg-lb-contact {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 700; white-space: nowrap;
          border: none; border-radius: 999px; padding: 9px 14px; cursor: pointer;
          background: var(--izigo-green); color: #fff; text-decoration: none;
        }
        .listing-gallery .lg-lb-contact:hover { filter: brightness(0.95); }
        .listing-gallery .lg-lb-close {
          flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; border: none;
          background: rgba(255, 255, 255, 0.14); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .listing-gallery .lg-lb-stage {
          position: relative; flex: 1; min-height: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 8px;
        }
        /* Same 4:3 frame as the in-page gallery, sized to the largest 4:3 box
           that fits between the header and the thumbnail strip — so a photo
           reads at a consistent proportion in both places (and the
           server-side watermark, which is scaled to a 4:3 box, stays a
           consistent size here too). width drives it, height follows from
           aspect-ratio, so the ratio can't be broken by a max-height clamp.
           ~168px is the header + thumbnail strip + padding reserve. */
        .listing-gallery .lg-lb-frame {
          position: relative;
          width: min(92vw, calc((100dvh - 168px) * 4 / 3));
          aspect-ratio: 4 / 3;
        }
        .listing-gallery .lg-lb-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain;
        }
        .listing-gallery .lg-lb-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 1;
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: rgba(255, 255, 255, 0.16); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .listing-gallery .lg-lb-arrow:disabled { opacity: 0.3; cursor: default; }
        .listing-gallery .lg-lb-arrow.prev { left: 16px; }
        .listing-gallery .lg-lb-arrow.next { right: 16px; }
        .listing-gallery .lg-lb-thumbs {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: thin;
          padding: 14px 20px 18px; scroll-behavior: smooth;
        }
        .listing-gallery .lg-lb-thumbs .lg-thumb { width: 84px; height: 60px; }
        .listing-gallery .lg-lb-thumbs .lg-thumb.is-active { border-color: #fff; }

        @media (max-width: 640px) {
          .listing-gallery .lg-stage { max-height: 56vh; }
          .listing-gallery .lg-bg { filter: blur(12px) brightness(0.7); }
          .listing-gallery .lg-arrow { display: none; }
          .listing-gallery .lg-thumb { width: 72px; height: 52px; }
          .listing-gallery .lg-lb-head { padding: 12px 14px; gap: 10px; }
          .listing-gallery .lg-lb-contact { padding: 8px 12px; }
          .listing-gallery .lg-lb-arrow { display: none; }
          .listing-gallery .lg-lb-frame { width: min(100vw, calc((100dvh - 150px) * 4 / 3)); }
          .listing-gallery .lg-lb-thumbs { padding: 10px 12px 14px; }
          .listing-gallery .lg-lb-thumbs .lg-thumb { width: 64px; height: 46px; }
        }
      `}</style>

      {photos.length === 0 ? (
        <div className={`lg-stage tone-${tone}`} />
      ) : (
        <>
          <div className="lg-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <img className="lg-bg" src={src} alt="" aria-hidden="true" decoding="async" />
            <img
              className="lg-main" src={src} alt={alt} decoding="async"
              onClick={() => setLightboxOpen(true)}
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button" className="lg-arrow prev" onClick={() => go(-1)}
                  disabled={idx === 0} aria-label={t("listingGallery.prevImage")}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button" className="lg-arrow next" onClick={() => go(1)}
                  disabled={idx === photos.length - 1} aria-label={t("listingGallery.nextImage")}
                >
                  <ChevronRight size={20} />
                </button>
                <span className="lg-counter">{idx + 1} / {photos.length}</span>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="lg-thumbs" ref={thumbsRef}>{thumbButtons}</div>
          )}

          {lightboxOpen && (
            <div
              className="lg-lightbox"
              onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
            >
              <div className="lg-lb-head">
                <div className="lg-lb-meta">
                  <div className="lg-lb-title">
                    {alt}{photos.length > 1 ? ` · ${idx + 1} / ${photos.length}` : ""}
                  </div>
                  {priceLabel && <div className="lg-lb-price">{priceLabel}</div>}
                </div>
                <div className="lg-lb-actions">
                  {phone && (phoneShown ? (
                    <a
                      className="lg-lb-contact"
                      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={onWhatsappClick}
                    >
                      <MessageCircle size={15} />{formatPhone(phone, false)}
                    </a>
                  ) : (
                    <button type="button" className="lg-lb-contact" onClick={() => setPhoneShown(true)}>
                      <Phone size={14} />{t("phoneReveal.show")}
                    </button>
                  ))}
                  <button
                    type="button" className="lg-lb-close"
                    onClick={closeLightbox} aria-label={t("listingGallery.close")}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div
                className="lg-lb-stage"
                onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
              >
                <div
                  className="lg-lb-frame"
                  onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
                >
                  <img className="lg-lb-img" src={src} alt={alt} decoding="async" />
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button" className="lg-lb-arrow prev" onClick={() => go(-1)}
                        disabled={idx === 0} aria-label={t("listingGallery.prevImage")}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        type="button" className="lg-lb-arrow next" onClick={() => go(1)}
                        disabled={idx === photos.length - 1} aria-label={t("listingGallery.nextImage")}
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {photos.length > 1 && (
                <div className="lg-lb-thumbs" ref={lightboxThumbsRef}>{thumbButtons}</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
