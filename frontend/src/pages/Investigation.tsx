import { useNavigate, useParams } from "react-router-dom";
import { useFetchFlaggedCases } from "../hooks/useFetchData";
import { useGraphStore } from "../store/useGraphStore";
import { jsPDF } from "jspdf";

export default function Investigation() {
  const nav = useNavigate();
  const { id } = useParams();
  const { loading, error, flaggedEntities } = useFetchFlaggedCases();
  const user = flaggedEntities.find(
    (t) => t.cnic === id || t.full_name === id || t.cnic === decodeURIComponent(id || "")
  );

  const selectedNode = useGraphStore((s) => s.selectedNode);

  const parseAuditTrail = (trail?: string) => {
    if (!trail) return [];
    return trail
      .split(/;|\n|\r|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

const downloadAuditReport = () => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  let y = 60;

  const checkPage = (extra = 20) => {
    if (y + extra > 740) {
      doc.addPage();
      y = 60;
    }
  };

  const title = (text: string) => {
    checkPage(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    doc.text(text, margin, y);
    y += 28;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
    y += 22;

    doc.setDrawColor(74, 222, 128);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 28;
  };

  const section = (text: string) => {
    checkPage(30);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 15, 15);
    doc.text(text, margin, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
  };

  const text = (value: string, options: { size?: number; color?: [number, number, number] } = {}) => {
    checkPage(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(options.size ?? 11);
    doc.setTextColor(...(options.color ?? [80, 80, 80]));

    const lines = doc.splitTextToSize(value, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 16;
  };

  const bulletList = (items: string[]) => {
    items.forEach((item) => {
      checkPage(24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      const lines = doc.splitTextToSize(item, pageWidth - margin * 2 - 15);
      doc.text(`• ${lines[0]}`, margin, y);
      y += 16;

      for (let i = 1; i < lines.length; i++) {
        doc.text(`  ${lines[i]}`, margin + 10, y);
        y += 16;
      }

      y += 4;
    });
  };

  const trailLines = parseAuditTrail(user?.audit_trail);

  title("AUDIT REPORT");

  section("Taxpayer Summary");
  text(`Name: ${user?.full_name || "Unknown"}`, { size: 12 });
  text(`CNIC: ${user?.cnic}`, { size: 12 });
  text(`City: ${user?.city || "Unknown"}`, { size: 12 });
  text(`AI Anomaly Score: ${user?.ml_anomaly_score ?? "-"}`, { size: 12 });
  text(`Tax Deviation Score: ${user?.tax_deviation_score ?? "-"}`, { size: 12 });
  text(
    `Flagged Status: ${
      user?.flagged === 1 ? "Flagged for review" : "Normal"
    }`,
    { size: 12 }
  );

  section("Asset & Audit Trail Details");
  if (trailLines.length > 0) {
    bulletList(trailLines);
  } else {
    text("No asset summary available.");
  }

  section("Investigation Notes");
  text(
    "The taxpayer profile is associated with significant asset declarations that are inconsistent with reported income. " +
      "This report highlights key findings and supports further review by audit and compliance teams.",
    { size: 12 }
  );

  text(
    "Recommended actions: verify source-of-funds for high-value assets, compare declared income to bank and utility consumption records, " +
      "and validate foreign travel expenditures against tax filings.",
    { size: 12 }
  );

  const fileName = `${(user?.full_name || "audit_report").replace(/\s+/g, "_")}_${
    user?.cnic || "profile"
  }.pdf`;
  doc.save(fileName);
};
  if (loading)
    return <div style={{ color: "white" }}>Loading investigation...</div>;

  if (error)
    return <div style={{ color: "#FF4560" }}>Error: {error}</div>;

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
            {user.ml_anomaly_score >= 80
              ? "High Risk"
              : user.ml_anomaly_score >= 50
              ? "Moderate Risk"
              : "Low Risk"}
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
          <p><b>Name:</b> {user.full_name || "Unknown"}</p>
          <p><b>CNIC:</b> {user.cnic}</p>
          <p><b>City:</b> {user.city || "Unknown"}</p>
          <p><b>Tax Deviation Score:</b> {user.tax_deviation_score ?? "-"}</p>
          <p><b>AI Anomaly Score:</b> {user.ml_anomaly_score ?? "-"}</p>
          <p><b>Assets Summary:</b> {user.audit_trail || "No asset summary available"}</p>
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
            onClick={downloadAuditReport}
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
            Download Audit Report
          </button>
          <button
            onClick={() => nav(`/graph?cnic=${encodeURIComponent(user.cnic)}`)}
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
            Open Knowledge Graph
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
            `👤 ${user.full_name || "Unknown"}`,
            user.audit_trail
              ? `🔍 Asset details: ${user.audit_trail}`
              : "No asset history available",
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