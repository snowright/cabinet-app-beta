// src/components/FounderFollowSuggestion.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Three components for the founder follow flow:
//
//   <FollowSuggestionScreen>  — Full-screen onboarding step after theme picker
//   <FeedFollowCard>          — Compact card shown in empty feed
//   <FollowConfirmation>      — Dark celebration screen after following
//
// Also exports INVITE_PAYLOAD — used by the invite button in the empty feed.
//
// ⚠️  Before going live, fill in FOUNDER_PROFILE below with your real details.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// ── ✏️  EDIT THIS SECTION ────────────────────────────────────────────────────
export const FOUNDER_PROFILE = {
  name:           "Your Name",                   // ← your real name
  handle:         "@cabinet",                    // ← your handle
  bio:            "Founder of cabinet. Sharing the products I actually use — skincare, fragrance and the occasional wellness find.",
  avatarInitials: "YN",                          // ← initials shown if no photo
  avatarColor:    "#C8B8A2",
  avatarUrl:      null,                          // ← paste your avatar URL here once uploaded
  productCount:   24,                            // ← update as you add products
  isVerified:     true,
  userId:         "REPLACE_WITH_YOUR_USER_UUID", // ← your Supabase user ID (Settings → Users)
};

export const INVITE_PAYLOAD = {
  title: "cabinet.",
  text:  "I'm on cabinet. — a beauty shelf app where you can see exactly what products people are actually using. Come join me 🌿",
  url:   "https://the-cabinet.app",
};
// ─────────────────────────────────────────────────────────────────────────────

const INK    = "#1A1A1A";
const PARCH  = "#FDFAF7";
const ACCENT = "#C8B8A2";
const MUTED  = "#AAA";
const BORDER = "#EDE9E3";
const SERIF  = "'Cormorant Garamond', Georgia, serif";
const MONO   = "'DM Mono', monospace";
const SANS   = "'Jost', sans-serif";

function FounderAvatar({ size = 72 }) {
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: FOUNDER_PROFILE.avatarUrl ? "transparent" : `linear-gradient(145deg, ${ACCENT}, #B8A898)`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 0 3px ${PARCH}, 0 0 0 5px ${ACCENT}44`,
      }}>
        {FOUNDER_PROFILE.avatarUrl
          ? <img src={FOUNDER_PROFILE.avatarUrl} alt={FOUNDER_PROFILE.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontFamily: MONO, fontSize: size * 0.28, fontWeight: 700, color: "#FFF" }}>
              {FOUNDER_PROFILE.avatarInitials}
            </span>
        }
      </div>
      {FOUNDER_PROFILE.isVerified && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.32, height: size * 0.32, borderRadius: "50%",
          background: INK, border: `2.5px solid ${PARCH}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.13, color: ACCENT,
        }}>✦</div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1 — Full-screen onboarding step (after theme picker)
