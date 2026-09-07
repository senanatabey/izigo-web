import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Shared photo gallery for the four listing detail pages (Villa / Car /
 * Transfer / Event). Replaces the old fixed 2-3 image grid that had no way
 * to reach the rest of a listing's photos.
 *
 * The main stage is a fixed 16:9 box with two layers of the SAME image:
 *  - a blurred, darkened `cover` layer that fills the box, so a tall/portrait
 *    photo gets soft matching bars instead of empty gaps;
 *  - a `contain` layer on top that shows the whole photo, never cropped —
 *    which matters because the IZIGO.AZ watermark sits inside the frame and
 *    `cover` could clip it.
 *
 * Thumbnails below scroll horizontally; arrows (desktop, on hover) and swipe
 * (touch) move between photos. Purely presentational — no change to how
 * photos are stored, optimized or watermarked.
 */
export default function ListingGallery({ images = [], tone = "forest", alt = "" }) {
  const { t } = useLanguage();
  const photos = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const thumbsRef = useRef(null);
  const touchStartX = useRef(null);

  // Derived, never stored out of range — so a shorter `images` prop can't
  // leave a stale index behind (and no clamp-in-effect).
  const idx = Math.min(active, Math.max(0, photos.length - 1));

  // Keep the active thumbnail in view as it changes.
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return undefined;
    const el = strip.children[idx];
    if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    return undefined;
  }, [idx]);

  const go = (delta) => {
    const next = idx + delta;
    if (next < 0 || next > photos.length - 1) return;
    setActive(next);
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const src = photos[idx];

  return (
    <div className="listing-gallery">
      <style>{`
        .listing-gallery { margin-bottom: 32px; }
        .listing-gallery .lg-stage {
          position: relative; width: 100%; aspect-ratio: 16 / 9;
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
          object-fit: contain; z-index: 1;
        }
        .listing-gallery .lg-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 2; width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255, 255, 255, 0.9); color: var(--text);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
          opacity: 0; transition: opacity 0.18s ease;
        }
        .listing-gallery .lg-stage:hover .lg-arrow { opacity: 1; }
        .listing-gallery .lg-arrow:disabled { opacity: 0 !important; cursor: default; }
        .listing-gallery .lg-arrow.prev { left: 12px; }
        .listing-gallery .lg-arrow.next { right: 12px; }
        .listing-gallery .lg-counter {
          position: absolute; bottom: 12px; right: 12px; z-index: 2;
          font-size: 12px; font-weight: 700; color: #fff;
          background: rgba(0, 0, 0, 0.55); border-radius: 999px; padding: 4px 10px;
        }

        .listing-gallery .lg-thumbs {
          display: flex; gap: 10px; margin-top: 12px;
          overflow-x: auto; scrollbar-width: thin; padding-bottom: 4px;
        }
        .listing-gallery .lg-thumb {
          flex: 0 0 auto; width: 96px; height: 68px; border-radius: 10px;
          overflow: hidden; border: 2px solid transparent; cursor: pointer;
          padding: 0; background: var(--bg-soft);
        }
        .listing-gallery .lg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .listing-gallery .lg-thumb.is-active { border-color: var(--izigo-green); }
        .listing-gallery .lg-thumb:not(.is-active) img { opacity: 0.7; }

        @media (max-width: 640px) {
          .listing-gallery .lg-bg { filter: blur(12px) brightness(0.7); }
          .listing-gallery .lg-arrow { display: none; }
          .listing-gallery .lg-thumb { width: 72px; height: 52px; }
        }
      `}</style>

      {photos.length === 0 ? (
        <div className={`lg-stage tone-${tone}`} />
      ) : (
        <>
          <div className="lg-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <img className="lg-bg" src={src} alt="" aria-hidden="true" decoding="async" />
            <img className="lg-main" src={src} alt={alt} decoding="async" />
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
            <div className="lg-thumbs" ref={thumbsRef}>
              {photos.map((url, i) => (
                <button
                  type="button" key={i}
                  className={`lg-thumb${i === idx ? " is-active" : ""}`}
                  onClick={() => setActive(i)}
                  aria-label={`${i + 1} / ${photos.length}`}
                >
                  <img src={url} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
