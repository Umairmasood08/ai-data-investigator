import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const location = useLocation();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const links = [
    {
      label: "Dashboard",
      path: "/",
    },
    {
      label: "High Risk Cases",
      path: "/risk",
    },
    {
      label: "Knowledge Graph",
      path: "/graph",
    },
  ];

  const handleRebuildPipeline = async () => {
    setRunning(true);
    setStatus("Compiling...");
    try {
      const response = await fetch(`${API_URL}/api/pipeline/run`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.status === "success") {
        setStatus("Success!");
        alert("FBR Compliance Pipeline completed successfully and Neo4j Graph compiled!");
        // Refresh the page
        window.location.reload();
      } else {
        setStatus("Failed");
        alert(`Pipeline execution failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error");
      alert("Error reaching compliance server API.");
    } finally {
      setRunning(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <aside
      style={{
        width: "260px",
        background: "#0C1A0F",
        borderRight: "1px solid rgba(74,222,128,.12)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div>
        <h2
          style={{
            color: "#4ADE80",
            marginBottom: "40px",
            fontSize: "22px",
            fontWeight: 700
          }}
        >
          TaxGraph • FBR
        </h2>

        {links.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "block",
              marginBottom: "10px",
              padding: "14px 16px",
              borderRadius: "12px",
              textDecoration: "none",
              background:
                location.pathname === item.path
                  ? "rgba(74,222,128,.12)"
                  : "transparent",
              color:
                location.pathname === item.path
                  ? "#4ADE80"
                  : "#CBD5E1",
              border:
                location.pathname === item.path
                  ? "1px solid rgba(74,222,128,.25)"
                  : "1px solid transparent",
              transition: "all .2s"
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Admin actions block */}
      <div style={{ borderTop: "1px solid rgba(74,222,128,0.15)", paddingTop: "20px" }}>
        <button
          onClick={handleRebuildPipeline}
          disabled={running}
          style={{
            width: "100%",
            background: running ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.35)",
            color: "#4ADE80",
            padding: "12px 14px",
            borderRadius: "10px",
            cursor: running ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all .2s"
          }}
          onMouseEnter={e => { if(!running) e.currentTarget.style.background = "rgba(74,222,128,0.2)"; }}
          onMouseLeave={e => { if(!running) e.currentTarget.style.background = "rgba(74,222,128,0.12)"; }}
        >
          {running && <span style={{ width: "12px", height: "12px", border: "2px solid #4ADE80", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />}
          {status || "Run AI Pipeline"}
        </button>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </aside>
  );
}