// ═════════════════════════════════════════════════════════════════════════════
export function FollowSuggestionScreen({ user, onFollow, onSkip }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const handleFollow = async () => {
    setState("loading");
    await onFollow(FOUNDER_PROFILE.userId);
    setState("done");
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: PARCH, overflowY: "auto",
      animation: "fadeUp 0.45s ease",
    }}>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatUp  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes spin     { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ flex: 1, padding: "52px 24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: ACCENT, letterSpacing: "0.18em", marginBottom: 14 }}>
          ONE LAST THING
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: INK, lineHeight: 1.15, marginBottom: 8 }}>
          A place to start,<br />{firstName}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, lineHeight: 1.65, marginBottom: 32 }}>
          Follow the official cabinet. account to seed your feed while the community grows.
        </div>

        {/* Founder card */}
        <div style={{
          background: "#FFF", border: `1.5px solid ${BORDER}`,
          borderRadius: 20, padding: "22px 20px", marginBottom: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          animation: "floatUp 5s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <FounderAvatar size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: INK }}>
                  {FOUNDER_PROFILE.name}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: ACCENT, background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, borderRadius: 4, padding: "2px 6px" }}>
                  OFFICIAL
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{FOUNDER_PROFILE.handle}</div>
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: "#666", fontStyle: "italic", lineHeight: 1.55 }}>
            "{FOUNDER_PROFILE.bio}"
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={state === "done" ? onSkip : handleFollow}
          disabled={state === "loading"}
          style={{
            width: "100%", padding: "16px",
            background: state === "done" ? "#4ADE80" : state === "loading" ? "#C8BFB5" : INK,
            border: "none", borderRadius: 14,
            fontFamily: MONO, fontSize: 13, letterSpacing: "0.1em",
            color: "#FFF", cursor: state === "loading" ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.3s",
          }}
        >
          {state === "loading" && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />}
          {state === "done" ? "✓ Following — continue →" : state === "loading" ? "Following…" : "+ Follow cabinet."}
        </button>
      </div>

      <button
        onClick={onSkip}
        style={{ background: "none", border: "none", fontFamily: SANS, fontSize: 13, color: MUTED, cursor: "pointer", padding: "20px 0 40px", textAlign: "center" }}
      >
        Skip for now
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2 — Inline card for empty feed
// ═════════════════════════════════════════════════════════════════════════════
export function FeedFollowCard({ onFollow }) {
  const [state, setState] = useState("idle");

  const handleFollow = async (e) => {
    e.stopPropagation();
    setState("loading");
    await onFollow(FOUNDER_PROFILE.userId);
    setState("done");
  };

  return (
    <div style={{
      background: "#FFF", border: `1.5px solid ${BORDER}`,
      borderRadius: 20, padding: "18px", marginBottom: 20, width: "100%",
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: ACCENT, letterSpacing: "0.14em", marginBottom: 14, textAlign: "center" }}>
        START BY FOLLOWING
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <FounderAvatar size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK }}>{FOUNDER_PROFILE.name}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{FOUNDER_PROFILE.handle} · {FOUNDER_PROFILE.productCount} products</div>
        </div>
        {state === "done" ? (
          <div style={{ background: "#F0F7F0", borderRadius: 20, padding: "6px 12px", fontFamily: MONO, fontSize: 10, color: "#5A9A6A" }}>✓</div>
        ) : (
          <button onClick={handleFollow} disabled={state === "loading"} style={{
            background: state === "loading" ? "#C8BFB5" : INK,
            border: "none", borderRadius: 20, padding: "7px 14px",
            fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em",
            color: "#FFF", cursor: state === "loading" ? "default" : "pointer", flexShrink: 0,
          }}>
            {state === "loading" ? "…" : "+ Follow"}
          </button>
        )}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: "#888", lineHeight: 1.55, fontStyle: "italic" }}>
        "{FOUNDER_PROFILE.bio}"
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3 — Full-screen follow confirmation (auto-advances after 2s)
// ═════════════════════════════════════════════════════════════════════════════
export function FollowConfirmation({ onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div onClick={onContinue} style={{
      flex: 1, background: INK,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", animation: "confFadeIn 0.4s ease",
    }}>
      <style>{`
        @keyframes confFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes confBounce { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
        @keyframes confRise   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes checkPop   { 0% { transform:scale(0); opacity:0; } 70% { transform:scale(1.2); } 100% { transform:scale(1); opacity:1; } }
        @keyframes shimmer    { 0%,100% { opacity:.4; } 50% { opacity:1; } }
      `}</style>

      <div style={{ marginBottom: 24, animation: "confBounce 2.5s ease-in-out infinite" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(145deg, ${ACCENT}, #B8A898)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: `0 0 40px ${ACCENT}30` }}>
          {FOUNDER_PROFILE.avatarUrl
            ? <img src={FOUNDER_PROFILE.avatarUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            : <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: "#FFF" }}>{FOUNDER_PROFILE.avatarInitials}</span>
          }
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: "50%", background: "#4ADE80", border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#FFF", animation: "checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>✓</div>
        </div>
      </div>

      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: PARCH, marginBottom: 10, textAlign: "center", animation: "confRise 0.5s ease 0.15s both" }}>
        You're following<br /><span style={{ color: ACCENT }}>{FOUNDER_PROFILE.handle}</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: "rgba(255,255,255,0.4)", animation: "confRise 0.5s ease 0.3s both" }}>
        Your feed is ready
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 40, animation: "confRise 0.5s ease 0.5s both" }}>
        {[0, 0.3, 0.6].map((d, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, opacity: 0.6, animation: `shimmer 1.4s ease-in-out ${d}s infinite` }} />)}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 4 — Invite empty state (shown when feed is empty after following)
// ═════════════════════════════════════════════════════════════════════════════
export function InviteEmptyState() {
  const [state, setState] = useState("idle"); // idle | copied

  const handleInvite = async () => {
    if (navigator.share) {
      try { await navigator.share(INVITE_PAYLOAD); } catch (e) { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${INVITE_PAYLOAD.text}\n${INVITE_PAYLOAD.url}`);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px 0" }}>
      {/* Envelope illustration */}
      <div style={{ marginBottom: 28, animation: "floatUp 4.5s ease-in-out infinite" }}>
        <style>{`@keyframes floatUp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }`}</style>
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <rect x="10" y="28" width="100" height="64" rx="8" fill="#FFF" stroke={BORDER} strokeWidth="2"/>
          <path d="M10 36 L60 65 L110 36" stroke={BORDER} strokeWidth="2" fill="none"/>
          <line x1="10" y1="92" x2="46" y2="62" stroke={BORDER} strokeWidth="1.5"/>
          <line x1="110" y1="92" x2="74" y2="62" stroke={BORDER} strokeWidth="1.5"/>
          <path d="M92 16 L93.5 20 L97.5 21.5 L93.5 23 L92 27 L90.5 23 L86.5 21.5 L90.5 20 Z" fill={ACCENT} opacity=".9"/>
          <path d="M22 10 L23 13 L26 14 L23 15 L22 18 L21 15 L18 14 L21 13 Z" fill={ACCENT} opacity=".5"/>
          <circle cx="104" cy="44" r="3" fill={ACCENT} opacity=".4"/>
        </svg>
      </div>

      <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: INK, lineHeight: 1.2, marginBottom: 10 }}>
        Better with friends
      </div>
      <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 248, marginBottom: 28 }}>
        Invite the people whose shelves you want to peek inside.
      </div>

      <button onClick={handleInvite} style={{
        width: "100%", maxWidth: 280, padding: "15px 28px",
        background: state === "copied" ? "#F0F7F0" : INK,
        border: state === "copied" ? `1.5px solid #C0E0C0` : "none",
        borderRadius: 16,
        fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em",
        color: state === "copied" ? "#4A9A5A" : PARCH,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        cursor: "pointer", transition: "background 0.25s",
      }}>
        {state === "copied" ? "✓ LINK COPIED" : (
          <>
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path d="M7 1L7 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M3.5 4.5L7 1L10.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 8V14C1 14.55 1.45 15 2 15H12C12.55 15 13 14.55 13 14V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            INVITE FRIENDS
          </>
        )}
      </button>
      {state === "idle" && (
        <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: "0.06em" }}>
          opens iMessage, WhatsApp & more
        </div>
      )}
    </div>
  );
}
