import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetchFlaggedCases } from "../hooks/useFetchData";
import { useGraphStore } from "../store/useGraphStore";
import { apiService } from "../services/api";
import { jsPDF } from "jspdf";

export default function Investigation() {
  const nav = useNavigate();
  const { id } = useParams();
  const { loading: casesLoading, error, flaggedEntities } = useFetchFlaggedCases();
  
  // Find taxpayer
  const user = flaggedEntities.find(
    (t) => t.cnic === id || t.full_name === id || t.cnic === decodeURIComponent(id || "")
  );

  const selectedNode = useGraphStore((s) => s.selectedNode);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch dynamic AI audit explanation
  useEffect(() => {
    if (!user) return;
    const cnic = user.cnic;
    async function fetchAIExplanation() {
      setAiLoading(true);
      try {
        const res = await apiService.getAIAuditExplanation(cnic);
        setAiExplanation(res.explanation);
      } catch (err) {
        console.error(err);
        setAiExplanation("AI explanation failed to load. Please verify API server status.");
      } finally {
        setAiLoading(false);
      }
    }
    fetchAIExplanation();
  }, [user]);

  const parseAuditTrail = (trail?: string) => {
    if (!trail) return [];
      return trail
        .split(/;|\n|\r|\|/)
        .map((item) => item.trim())
        .filter(Boolean);
  };

  const downloadAuditReport = () => {
    if (!user) return;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    let y = 50;

    const checkPage = (extra = 20) => {
      if (y + extra > 740) {
        doc.addPage();
        y = 50;
      }
    };

    // Header styling: Official Banner
    doc.setFillColor(7, 26, 15);
    doc.rect(0, 0, pageWidth, 90, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(74, 222, 128); // Green
    doc.text("FEDERAL BOARD OF REVENUE (FBR) - PAKISTAN", margin, 38);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("SOVEREIGN TAX NET COMPLIANCE & REVENUE FRAUD DIVISION", margin, 52);
    doc.text(`CONFIDENTIAL AUDIT REPORT | GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 66);
    y = 120;

    // Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 15, 15);
    doc.text("LIFESTYLE DISCREPANCY AUDIT FILE", margin, y);
    y += 24;

    doc.setDrawColor(74, 222, 128);
    doc.setLineWidth(2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 28;

    // Taxpayer profile section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("1. TAXPAYER CANONICAL IDENTIFICATION", margin, y);
    y += 18;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    // Profile Details Grid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    doc.text("Name:", margin, y);
    doc.text("CNIC:", margin + 250, y);
    y += 16;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(user.full_name || "Unknown", margin, y);
    doc.text(user.cnic, margin + 250, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("City:", margin, y);
    doc.text("FBR Filing Status:", margin + 250, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(user.city || "Unknown", margin, y);
    doc.text(user.tax_deviation_score === 100 ? "NON-FILER (Critical Risk)" : "FILER (Income Under-reporting Risk)", margin + 250, y);
    y += 28;

    // Risk Scores Box
    checkPage(60);
    doc.setFillColor(245, 247, 245);
    doc.rect(margin, y, pageWidth - margin * 2, 54, "F");
    doc.setDrawColor(200, 220, 200);
    doc.rect(margin, y, pageWidth - margin * 2, 54, "D");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("TAX COMPLIANCE SCORE", margin + 20, y + 20);
    doc.text("ML ANOMALY RISK RATING", margin + 220, y + 20);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 69, 96); // Red risk
    doc.text(`${user.tax_deviation_score}/100`, margin + 20, y + 42);
    
    doc.setTextColor(245, 158, 11); // Amber risk
    doc.text(`${Math.round(user.ml_anomaly_score)}%`, margin + 220, y + 42);
    y += 80;

    // Evidence Checklist
    checkPage(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("2. COMPILED FINANCIAL DISCREPANCY EVIDENCE", margin, y);
    y += 18;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    const trailLines = parseAuditTrail(user.audit_trail);
    if (trailLines.length > 0) {
      trailLines.forEach((item) => {
        checkPage(22);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(item, pageWidth - margin * 2 - 20);
        doc.text(`[X]  ${lines[0]}`, margin, y);
        y += 15;

        for (let i = 1; i < lines.length; i++) {
          doc.text(`     ${lines[i]}`, margin + 20, y);
          y += 15;
        }
        y += 4;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.text("No specific evidence trail found.", margin, y);
      y += 20;
    }
    y += 24;

    // AI Forensic Justification
    checkPage(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("3. FORENSIC INTELLIGENCE JUSTIFICATION (AI)", margin, y);
    y += 18;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    const explainText = aiExplanation || "Forensic AI analysis compilation pending. Verify server connection.";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const paragraphs = explainText.split("\n\n");
    paragraphs.forEach(p => {
      const pClean = p.replace(/###/g, "").trim();
      if (!pClean) return;
      const lines = doc.splitTextToSize(pClean, pageWidth - margin * 2);
      checkPage(lines.length * 15 + 10);
      doc.text(lines, margin, y);
      y += lines.length * 15 + 12;
    });

    y += 30;

    // Signature Block
    checkPage(80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Report Compiled By: FBR Automated Compliance Engine", margin, y);
    y += 16;
    doc.text("Authorized Signature: ____________________________________", margin, y);
    y += 16;
    doc.text("FBR Audit Division Stamp / Approval Seal", margin, y);

    const fileName = `FBR_Audit_${(user.full_name || "Taxpayer").replace(/\s+/g, "_")}_${user.cnic}.pdf`;
    doc.save(fileName);
  };

  if (casesLoading)
    return <div style={{ color: "white", padding: "40px", textAlign: "center" }}>Loading case file...</div>;

  if (error)
    return <div style={{ color: "#FF4560", padding: "40px" }}>Error: {error}</div>;

  if (!user)
    return <div style={{ color: "white", padding: "40px", textAlign: "center" }}>Case file not found.</div>;

  const activeNode = selectedNode?.data?.label;

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        fontFamily: "'Inter', sans-serif",
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

      {/* LEFT PANEL: Taxpayer profile & AI audit explanation */}
      <div
        style={{
          background: "#0C1A0F",
          border: "1px solid rgba(74,222,128,0.12)",
          borderRadius: "16px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>
              Audit Case File
            </h1>
            <span style={{ padding: "4px 12px", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "999px", fontSize: "11px", color: "#4ADE80", fontWeight: 600 }}>
              CNIC ATTACHED
            </span>
          </div>

          {activeNode && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(74,222,128,0.25)",
                background: "rgba(74,222,128,0.05)",
                color: "#4ADE80",
                fontSize: "13px"
              }}
            >
              Focused Asset Node: <b>{activeNode}</b>
            </div>
          )}

          {/* Risk Scores Banner */}
          <div
            style={{
              background: "rgba(255, 69, 96, 0.07)",
              border: "1px solid rgba(255, 69, 96, 0.2)",
              borderRadius: "12px",
              padding: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: ".05em" }}>FBR Risk Assessment</p>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#FF4560" }}>
                {user.tax_deviation_score >= 80 ? "Critical Anomaly" : "High Compliance Risk"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: ".05em" }}>Deviation Score</p>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#FF4560" }}>{user.tax_deviation_score}/100</div>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "16px", color: "#E2E8F0", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>Name:</b> <span>{user.full_name || "Unknown"}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>CNIC:</b> <span>{user.cnic}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>City:</b> <span>{user.city || "Unknown"}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>Declared Income:</b> <span>{user.tax_deviation_score === 100 ? "No Filings Recorded" : "Under PKR 500k"}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>ML Anomaly Rating:</b> <span style={{ color: "#F59E0B", fontWeight: 600 }}>{Math.round(user.ml_anomaly_score)}% Anomaly Risk</span></div>
        </div>

        {/* Dynamic AI Justification Text */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
          <h2 style={{ color: "#4ADE80", fontSize: "16px", fontWeight: 700, margin: "0 0 12px 0" }}>
            AI Forensic Reasoning Trail
          </h2>
          {aiLoading ? (
            <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: "10px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
              <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid #4ADE80", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
              Triggering FBR AI reasoning engine...
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.65", fontSize: "13px", height: "240px", overflowY: "auto", paddingRight: "10px" }}>
              {aiExplanation ? (
                aiExplanation.split("\n\n").map((para, idx) => {
                  const cleanPara = para.replace(/###/g, "").trim();
                  if (cleanPara.startsWith("1.") || cleanPara.startsWith("FINANCIAL")) {
                    return <p key={idx} style={{ marginTop: 0, color: "#fff" }}><b>Financial Compliance Summation:</b> {cleanPara.replace(/^[0-9\.\s]*[A-Z_]*:/, "")}</p>;
                  }
                  if (cleanPara.startsWith("2.") || cleanPara.startsWith("GRAPH")) {
                    return <p key={idx} style={{ color: "#A78BFA" }}><b>Graph Network Risk:</b> {cleanPara.replace(/^[0-9\.\s]*[A-Z_]*:/, "")}</p>;
                  }
                  if (cleanPara.startsWith("3.") || cleanPara.startsWith("EVIDENTIARY")) {
                    return <p key={idx}><b>Evidentiary Pathway:</b> {cleanPara.replace(/^[0-9\.\s]*[A-Z_]*:/, "")}</p>;
                  }
                  if (cleanPara.startsWith("4.") || cleanPara.startsWith("PROCEDURAL")) {
                    return <p key={idx} style={{ color: "#4ADE80" }}><b>Procedural Recommendation:</b> {cleanPara.replace(/^[0-9\.\s]*[A-Z_]*:/, "")}</p>;
                  }
                  return <p key={idx}>{cleanPara}</p>;
                })
              ) : (
                "AI justification trail unavailable. Verify connection."
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
          <button
            onClick={downloadAuditReport}
            style={{
              flex: 1,
              background: "#4ADE80",
              border: "none",
              color: "#07100A",
              padding: "13px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "opacity .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Download Audit Report (PDF)
          </button>
          <button
            onClick={() => nav(`/graph?cnic=${encodeURIComponent(user.cnic)}`)}
            style={{
              background: "transparent",
              border: "1px solid rgba(74,222,128,0.3)",
              color: "#4ADE80",
              padding: "13px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(74,222,128,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Explore Knowledge Network ↗
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Structured Assets & Relationship Summary */}
      <div
        style={{
          background: "#0C1A0F",
          border: "1px solid rgba(74,222,128,0.12)",
          borderRadius: "16px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
      >
        <h2 style={{ color: "#4ADE80", fontSize: "18px", fontWeight: 700, margin: 0, borderBottom: "1px solid rgba(74,222,128,0.15)", paddingBottom: "10px" }}>
          Detected Asset Inventory
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "450px" }}>
          {parseAuditTrail(user.audit_trail).map((item, idx) => {
            let icon = "📋";
            let borderColor = "rgba(255,255,255,0.06)";
            let badge = "Indicator";
            let badgeColor = "rgba(255,255,255,0.15)";
            let badgeText = "rgba(255,255,255,0.7)";

            if (item.toLowerCase().includes("filer")) {
              icon = "👤";
              borderColor = "rgba(255, 69, 96, 0.2)";
              badge = "Registration";
              badgeColor = "rgba(255, 69, 96, 0.1)";
              badgeText = "#FF4560";
            } else if (item.toLowerCase().includes("vehicle")) {
              icon = "🚗";
              borderColor = "rgba(14, 165, 233, 0.2)";
              badge = "Excise Asset";
              badgeColor = "rgba(14, 165, 233, 0.1)";
              badgeText = "#0EA5E9";
            } else if (item.toLowerCase().includes("utility") || item.toLowerCase().includes("bill")) {
              icon = "⚡";
              borderColor = "rgba(249, 115, 22, 0.2)";
              badge = "Consumption";
              badgeColor = "rgba(249, 115, 22, 0.1)";
              badgeText = "#F97316";
            } else if (item.toLowerCase().includes("propert")) {
              icon = "🏢";
              borderColor = "rgba(245, 158, 11, 0.2)";
              badge = "Real Estate";
              badgeColor = "rgba(245, 158, 11, 0.1)";
              badgeText = "#F59E0B";
            } else if (item.toLowerCase().includes("travel") || item.toLowerCase().includes("flight")) {
              icon = "✈️";
              borderColor = "rgba(139, 92, 246, 0.2)";
              badge = "Travel Trip";
              badgeColor = "rgba(139, 92, 246, 0.1)";
              badgeText = "#8B5CF6";
            } else if (item.toLowerCase().includes("warning") || item.toLowerCase().includes("benami")) {
              icon = "⚠️";
              borderColor = "rgba(239, 68, 68, 0.3)";
              badge = "ER Mismatch";
              badgeColor = "rgba(239, 68, 68, 0.15)";
              badgeText = "#EF4444";
            } else if (item.toLowerCase().includes("network") || item.toLowerCase().includes("shares address") || item.toLowerCase().includes("risk")) {
              icon = "🕸️";
              borderColor = "rgba(167, 139, 250, 0.2)";
              badge = "Network Link";
              badgeColor = "rgba(167, 139, 250, 0.1)";
              badgeText = "#A78BFA";
            }

            return (
              <div
                key={idx}
                style={{
                  background: "#07100A",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start"
                }}
              >
                <span style={{ fontSize: "20px", paddingTop: "2px" }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: badgeColor, color: badgeText, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".02em" }}>
                      {badge}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "12.5px", lineHeight: "1.5" }}>{item}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Tip */}
        <div style={{ padding: "14px", background: "rgba(74,222,128,0.04)", border: "1px dashed rgba(74,222,128,0.2)", borderRadius: "10px", color: "rgba(255,255,255,0.5)", fontSize: "11.5px", lineHeight: "1.4" }}>
          💡 <b>Auditor Tip:</b> Click "Explore Knowledge Network" to open the interactive topology explorer, where you can trace proxy buyers, shared locations, and Louvain network communities visually in real-time.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}