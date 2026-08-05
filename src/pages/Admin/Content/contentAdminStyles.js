/* Shared inline-<style> block for every Content Management admin page —
   keeps the CRUD list/modal/status-pill/language-tab look consistent
   without duplicating ~150 lines of CSS across five page files. */
export const CONTENT_ADMIN_STYLES = `
  .ca-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .ca-subtitle { font-size: 13.5px; color: var(--text-soft); margin: 0 0 24px; }
  .ca-new-btn { border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
  .ca-new-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ca-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
  .ca-toolbar input, .ca-toolbar select {
    border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: var(--sans);
  }

  .ca-list { display: flex; flex-direction: column; gap: 12px; }
  .ca-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; }
  .ca-thumb { width: 64px; height: 44px; border-radius: 8px; background: var(--bg-soft); background-size: cover; background-position: center; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-soft); }
  .ca-info { flex: 1; min-width: 0; }
  .ca-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .ca-meta { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
  .ca-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; flex-shrink: 0; }
  .ca-pill.draft { background: var(--bg-soft); color: var(--text-soft); }
  .ca-pill.published { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
  .ca-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
  .ca-actions button { border: none; border-radius: 8px; padding: 7px 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
  .ca-btn-publish { background: var(--izigo-green); color: #fff; }
  .ca-btn-edit { background: var(--bg-soft); color: var(--text); }
  .ca-btn-remove { background: none; color: #E0553F; }

  .ca-empty { text-align: center; padding: 60px 20px; border: 1px dashed var(--border); border-radius: 16px; }
  .ca-empty svg { color: var(--izigo-green); margin-bottom: 12px; }
  .ca-empty h2 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
  .ca-empty p { font-size: 13.5px; color: var(--text-soft); max-width: 420px; margin: 0 auto 20px; line-height: 1.6; }

  .ca-modal-overlay { position: fixed; inset: 0; background: rgba(5,22,20,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
  .ca-modal { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; position: relative; }
  .ca-modal-close { position: absolute; top: 16px; right: 16px; border: none; background: var(--bg-soft); border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ca-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .ca-field label { font-size: 12.5px; font-weight: 700; }
  .ca-field input, .ca-field select, .ca-field textarea {
    border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: var(--sans);
  }
  .ca-field textarea { resize: vertical; min-height: 70px; }
  .ca-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ca-upload { display: flex; align-items: center; gap: 10px; border: 1px dashed var(--border); border-radius: 10px; padding: 12px; cursor: pointer; background: var(--bg-soft); font-size: 12.5px; color: var(--text-soft); }
  .ca-save-btn { width: 100%; background: var(--izigo-orange); color: #fff; border: none; border-radius: 8px; padding: 12px; font-weight: 700; cursor: pointer; margin-top: 6px; }

  .ca-lang-tabs { display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
  .ca-lang-tab {
    border: none; background: none; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
    color: var(--text-soft); border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .ca-lang-tab.active { color: var(--izigo-green); border-bottom-color: var(--izigo-green); }

  .ca-preview-note { font-size: 12.5px; color: var(--text-soft); background: var(--bg-soft); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; }

  .ai-panel { border: 1px solid rgba(0, 200, 151, 0.3); border-radius: 10px; margin-bottom: 18px; background: rgba(0, 200, 151, 0.04); overflow: hidden; }
  .ai-panel-toggle {
    width: 100%; display: flex; align-items: center; gap: 8px; border: none; background: none; cursor: pointer;
    padding: 10px 14px; font-size: 13px; font-weight: 700; color: var(--izigo-green); text-align: left;
  }
  .ai-panel-toggle svg:first-child { flex-shrink: 0; }
  .ai-panel-chevron { margin-left: auto; transition: transform 0.15s ease; }
  .ai-panel-chevron.open { transform: rotate(180deg); }
  .ai-panel-body { padding: 4px 14px 14px; display: flex; flex-direction: column; gap: 12px; }
  .ai-panel-hint { font-size: 12px; color: var(--text-soft); margin: 0; line-height: 1.5; }
  .ai-field-row { border-top: 1px solid rgba(0, 200, 151, 0.18); padding-top: 10px; }
  .ai-field-row:first-child { border-top: none; padding-top: 0; }
  .ai-field-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .ai-field-head span { font-size: 12.5px; font-weight: 700; color: var(--text); }
  .ai-generate-btn {
    display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--izigo-green); background: #fff;
    color: var(--izigo-green); border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 700; cursor: pointer;
  }
  .ai-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ai-spin { animation: ai-spin 0.8s linear infinite; }
  @keyframes ai-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ai-field-error { font-size: 12px; color: #E0553F; margin: 6px 0 0; }
  .ai-field-preview { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .ai-field-preview textarea {
    border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: var(--sans);
    min-height: 70px; resize: vertical; background: #fff;
  }
  .ai-insert-btn {
    align-self: flex-start; border: none; background: var(--izigo-green); color: #fff; border-radius: 8px;
    padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
  }
`;
