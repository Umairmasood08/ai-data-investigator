import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "Total taxpayers", value: "12,480", color: "text-white" },
    { label: "Flagged cases",   value: "342",    color: "text-[#FF4560]" },
    { label: "AI confidence",   value: "96.8%",  color: "text-[#4ADE80]" },
    { label: "Active probes",   value: "94",     color: "text-[#FFB020]" },
  ];

  const modules = [
    {
      title: "High Risk Cases",
      desc:  "Flagged taxpayers requiring immediate review",
      route: "/risk",
      accent: "#FF4560",
      stat:   "94 active",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#FF4560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      ),
    },
    {
      title: "Investigations",
      desc:  "Deep taxpayer intelligence & entity profiling",
      route: "/investigation/1",
      accent: "#4ADE80",
      stat:   "12 open",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
    },
    {
      title: "Knowledge Graph",
      desc:  "Entity relationships & hidden asset networks",
      route: "/graph",
      accent: "#A78BFA",
      stat:   "Live",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="18" cy="5"  r="3"/><circle cx="6"  cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07100A",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Green glow bloom (top-right, mirrors Strobes) ── */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.04) 55%, transparent 75%)",
          pointerEvents: "none",
        }}
      />
      {/* ── Faint dark green left bloom ── */}
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          left: "-120px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ══════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════ */}
      
      
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 48px 64px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(74,222,128,0.10)",
            border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: "999px",
            padding: "5px 14px",
            fontSize: "12px",
            color: "#4ADE80",
            marginBottom: "28px",
            letterSpacing: "0.08em",
            fontWeight: 500,
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
          AI-DRIVEN INTELLIGENCE
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(36px, 5.5vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            maxWidth: "820px",
            margin: "0 auto 20px",
          }}
        >
          AI-Driven Tax Fraud
          <br />
          <span style={{ color: "#4ADE80" }}>Detection System</span>
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.5)",
            maxWidth: "520px",
            margin: "0 auto 40px",
            lineHeight: 1.65,
          }}
        >
          Connect fragmented government data into a unified knowledge graph.
          Detect hidden networks, flag risk entities, and accelerate FBR investigations — all in real time.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/risk")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "13px 28px",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "border-color .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
          >
            View High Risk Cases
          </button>
          <button
            onClick={() => navigate("/graph")}
            style={{
              background: "#4ADE80",
              border: "none",
              color: "#07100A",
              padding: "13px 28px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Explore Graph
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
              }}
            >
              ↗
            </span>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STAT STRIP
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              flex: "1 1 0",
              padding: "28px 32px",
              borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", marginBottom: "8px", textTransform: "uppercase" }}>
              {s.label}
            </p>
            <p className={s.color} style={{ fontSize: "26px", fontWeight: 700, color: s.color === "text-white" ? "#fff" : s.color === "text-[#FF4560]" ? "#FF4560" : s.color === "text-[#4ADE80]" ? "#4ADE80" : "#FFB020" }}>
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════
          MODULE CARDS  (mirrors Strobes' 3-column cards)
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        {modules.map((m, i) => (
          <div
            key={i}
            onClick={() => navigate(m.route)}
            style={{
              background: "#07100A",
              padding: "36px 32px",
              cursor: "pointer",
              transition: "background .2s",
              position: "relative",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0C1A0F")}
            onMouseLeave={e => (e.currentTarget.style.background = "#07100A")}
          >
            {/* Icon box */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: `${m.accent}18`,
                border: `1px solid ${m.accent}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              {m.icon}
            </div>

            {/* Title + stat */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: 0 }}>
                {m.title}
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: `${m.accent}18`,
                  color: m.accent,
                  border: `1px solid ${m.accent}35`,
                  whiteSpace: "nowrap",
                  marginLeft: "10px",
                }}
              >
                {m.stat}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 24px" }}>
              {m.desc}
            </p>

            {/* Thin accent line */}
            <div
              style={{
                height: "2px",
                width: "40px",
                background: m.accent,
                borderRadius: "2px",
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════
          LOGO STRIP  (mirrors Strobes' partner logos)
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "48px",
          padding: "32px 48px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 10,
        }}
      >
        {["FBR", "NADRA", "PEMRA", "SBP", "FIA", "SECP"].map((org) => (
          <span
            key={org}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            {org}
          </span>
        ))}
      </section>
    </div>
  );
}
