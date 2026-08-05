import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

/**
 * Lightweight "nothing here" state for admin pages — small icon, a short
 * message, and an optional primary action instead of a bare white page.
 */
export default function AdminEmptyState({ icon: Icon = Inbox, message, actionLabel, actionTo }) {
  return (
    <div className="admin-empty-state">
      <style>{`
        .admin-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 48px 20px; text-align: center; color: var(--text-soft);
        }
        .admin-empty-state-icon {
          width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--bg-soft); color: var(--text-soft);
        }
        .admin-empty-state p { margin: 0; font-size: 14px; font-weight: 600; }
        .admin-empty-state a {
          margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; background: var(--izigo-green);
          color: #fff; border-radius: 10px; padding: 9px 18px; font-size: 13.5px; font-weight: 700;
        }
      `}</style>
      <div className="admin-empty-state-icon"><Icon size={20} /></div>
      <p>{message}</p>
      {actionLabel && actionTo && <Link to={actionTo}>{actionLabel}</Link>}
    </div>
  );
}
