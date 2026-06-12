import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import type { MouseEvent } from "react";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/useGraphStore";
import { apiService, type GraphNode, type GraphEdge } from "../services/api";
import { CustomNode } from "../components/CustomNode";

// Register custom node types
const nodeTypes = {
  custom: CustomNode,
};

function GraphInner({ nodes, edges, onNodeClick }: { nodes: Node[]; edges: Edge[]; onNodeClick: (e: MouseEvent, node: Node) => void }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Background color="#1A2640" gap={20} size={1.5} />
      <Controls />
      <MiniMap 
        nodeColor={(node: any) => {
          const type = node.data?.type;
          if (type === "person") return "#4ADE80";
          if (type === "vehicle") return "#0EA5E9";
          if (type === "property") return "#F59E0B";
          if (type === "utility") return "#F97316";
          if (type === "travel") return "#8B5CF6";
          return "#A78BFA";
        }}
        maskColor="rgba(7, 16, 10, 0.7)"
      />
    </ReactFlow>
  );
}

export default function Graph() {
  const [searchParams] = useSearchParams();
  const cnic = searchParams.get("cnic");
  const navigate = useNavigate();
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const selectedNode = useGraphStore((s) => s.selectedNode);

  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simple filters
  const [showVehicles, setShowVehicles] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showUtilities, setShowUtilities] = useState(true);
  const [showTravels, setShowTravels] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);

  // Load data
  useEffect(() => {
    if (!cnic) return;

    async function loadNetwork() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getGraphNetwork(cnic);
        setGraphData(data);
        
        const centralNode = data.nodes.find(n => n.id === cnic);
        if (centralNode) {
          setSelectedNode({ id: centralNode.id, data: { ...centralNode } });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch network graph.");
      } finally {
        setLoading(false);
      }
    }

    loadNetwork();
  }, [cnic, setSelectedNode]);

  // Simple circular layout
  const nodesWithPositions = useMemo(() => {
    const { nodes, edges } = graphData;
    if (!nodes.length) return [];

    // Find root node
    const rootId = cnic || nodes[0]?.id;
    const rootIndex = nodes.findIndex(n => n.id === rootId);
    
    // Create positions in a circle
    const radius = 300;
    const center = { x: 0, y: 0 };
    
    return nodes.map((node, index) => {
      let angle;
      if (node.id === rootId) {
        angle = -Math.PI / 2; // Root at top
      } else {
        // Calculate angle based on index, but avoid root position
        const adjustedIndex = index > rootIndex ? index - 1 : index;
        angle = (adjustedIndex / (nodes.length - 1)) * Math.PI * 2 - Math.PI / 2;
      }
      
      return {
        id: node.id,
        type: node.type,
        data: node,
        position: node.id === rootId 
          ? center 
          : { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
      };
    });
  }, [graphData, cnic]);

  // Filter and prepare nodes and edges
  const { displayNodes, displayEdges } = useMemo(() => {
    // Filter nodes by type
    const filtered = nodesWithPositions.filter(node => {
      if (node.type === "vehicle" && !showVehicles) return false;
      if (node.type === "property" && !showProperties) return false;
      if (node.type === "utility" && !showUtilities) return false;
      if (node.type === "travel" && !showTravels) return false;
      return true;
    });

    const nodeIds = new Set(filtered.map(n => n.id));

    // Filter edges
    const filteredEdges = graphData.edges.filter(edge => {
      if (!showWarnings && edge.label === "NAME_MISMATCH_WARNING") return false;
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    });

    // Convert to React Flow format
    const flowNodes = filtered.map(node => {
      // Set colors based on type
      let bgColor = "#4ADE80";
      let textColor = "#fff";
      
      if (node.type === "vehicle") {
        bgColor = "#0EA5E9";
      } else if (node.type === "property") {
        bgColor = "#F59E0B";
        textColor = "#000";
      } else if (node.type === "utility") {
        bgColor = "#F97316";
      } else if (node.type === "travel") {
        bgColor = "#8B5CF6";
      } else if (node.type === "person" && node.data.risk_score >= 60) {
        bgColor = "#FF4560";
      }

      // Create display label
      let label = node.id;
      if (node.type === "person") label = node.data.name || node.data.label || node.id;
      else if (node.type === "vehicle") label = node.data.registration_no || node.data.label || node.id;
      else if (node.type === "property") label = node.data.title_number || node.data.label || node.id;
      else if (node.type === "utility") label = node.data.account_no || node.data.label || node.id;
      else if (node.type === "travel") label = node.data.passport_no || node.data.label || node.id;

      return {
        id: node.id,
        type: "custom",
        position: node.position,
        data: {
          label,
          type: node.type,
          background: bgColor,
          color: textColor,
          ...node.data
        }
      };
    });

    const flowEdges = filteredEdges.map((edge, idx) => ({
      id: `edge-${idx}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      style: { stroke: edge.label === "NAME_MISMATCH_WARNING" ? "#FF4560" : "#4ADE80", strokeWidth: 2 },
      labelStyle: { fill: edge.label === "NAME_MISMATCH_WARNING" ? "#FF4560" : "#4ADE80", fontSize: 10 },
      animated: edge.label === "NAME_MISMATCH_WARNING"
    }));

    return { displayNodes: flowNodes, displayEdges: flowEdges };
  }, [nodesWithPositions, graphData.edges, showVehicles, showProperties, showUtilities, showTravels, showWarnings]);

  const onNodeClick = (_event: MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: "#07100A", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(74,222,128,0.12)", background: "#07100A" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.25)",
            color: "#4ADE80",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px"
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Knowledge Graph</h1>
        {cnic && <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", fontSize: "12px" }}>CNIC: {cnic}</span>}
      </div>

      {loading && <div style={{ padding: "40px", textAlign: "center", color: "#4ADE80" }}>Loading graph data...</div>}
      {error && <div style={{ padding: "40px", textAlign: "center", color: "#FF4560" }}>Error: {error}</div>}
      
      {!cnic && !loading && !error && (
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          Select a case from High Risk Cases to view their network.
        </div>
      )}

      {cnic && !loading && !error && (
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Graph Area */}
          <div style={{ flex: 1, position: "relative", borderRight: "1px solid rgba(74,222,128,0.12)" }}>
            {/* Filters Panel */}
            <div style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              background: "rgba(12, 26, 15, 0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "12px"
            }}>
              <div style={{ marginBottom: "8px", color: "#4ADE80", fontWeight: "bold" }}>Filters</div>
              <label style={{ display: "block", marginBottom: "6px" }}>
                <input type="checkbox" checked={showVehicles} onChange={e => setShowVehicles(e.target.checked)} /> Vehicles
              </label>
              <label style={{ display: "block", marginBottom: "6px" }}>
                <input type="checkbox" checked={showProperties} onChange={e => setShowProperties(e.target.checked)} /> Real Estate
              </label>
              <label style={{ display: "block", marginBottom: "6px" }}>
                <input type="checkbox" checked={showUtilities} onChange={e => setShowUtilities(e.target.checked)} /> Utilities
              </label>
              <label style={{ display: "block", marginBottom: "6px" }}>
                <input type="checkbox" checked={showTravels} onChange={e => setShowTravels(e.target.checked)} /> Travel
              </label>
              <label style={{ display: "block", color: "#FF4560" }}>
                <input type="checkbox" checked={showWarnings} onChange={e => setShowWarnings(e.target.checked)} /> Warnings
              </label>
            </div>

            <ReactFlowProvider>
              <GraphInner nodes={displayNodes} edges={displayEdges} onNodeClick={onNodeClick} />
            </ReactFlowProvider>
          </div>

          {/* Details Panel */}
          <div style={{ width: "320px", background: "#0C1A0F", padding: "20px", overflowY: "auto" }}>
            <h2 style={{ color: "#4ADE80", fontSize: "16px", margin: "0 0 16px 0", borderBottom: "1px solid rgba(74,222,128,0.15)", paddingBottom: "8px" }}>
              Details
            </h2>
            
            {selectedNode ? (
              <div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Label</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>{selectedNode.data?.label}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Type</div>
                  <div style={{ fontSize: "13px", color: "#4ADE80", textTransform: "capitalize" }}>{selectedNode.data?.type}</div>
                </div>
                
                {selectedNode.data?.type === "person" && (
                  <>
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Risk Score</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4ADE80" }}>{selectedNode.data?.risk_score || 0}/100</div>
                    </div>
                    {selectedNode.data?.city && <div><strong>City:</strong> {selectedNode.data.city}</div>}
                    {selectedNode.data?.cnic && <div><strong>CNIC:</strong> {selectedNode.data.cnic}</div>}
                  </>
                )}

                {selectedNode.data?.type === "vehicle" && (
                  <>
                    {selectedNode.data?.registration_no && <div><strong>Registration:</strong> {selectedNode.data.registration_no}</div>}
                    {selectedNode.data?.engine_cc && <div><strong>Engine CC:</strong> {selectedNode.data.engine_cc}</div>}
                  </>
                )}

                {selectedNode.data?.type === "property" && (
                  <>
                    {selectedNode.data?.value && <div><strong>Value:</strong> PKR {selectedNode.data.value.toLocaleString()}</div>}
                    {selectedNode.data?.area && <div><strong>Area:</strong> {selectedNode.data.area} sqft</div>}
                  </>
                )}

                {selectedNode.data?.type === "utility" && (
                  <>
                    {selectedNode.data?.account_no && <div><strong>Account:</strong> {selectedNode.data.account_no}</div>}
                    {selectedNode.data?.monthly_bill && <div><strong>Monthly Bill:</strong> PKR {selectedNode.data.monthly_bill}</div>}
                  </>
                )}

                {selectedNode.data?.type === "travel" && (
                  <>
                    {selectedNode.data?.destination && <div><strong>Destination:</strong> {selectedNode.data.destination}</div>}
                    {selectedNode.data?.ticket_price && <div><strong>Price:</strong> PKR {selectedNode.data.ticket_price}</div>}
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                Click a node to see details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}