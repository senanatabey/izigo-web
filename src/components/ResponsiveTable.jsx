import { useEffect, useRef } from "react";

/**
 * Drop-in replacement for <table> in admin/partner lists.
 *
 * - Above 860px it is a normal table inside a horizontally scrollable
 *   wrapper, so a wide table can never stretch the page.
 * - At 860px and below the CSS (App.css, ".rt-wrap") turns each row into a
 *   card; every cell is labelled with its column header, which is copied
 *   into a data-label attribute here so the pages keep their plain markup.
 */
export default function ResponsiveTable({ className = "", children }) {
  const tableRef = useRef(null);

  // Runs after every render so rows added later (async data, filters) are
  // labelled too. Only data-label is written; React never manages it.
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const headRow = table.querySelector("thead tr:last-child");
    const labels = headRow ? [...headRow.children].map((th) => th.textContent.trim()) : [];
    table.querySelectorAll("tbody tr").forEach((tr) => {
      [...tr.children].forEach((td, i) => {
        if (td.hasAttribute("colspan")) td.removeAttribute("data-label");
        else td.setAttribute("data-label", labels[i] || "");
      });
    });
  });

  return (
    <div className="rt-wrap">
      <table ref={tableRef} className={`rt ${className}`}>{children}</table>
    </div>
  );
}
