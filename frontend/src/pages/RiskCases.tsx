import { useNavigate } from "react-router-dom";
import { taxpayers } from "../data/mock";

export default function RiskCases() {
  const nav = useNavigate();

  return (
    <div style={{ position: "relative" }}>
      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
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
            marginBottom: "18px",
          }}
        >
          HIGH PRIORITY CASES
        </div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: 800,
            color: "#fff",
            marginBottom: "10px",
          }}
        >
          High Risk <span style={{ color: "#4ADE80" }}>Taxpayers</span>
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            maxWidth: "650px",
            lineHeight: 1.6,
          }}
        >
          AI flagged taxpayers showing suspicious transaction patterns,
          undeclared assets, shell company associations, or unusual financial
          activity.
        </p>
      </div>

      {/* Cases */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {taxpayers.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#0C1A0F",
              border: "1px solid rgba(74,222,128,0.12)",
              borderRadius: "14px",
              padding: "22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all .25s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor =
                "rgba(74,222,128,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                "rgba(74,222,128,0.12)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Left */}
            <div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  {t.name}
                </h3>

                <span
                  style={{
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    color: "#4ADE80",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  FLAGGED
                </span>
              </div>

              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  margin: 0,
                  fontSize: "14px",
                }}
              >
                CNIC: {t.cnic}
              </p>
            </div>

            {/* Right */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "11px",
                    margin: 0,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  AI Risk Score
                </p>

                <p
                  style={{
                    color: "#4ADE80",
                    fontSize: "22px",
                    fontWeight: 700,
                    margin: "4px 0 0",
                  }}
                >
                  96%
                </p>
              </div>

              <button
                onClick={() => nav(`/investigation/${t.id}`)}
                style={{
                  background: "#4ADE80",
                  color: "#07100A",
                  border: "none",
                  padding: "11px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Investigate ↗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}