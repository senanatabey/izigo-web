import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotificationBell({ userId }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = () => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data || []));
  };

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="notification-bell" ref={ref}>
      <style>{`
        .notification-bell { position: relative; }
        .notification-bell .nb-btn {
          position: relative; display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
          border: none; background: none; color: inherit; font: inherit; cursor: pointer; padding: 10px 12px; border-radius: 10px;
        }
        .notification-bell .nb-dot {
          position: absolute; top: 6px; left: 20px; width: 8px; height: 8px; border-radius: 50%; background: var(--izigo-orange);
        }
        .notification-bell .nb-dropdown {
          position: absolute; left: 0; top: calc(100% + 6px); width: 300px; max-height: 360px; overflow-y: auto;
          background: #fff; color: var(--text); border: 1px solid var(--border); border-radius: 12px;
          box-shadow: var(--shadow-md); z-index: 50; padding: 8px;
        }
        .notification-bell .nb-item { display: block; padding: 10px 10px; border-radius: 8px; font-size: 13px; line-height: 1.5; }
        .notification-bell .nb-item:hover { background: var(--bg-soft); }
        .notification-bell .nb-item.unread { font-weight: 700; }
        .notification-bell .nb-time { display: block; font-size: 11px; color: var(--text-soft); font-weight: 500; margin-top: 2px; }
        .notification-bell .nb-empty { padding: 16px; font-size: 13px; color: var(--text-soft); text-align: center; }
      `}</style>
      <button type="button" className="nb-btn" onClick={toggleOpen}>
        <Bell size={17} />
        {t("sidebar.notifications")}
        {unreadCount > 0 && <span className="nb-dot" />}
      </button>
      {open && (
        <div className="nb-dropdown">
          {notifications.length === 0 ? (
            <div className="nb-empty">{t("sidebar.noNotifications")}</div>
          ) : (
            notifications.map((n) => (
              <Link to={n.link || "#"} className={`nb-item${n.read ? "" : " unread"}`} key={n.id} onClick={() => setOpen(false)}>
                {n.message}
                <span className="nb-time">{new Date(n.created_at).toLocaleDateString()}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
