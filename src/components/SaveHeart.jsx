import { Heart } from "lucide-react";
import { useSaved } from "../App";

export default function SaveHeart({ type, id, className = "" }) {
  const { isSaved, toggleSaved } = useSaved();
  const saved = isSaved(type, id);

  return (
    <button
      type="button"
      className={`save-heart${saved ? " active" : ""} ${className}`}
      aria-label="Save"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(type, id);
      }}
    >
      <style>{`
        .save-heart {
          position: absolute; top: 10px; right: 10px; z-index: 2;
          width: 32px; height: 32px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.92); color: var(--text);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: transform 0.15s ease;
        }
        .save-heart:hover { transform: scale(1.08); }
        .save-heart.active { color: var(--izigo-orange); }
      `}</style>
      <Heart size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
