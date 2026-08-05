import { useState } from "react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { generateAiContent } from "../../../lib/ai";

/**
 * "Generate with AI" panel, shared by Travel Guides and Places.
 *
 * IMPORTANT: this component never writes to the database and never
 * touches the entity's status. Generating text only fills a local preview
 * box; the admin must explicitly click "Insert" to copy it into the real
 * form field, and the form's own Save button (with whatever draft/published
 * status was already selected) is still required to persist anything.
 *
 * `fields`: [{ id, label, promptType }]
 * `onInsert(fieldId, text)`: called when the admin accepts a generated result.
 */
export default function AiAssistPanel({ entityLabel, name, city, category, language, fields, onInsert }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({}); // { [fieldId]: { text, loading, error } }

  const canGenerate = !!name;

  const generate = async (field) => {
    setResults((r) => ({ ...r, [field.id]: { ...r[field.id], loading: true, error: "" } }));
    try {
      const text = await generateAiContent({ type: field.promptType, entityLabel, name, city, category, language });
      setResults((r) => ({ ...r, [field.id]: { text, loading: false, error: "" } }));
    } catch (err) {
      setResults((r) => ({ ...r, [field.id]: { ...r[field.id], loading: false, error: err.message || "Generation failed." } }));
    }
  };

  const editPreview = (fieldId, text) => {
    setResults((r) => ({ ...r, [fieldId]: { ...r[fieldId], text } }));
  };

  const insert = (field) => {
    const result = results[field.id];
    if (!result?.text) return;
    onInsert(field.id, result.text);
  };

  return (
    <div className="ai-panel">
      <button type="button" className="ai-panel-toggle" onClick={() => setOpen((v) => !v)}>
        <Sparkles size={15} />
        Generate with AI
        <ChevronDown size={14} className={`ai-panel-chevron${open ? " open" : ""}`} />
      </button>

      {open && (
        <div className="ai-panel-body">
          {!canGenerate && <p className="ai-panel-hint">Enter a title/name above first — AI needs something to write about.</p>}
          {fields.map((field) => {
            const result = results[field.id];
            return (
              <div className="ai-field-row" key={field.id}>
                <div className="ai-field-head">
                  <span>{field.label}</span>
                  <button
                    type="button"
                    className="ai-generate-btn"
                    disabled={!canGenerate || result?.loading}
                    onClick={() => generate(field)}
                  >
                    {result?.loading ? <Loader2 size={13} className="ai-spin" /> : <Sparkles size={13} />}
                    {result?.text ? "Regenerate" : "Generate"}
                  </button>
                </div>

                {result?.error && <p className="ai-field-error">{result.error}</p>}

                {result?.text && (
                  <div className="ai-field-preview">
                    <textarea value={result.text} onChange={(e) => editPreview(field.id, e.target.value)} />
                    <button type="button" className="ai-insert-btn" onClick={() => insert(field)}>Insert into field</button>
                  </div>
                )}
              </div>
            );
          })}
          <p className="ai-panel-hint">Generated text is a starting point only — nothing is saved until you review it and click Save below.</p>
        </div>
      )}
    </div>
  );
}
