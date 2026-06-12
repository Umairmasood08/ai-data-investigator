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
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/useGraphStore";

// ====================== BASE DATA ======================
const rawNodes = [
  { id: "1", label: "Ali Khan",      kind: "main"     },
  { id: "2", label: "Toyota Prado",  kind: "asset"    },
  { id: "3", label: "DHA House",     kind: "asset"    },
  { id: "4", label: "Dubai Trips",   kind: "activity" },
  { id: "5", label: "Utility Spike", kind: "activity" },
];

// ====================== AUTO LAYOUT ======================
const baseNodes: Node[] = rawNodes.map((n, i) => {
  const angle = (i / rawNodes.length) * 2 * Math.PI;

  return {
    id: n.id,
    // ✅ data defined ONCE — duplicate key was silently dropping nodes
    data: { label: n.label, kind: n.kind },
    position: {
      x: 300 + Math.cos(angle) * 200,
      y: 250 + Math.sin(angle) * 150,
    },
    // ✅ No `type` field — React Flow reserves that for renderer lookup
    style: {
      background: n.kind === "activity" ? "#FFB020" : "#FF4560",
      color: n.kind === "asset" ? "#fff" : "#000",
      padding: 10,
      borderRadius: 10,
      border: "1px solid #1A2640",
      fontWeight: n.kind === "main" ? "bold" : "normal",
      // ✅ No transform — React Flow owns that CSS property on nodes
    },
  };
});

// ====================== EDGES ======================
const baseEdges: Edge[] = [
  { id: "e1", source: "1", target: "2", animated: true },
  { id: "e2", source: "1", target: "3", animated: true },
  { id: "e3", source: "1", target: "4", animated: true },
  { id: "e4", source: "1", target: "5", animated: true },
];

// ====================== INNER COMPONENT ======================
function GraphInner() {
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const selectedNode    = useGraphStore((s) => s.selectedNode);
  const { fitView }     = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.3 }), 100);
    return () => clearTimeout(t);
  }, [fitView]);

  const onNodeClick = (_event: MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const nodes = useMemo(() => {
    return baseNodes.map((n) => {
      const isSelected = selectedNode?.id === n.id;
      return {
        ...n,
        style: {
          ...n.style,
          // ✅ Selection feedback via border/shadow/padding only — no transform
          boxShadow: isSelected ? "0 0 20px #00D4FF" : "none",
          border:    isSelected ? "2px solid #00D4FF" : "1px solid #1A2640",
          padding:   isSelected ? 14 : 10,
          transition: "all 0.2s ease",
        },
      };
    });
  }, [selectedNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={baseEdges}
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

// ====================== WRAPPER ======================
export default function Graph() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#0D1420" }}>
      <ReactFlowProvider>
        <GraphInner />
      </ReactFlowProvider>
    </div>
  );
}
