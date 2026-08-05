import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Check, Circle, Gift, Award, Crown, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { isFounderCampaignJoinable } from "../../lib/founder";

const BENEFITS = [
  { icon: Award, title: "Lifetime Founder Badge", text: "A permanent badge on your profile and listings." },
  { icon: Crown, title: "1 Year Launch VIP Membership", text: "VIP status for your first year on IZIGO." },
  { icon: Rocket, title: "Priority Visibility", text: "Your listings get priority placement in search results." },
  { icon: ShieldCheck, title: "Early Verification Priority", text: "Your host verification gets reviewed first." },
  { icon: Gift, title: "Access to Future VIP Features", text: "First access to anything we launch during your first year." },
];

export default function WelcomePage() {
  const { user, refreshUser } = useAuth();
  const [listingCount, setListingCount] = useState(null);
  const [campaignJoinable, setCampaignJoinable] = useState(false);

  useEffect(() => {
    if (!user?.id || user.welcomeSeen) return;
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("host_id", user.id)
      .then(({ count }) => setListingCount(count || 0));
    isFounderCampaignJoinable().then(setCampaignJoinable).catch(() => setCampaignJoinable(false));
    supabase.from("profiles").update({ welcome_seen: true }).eq("id", user.id).then(() => refreshUser());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (user?.welcomeSeen) return <Navigate to="/profile" replace />;
  if (!user || listingCount === null) return null;

  const hasListings = listingCount > 0;
  const profileComplete = !!user.phone;

  const steps = [
    { label: "Create your account", done: true },
    { label: "Complete your profile", done: profileComplete },
    { label: "Publish your first listing", done: hasListings },
    { label: "Get verified", done: user.verified },
    { label: "Unlock Founder Benefits", done: user.founderHost, isFounder: true },
  ];

  return (
    <div className="welcome-page">
      <style>{`
        .welcome-page { max-width: 720px; margin: 0 auto; padding: 56px 6vw 80px; }
        .welcome-page .wp-head { text-align: center; margin-bottom: 32px; }
        .welcome-page .wp-head h1 { font-size: 30px; font-weight: 800; margin: 0 0 10px; }
        .welcome-page .wp-head p { font-size: 15px; color: var(--text-soft); line-height: 1.6; max-width: 520px; margin: 0 auto; }

        .welcome-page .wp-checklist { border: 1px solid var(--border); border-radius: 16px; padding: 22px 26px; margin-bottom: 28px; }
        .welcome-page .wp-checklist-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 14.5px; font-weight: 600; color: var(--text); }
        .welcome-page .wp-checklist-item.done { color: var(--izigo-green); }
        .welcome-page .wp-checklist-item .wp-check-icon { color: var(--izigo-green); flex-shrink: 0; }
        .welcome-page .wp-checklist-item .wp-circle-icon { color: var(--text-soft); flex-shrink: 0; }
        .welcome-page .wp-checklist-item.founder-row { font-weight: 800; }

        .welcome-page .wp-benefits-head { text-align: center; margin-bottom: 16px; }
        .welcome-page .wp-benefits-head h2 { font-size: 18px; font-weight: 800; margin: 0 0 6px; }
        .welcome-page .wp-benefits-head p { font-size: 13px; color: var(--text-soft); margin: 0; }
        .welcome-page .wp-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px; }
        .welcome-page .wp-benefit-card {
          display: flex; align-items: flex-start; gap: 12px; border: 1px solid var(--border); border-radius: 14px;
          padding: 16px; background: var(--bg-soft);
        }
        .welcome-page .wp-benefit-icon {
          width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: rgba(0,200,151,0.14); color: var(--izigo-green); flex-shrink: 0;
        }
        .welcome-page .wp-benefit-card h3 { font-size: 13.5px; font-weight: 800; margin: 0 0 4px; }
        .welcome-page .wp-benefit-card p { font-size: 12px; color: var(--text-soft); margin: 0; line-height: 1.4; }

        .welcome-page .wp-cta { text-align: center; }
        .welcome-page .wp-cta a {
          display: inline-flex; align-items: center; gap: 8px; background: var(--izigo-orange); color: #fff;
          border-radius: 10px; padding: 14px 28px; font-weight: 700; font-size: 15px; text-decoration: none;
        }

        @media (max-width: 640px) {
          .welcome-page .wp-benefits-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wp-head">
        <h1>🎉 Welcome to IZIGO!</h1>
        <p>You're joining IZIGO during our launch period. Become one of our Founding Hosts and unlock exclusive launch benefits.</p>
      </div>

      <div className="wp-checklist">
        {steps.map((step) => (
          <div className={`wp-checklist-item${step.done ? " done" : ""}${step.isFounder ? " founder-row" : ""}`} key={step.label}>
            {step.isFounder ? "🎁" : step.done ? <Check size={16} className="wp-check-icon" /> : <Circle size={14} className="wp-circle-icon" />}
            {step.label}
          </div>
        ))}
      </div>

      {campaignJoinable && !user.founderHost && (
        <>
          <div className="wp-benefits-head">
            <h2><Sparkles size={16} style={{ verticalAlign: "-2px", marginRight: 6 }} />Founder Benefits</h2>
            <p>Available while our launch campaign is active.</p>
          </div>
          <div className="wp-benefits-grid">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div className="wp-benefit-card" key={title}>
                <div className="wp-benefit-icon"><Icon size={18} /></div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="wp-cta">
        {hasListings ? (
          <Link to="/my-listings">Go to My Listings</Link>
        ) : (
          <Link to="/add-listing">Create My First Listing</Link>
        )}
      </div>
    </div>
  );
}
