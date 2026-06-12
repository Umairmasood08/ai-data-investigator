import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

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

  return (
    <aside
      style={{
        width: "260px",
        background: "#0C1A0F",
        borderRight: "1px solid rgba(74,222,128,.12)",
        padding: "24px",
      }}
    >
      <h2
        style={{
          color: "#4ADE80",
          marginBottom: "40px",
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
          }}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}