import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Generic accordion — pass `items` as [{ q, a }, ...]. Reusable anywhere an
 * FAQ-style list is needed, not tied to any one page's content.
 */
export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="faq-accordion">
      <style>{`
        .faq-accordion { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
        .faq-item { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: #fff; }
        .faq-question {
          width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 18px; background: none; border: none; cursor: pointer; text-align: left;
          font-size: 14.5px; font-weight: 700; color: var(--text);
        }
        .faq-question svg { flex-shrink: 0; color: var(--text-soft); transition: transform 0.2s ease; }
        .faq-item.open .faq-question svg { transform: rotate(180deg); color: var(--izigo-green); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.2s ease; }
        .faq-item.open .faq-answer { max-height: 240px; }
        .faq-answer p { margin: 0; padding: 0 18px 16px; font-size: 13.5px; color: var(--text-soft); line-height: 1.6; }
      `}</style>
      {items.map(({ q, a }, i) => {
        const open = openIndex === i;
        return (
          <div className={`faq-item${open ? " open" : ""}`} key={i}>
            <button type="button" className="faq-question" onClick={() => setOpenIndex(open ? null : i)}>
              <span>{q}</span>
              <ChevronDown size={18} />
            </button>
            <div className="faq-answer"><p>{a}</p></div>
          </div>
        );
      })}
    </div>
  );
}
