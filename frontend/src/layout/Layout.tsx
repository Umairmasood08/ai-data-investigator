import Sidebar from "./Sidebar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#07100A",
        color: "white",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* GLOBAL HEADER */}
        <header
          style={{
            height: "72px",
            borderBottom: "1px solid rgba(74,222,128,.12)",
            background: "#07100A",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "20px",
              }}
            >
              TaxGraph <span style={{ color: "#4ADE80" }}>•</span> FBR
            </h2>
          </div>

          <div
            style={{
              color: "rgba(255,255,255,.5)",
              fontSize: "14px",
            }}
          >
            AI Fraud Detection System
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}