import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));
  }, [user?.id]);

  return (
    <div className="notifications-page">
      <style>{`
        .notifications-page h1 {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .notifications-page-list { display: flex; flex-direction: column; gap: 10px; }
        .notifications-page-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
        }
        .notifications-page-item.unread { background: var(--bg-soft); }
        .notifications-page-empty { color: var(--text-soft); font-size: 14px; }
      `}</style>
      <h1>{t("sidebar.notifications")}</h1>
      {notifications.length === 0 ? (
        <p className="notifications-page-empty">{t("sidebar.noNotifications")}</p>
      ) : (
        <div className="notifications-page-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notifications-page-item ${n.read ? "" : "unread"}`}>
              <Bell size={16} />
              <div>
                <p>{n.message || n.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
