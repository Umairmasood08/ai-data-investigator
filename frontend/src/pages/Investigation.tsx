import { useParams } from "react-router-dom";
import { taxpayers } from "../data/mock";
import { useGraphStore } from "../store/useGraphStore";

export default function Investigation() {
  const { id } = useParams();
  const user = taxpayers.find((t) => t.id === id);

  const selectedNode = useGraphStore((s) => s.selectedNode);

  if (!user)
    return (
      <div style={{ color: "white" }}>
        Case not found
      </div>
    );

  const activeNode = selectedNode?.data?.label;

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}
    >
      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* LEFT PANEL */}
      <div
        style={{
          background: "#0C1A0F",
          border: "1px solid rgba(74,222,128,0.12)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h1
          style={{
            color: "#4ADE80",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Case Investigation File
        </h1>

        {activeNode && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(74,222,128,0.25)",
              background: "rgba(74,222,128,0.05)",
              color: "#4ADE80",
            }}
          >
            Selected Entity: <b>{activeNode}</b>
          </div>
        )}

        {/* Risk Score Banner */}
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.15)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "12px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            AI Risk Assessment
          </p>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 800,
              color: "#4ADE80",
            }}
          >
            {user.score}
          </div>
        </div>

        {/* Taxpayer Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            color: "white",
          }}
        >
          <p><b>Name:</b> {user.name}</p>
          <p><b>CNIC:</b> {user.cnic}</p>
          <p><b>Declared Income:</b> PKR {user.income.toLocaleString()}</p>
          <p><b>Estimated Assets:</b> PKR {user.assets.toLocaleString()}</p>
        </div>

        {/* AI Explanation */}
        <div style={{ marginTop: "32px" }}>
          <h2
            style={{
              color: "#4ADE80",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            AI Risk Explanation
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.8,
            }}
          >
            The taxpayer demonstrates a substantial mismatch between
            declared income and detected assets. Cross-agency analysis
            identified luxury vehicle ownership, high-value real estate,
            repeated international travel, and utility consumption patterns
            inconsistent with reported earnings.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            style={{
              background: "#4ADE80",
              border: "none",
              color: "#07100A",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open Audit
          </button>

          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Mark For Review
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          background: "#0C1A0F",
          border: "1px solid rgba(74,222,128,0.12)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h1
          style={{
            color: "#4ADE80",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Knowledge Graph Snapshot
        </h1>

        {activeNode && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(74,222,128,0.25)",
              background: "rgba(74,222,128,0.05)",
              color: "#4ADE80",
            }}
          >
            Focused Node: <b>{activeNode}</b>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {[
            `👤 ${user.name}`,
            "🚗 Toyota Prado",
            "🏠 DHA Phase 6 House",
            "✈ Dubai Travel Activity",
            "⚡ High Utility Consumption",
          ].map((item) => (
            <div
              key={item}
              style={{
                background: "#07100A",
                border: "1px solid rgba(74,222,128,0.10)",
                borderRadius: "10px",
                padding: "14px",
                color: "white",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}