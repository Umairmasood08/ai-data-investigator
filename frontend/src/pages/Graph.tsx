import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";

import type { Node, Edge } from "reactflow";
import type { MouseEvent } from "react";
import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/useGraphStore";
import { useFetchFlaggedCases } from "../hooks/useFetchData";

function GraphInner({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.3 }), 100);
    return () => clearTimeout(t);
  }, [fitView]);

  const onNodeClick = (_event: MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const styledNodes = useMemo(() => {
    return nodes.map((n) => {
      const isSelected = selectedNode?.id === n.id;
      return {
        ...n,
        style: {
          ...n.style,
          boxShadow: isSelected ? "0 0 20px #00D4FF" : "none",
          border: isSelected ? "2px solid #00D4FF" : "1px solid #1A2640",
          padding: isSelected ? 14 : 10,
          transition: "all 0.2s ease",
        },
      };
    });
  }, [nodes, selectedNode]);

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={edges}
      onNodeClick={onNodeClick}
      fitView
      style={{ width: "100%", height: "100%" }}
    >
      <Background color="#1A2640" gap={18} />
      <Controls />
      <MiniMap nodeColor={() => "#00D4FF"} />
    </ReactFlow>
  );
}

function buildGraph(user: any) {
  const nodes: Array<{ id: string; label: string; kind: string }> = [];
  const edges: Edge[] = [];

  if (!user) {
    return { nodes: [], edges };
  }

  nodes.push({
    id: "person",
    label: user.full_name || user.cnic,
    kind: "main",
  });

  if (user.city) {
    nodes.push({
      id: "city",
      label: `City: ${user.city}`,
      kind: "asset",
    });
  }

  if (user.tax_deviation_score != null) {
    nodes.push({
      id: "tax",
      label: `Tax score: ${user.tax_deviation_score}`,
      kind: "activity",
    });
  }

  if (user.ml_anomaly_score != null) {
    nodes.push({
      id: "anomaly",
      label: `Anomaly: ${user.ml_anomaly_score}`,
      kind: "activity",
    });
  }

  if (user.lifestyle_index != null) {
    nodes.push({
      id: "lifestyle",
      label: `Lifestyle index: ${user.lifestyle_index}`,
      kind: "asset",
    });
  }

  // Asset nodes from audit trail
  if (user.audit_trail) {
    const parts = user.audit_trail
      .split("|")
      .map((p: string) => p.trim())
      .filter(Boolean);

    parts.forEach((part: string, i: number) => {
      const short =
        part.length > 55 ? part.slice(0, 52) + "..." : part;

      nodes.push({
        id: `asset-${i}`,
        label: short,
        kind: "asset",
        full: part,
      } as any);
    });
  }

  nodes.push({
    id: "flagged",
    label: `Flagged: ${user.flagged ? "Yes" : "No"}`,
    kind: "asset",
  });

  // Create edges
  nodes.forEach((node) => {
    if (node.id !== "person") {
      edges.push({
        id: `e-person-${node.id}`,
        source: "person",
        target: node.id,
        animated: true,
      });
    }
  });

  // ==========================
  // IMPROVED AUTO LAYOUT
  // ==========================

  const centerX = 900;
  const centerY = 500;

  const personNode = nodes.find((n) => n.id === "person");

  if (personNode) {
    (personNode as any).position = {
      x: centerX,
      y: centerY,
    };
  }

  const activityNodes = nodes.filter(
    (n) => n.kind === "activity"
  );

  const assetNodes = nodes.filter(
    (n) => n.kind === "asset"
  );

  // --------------------------
  // Activity Ring
  // --------------------------

  const activityRadius = 350;

  activityNodes.forEach((node, index) => {
    const angle =
      (index * Math.PI * 2) /
      Math.max(activityNodes.length, 1);

    (node as any).position = {
      x: centerX + Math.cos(angle) * activityRadius,
      y: centerY + Math.sin(angle) * activityRadius,
    };
  });

  // --------------------------
  // Asset Ring
  // --------------------------

  const estimatedNodeWidth = 230;
  const desiredGap = 100;

  const circumferenceNeeded =
    assetNodes.length *
    (estimatedNodeWidth + desiredGap);

  const assetRadius = Math.max(
    520,
    circumferenceNeeded / (2 * Math.PI)
  );

  assetNodes.forEach((node, index) => {
    const angle =
      (index * Math.PI * 2) /
      Math.max(assetNodes.length, 1);

    (node as any).position = {
      x: centerX + Math.cos(angle) * assetRadius,
      y: centerY + Math.sin(angle) * assetRadius,
    };
  });

  return { nodes, edges };
}
export default function Graph() {
  const [searchParams] = useSearchParams();
  const cnic = searchParams.get("cnic");
  const { loading, error, flaggedEntities } = useFetchFlaggedCases();
  const navigate = useNavigate();

  const selectedNode = useGraphStore((s) => s.selectedNode);

  const user = flaggedEntities.find((t) => t.cnic === cnic);
  const graphData = useMemo(() => buildGraph(user), [user]);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0D1420", color: "#fff" }}>
      <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "#4ADE80",
            border: "none",
            color: "#07100A",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Knowledge Graph</h1>
      </div>

      {loading && <div style={{ padding: "24px" }}>Loading graph...</div>}
      {error && <div style={{ padding: "24px", color: "#FF4560" }}>Error: {error}</div>}
      {!cnic && !loading && !error && (
        <div style={{ padding: "24px" }}>Open a case from Investigation to view that person's graph.</div>
      )}
      {cnic && !user && !loading && !error && (
        <div style={{ padding: "24px" }}>No graph found for CNIC {cnic}.</div>
      )}
      {user && graphData.nodes.length > 0 && (
        <div style={{ width: "100%", height: "70vh" }}>
          <ReactFlowProvider>
            <GraphInner nodes={graphData.nodes.map((n, i) => ({
              id: n.id,
              data: { label: n.label, kind: n.kind, full: (n as any).full },
              position: (n as any).position || {
                x: 300 + Math.cos((i / Math.max(graphData.nodes.length, 1)) * 2 * Math.PI) * 200,
                y: 250 + Math.sin((i / Math.max(graphData.nodes.length, 1)) * 2 * Math.PI) * 150,
              },
              style: {
                background: n.kind === "activity" ? "#FFB020" : n.kind === "asset" ? "#0EA5A4" : "#FF4560",
                color: n.kind === "asset" ? "#000" : "#000",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #1A2640",
                fontWeight: n.kind === "main" ? "bold" : "normal",
              },
            }))} edges={graphData.edges} />
          </ReactFlowProvider>
        </div>
      )}
      {user && (
        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ background: "#0C1A0F", border: "1px solid rgba(74,222,128,0.12)", borderRadius: "16px", padding: "20px" }}>
            <h2 style={{ color: "#4ADE80", marginBottom: "12px" }}>Person</h2>
            <p>{user.full_name || user.cnic}</p>
            <p>City: {user.city || "Unknown"}</p>
            <p>Tax Score: {user.tax_deviation_score ?? "-"}</p>
            <p>Anomaly: {user.ml_anomaly_score ?? "-"}</p>
            <p>Asset Summary: {user.audit_trail ? `${user.audit_trail.split('|')[0].trim()}${user.audit_trail.split('|').length>1? '...' : ''}` : "No asset summary available"}</p>
          </div>
          <div style={{ background: "#0C1A0F", border: "1px solid rgba(74,222,128,0.12)", borderRadius: "16px", padding: "20px" }}>
            <h2 style={{ color: "#4ADE80", marginBottom: "12px" }}>Connections</h2>
            <p>Flagged status: {user.flagged ? "Yes" : "No"}</p>
            <p>Data source: Backend API</p>
            {selectedNode && selectedNode.data?.full && (
              <div style={{ marginTop: 12, padding: 12, background: "#07100A", borderRadius: 8 }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: 14 }}>Selected Detail</h3>
                <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>{selectedNode.data.full}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
