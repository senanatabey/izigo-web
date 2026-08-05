import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { fetchFounderCampaign, fetchFounderCount } from "../lib/founder";

/**
 * Shown on the homepage and the Create Listing page while the Founder
 * campaign is active — disappears automatically the moment the campaign
 * ends (status flips to inactive, or the cap is reached). Existing Founder
 * Hosts keep their benefits regardless; this banner only ever affects
 * whether *new* hosts see the invitation.
 *
 * Visibility fails OPEN: a fetch error (e.g. a migration not yet applied in
 * some environment) must never be mistaken for "campaign ended" and hide
 * this banner — only a confirmed inactive status or a reached cap should.
 */
export default function FounderBanner() {
  const [visible, setVisible] = useState(true);
  const [counts, setCounts] = useState(null); // { count, max } once known, else null

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFounderCampaign(), fetchFounderCount()])
      .then(([campaign, count]) => {
        if (cancelled) return;
        setVisible(campaign.status === "active" && count < campaign.max_founder_hosts);
        setCounts({ count, max: campaign.max_founder_hosts });
      })
      .catch(() => {
        if (cancelled) return;
        setVisible(true);
        setCounts(null);
      });
    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  return (
    <div className="founder-banner">
      <style>{`
        .founder-banner {
          display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
          background: var(--izigo-green); color: #fff; padding: 12px 20px; text-align: center; font-size: 13.5px;
        }
        .founder-banner strong { font-weight: 800; }
        .founder-banner a {
          display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.16);
          border-radius: 999px; padding: 6px 14px; font-weight: 700; font-size: 12.5px; color: #fff; white-space: nowrap;
        }
        .founder-banner a:hover { background: rgba(255,255,255,0.26); }
      `}</style>
      <span>
        🎉 <strong>Founder Host Campaign</strong>
        {counts ? ` — ${counts.count}/${counts.max} spots claimed.` : " —"} Unlock a Lifetime Founder Badge, Launch VIP Membership and Priority Search Ranking.
      </span>
      <Link to="/add-listing"><Trophy size={13} />Start your first listing</Link>
    </div>
  );
}
