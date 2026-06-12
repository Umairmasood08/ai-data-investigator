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

function GraphInner({ nodes, edges, onNodeClick }: { nodes: Node[]; edges: Edge[]; onNodeClick: (e: MouseEvent, node: Node) => void }) {
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const { fitView, getNodes } = useReactFlow();
  const nodeTypes = {
    custom: CustomNode,
  };
   useEffect(() => {
    if (nodes.length > 0) {
      fitView({ padding: 0.2, duration: 300 });
    }
  }, [nodes, fitView]);

  const styledNodes = useMemo(() => {
    return nodes.map((n) => {
      const isSelected = selectedNode?.id === n.id;
      return {
        ...n,
        style: {
          ...n.style,
          boxShadow: isSelected ? "0 0 25px rgba(74, 222, 128, 0.6)" : "none",
          border: isSelected ? "2.5px solid #4ADE80" : n.style?.border || "1px solid #1A2640",
          transform: isSelected ? "scale(1.08)" : "scale(1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      };
    });
  }, [nodes, selectedNode]);

  return (
    <ReactFlow
  nodes={styledNodes}
  edges={edges}
  onNodeClick={onNodeClick}
  nodeTypes={nodeTypes}  // ADD THIS LINE
  fitView
  fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
  proOptions={{ hideAttribution: true }}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  style={{ width: "100%", height: "100%" }}
>
      <Background color="#1A2640" gap={20} size={1.5} />
      <Controls style={{ background: "#0C1A0F", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "8px", fill: "#4ADE80" }} />
      <MiniMap 
        nodeColor={(node: any) => {
          if (node.data?.type === "person") return node.data?.flagged ? "#FF4560" : "#4ADE80";
          if (node.data?.type === "vehicle") return "#0EA5E9";
          if (node.data?.type === "property") return "#F59E0B";
          if (node.data?.type === "utility") return "#F97316";
          if (node.data?.type === "travel") return "#8B5CF6";
          return "#A78BFA";
        }}
        maskColor="rgba(7, 16, 10, 0.7)"
        style={{ background: "#0C1A0F", border: "1px solid rgba(74,222,128,0.25)" }}
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
  
  // Filters state
  const [showVehicles, setShowVehicles] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showUtilities, setShowUtilities] = useState(true);
  const [showTravels, setShowTravels] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);

  useEffect(() => {
    const selectedCnic = cnic;
    if (!selectedCnic) return;

    async function loadNetwork(targetCnic: string) {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getGraphNetwork(targetCnic);
        setGraphData(data);

        // Auto-select central taxpayer node initially
        const centralNode = data.nodes.find(n => n.id === targetCnic);
        if (centralNode) {
          setSelectedNode({ id: centralNode.id, data: { ...centralNode } });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch Neo4j network graph.");
      } finally {
        setLoading(false);
      }
    }

    loadNetwork(selectedCnic);
  }, [cnic, setSelectedNode]);

  const positionedNodes = useMemo(() => {
    const { nodes, edges } = graphData;
    if (!nodes.length) return [];

    const rootId = cnic && nodes.some((n) => n.id === cnic) ? cnic : nodes[0]?.id;
    const rootNode = nodes.find((n) => n.id === rootId) || nodes[0];

    const adjacency = new Map<string, Set<string>>();
    nodes.forEach((n) => adjacency.set(n.id, new Set()));
    edges.forEach((edge) => {
      if (adjacency.has(edge.source)) adjacency.get(edge.source)!.add(edge.target);
      if (adjacency.has(edge.target)) adjacency.get(edge.target)!.add(edge.source);
    });

    const firstRing = Array.from(adjacency.get(rootNode.id) || []).map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[];
    const assigned = new Set<string>();
    const positioned = new Map<string, { x: number; y: number }>();

    // Center position - use viewport-centered coordinates
    const center = { x: 0, y: 0 };
    
    positioned.set(rootNode.id, center);
    assigned.add(rootNode.id);

    const firstRadius = Math.max(200, firstRing.length * 80);
    firstRing.forEach((node, index) => {
      const angle = (index / Math.max(firstRing.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positioned.set(node.id, {
        x: center.x + Math.cos(angle) * firstRadius,
        y: center.y + Math.sin(angle) * firstRadius,
      });
      assigned.add(node.id);
    });

    const remaining = nodes.filter((n) => !assigned.has(n.id));
    const secondRadius = Math.max(400, remaining.length * 60);
    remaining.forEach((node, index) => {
      const angle = (index / Math.max(remaining.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positioned.set(node.id, {
        x: center.x + Math.cos(angle) * secondRadius,
        y: center.y + Math.sin(angle) * secondRadius,
      });
    });

    return nodes.map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      data: node,
      position: positioned.get(node.id) ?? {
        x: Math.cos((nodes.findIndex(n => n.id === node.id) / Math.max(nodes.length, 1)) * Math.PI * 2) * 300,
        y: Math.sin((nodes.findIndex(n => n.id === node.id) / Math.max(nodes.length, 1)) * Math.PI * 2) * 300,
      },
    }));
  }, [graphData, cnic]);

  // Filter nodes & edges dynamically based on checkbox selections
 const filteredNodesAndEdges = useMemo(() => {
  const nodes = positionedNodes;
  const { edges } = graphData;

  const filteredNodes = nodes.filter(n => {
    if (n.type === "vehicle" && !showVehicles) return false;
    if (n.type === "property" && !showProperties) return false;
    if (n.type === "utility" && !showUtilities) return false;
    if (n.type === "travel" && !showTravels) return false;
    return true;
  });

  const activeNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredEdges = edges.filter(e => {
    if (!showWarnings && e.label === "NAME_MISMATCH_WARNING") return false;
    return activeNodeIds.has(e.source) && activeNodeIds.has(e.target);
  });

  // Map to React Flow Nodes with custom node type
  const flowNodes = filteredNodes.map((n) => {
    // Determine colors and backgrounds
    let background = "#4ADE80";
    let color = "#000";
    
    if (n.type === "person") {
      background = n.data.risk_score && n.data.risk_score >= 60 ? "#FF4560" : "#4ADE80";
      color = "#fff";
    } else if (n.type === "vehicle") {
      background = "#0EA5E9";
      color = "#fff";
    } else if (n.type === "property") {
      background = "#F59E0B";
      color = "#000";
    } else if (n.type === "utility") {
      background = "#F97316";
      color = "#fff";
    } else if (n.type === "travel") {
      background = "#8B5CF6";
      color = "#fff";
    }

    // Create label based on node type
    let label = n.data.label || n.id;
    if (n.type === "person") {
      label = n.data.name || n.data.label || n.id;
    } else if (n.type === "vehicle") {
      label = n.data.registration_no || n.data.label || n.id;
    } else if (n.type === "property") {
      label = n.data.title_number || n.data.label || n.id;
    } else if (n.type === "utility") {
      label = n.data.account_no || n.data.label || n.id;
    } else if (n.type === "travel") {
      label = n.data.passport_no || n.data.label || n.id;
    }

    // IMPORTANT: Use type: "custom" to use our custom node component
    return {
      id: n.id,
      type: "custom", // This is CRITICAL - must match nodeTypes key
      position: n.position ?? { x: 0, y: 0 },
      data: {
        ...n.data,
        label,
        type: n.type,
        background,
        color,
        cnic: cnic || undefined,
      },
    };
  });

  // Convert edges to React Flow format with handle specifications
  const reactFlowEdges = filteredEdges.map((edge, index) => ({
    id: `${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: "bottom", // Attach from bottom of source node
    targetHandle: "top",     // Attach to top of target node
    label: edge.label,
    style: {
      stroke: edge.label === "NAME_MISMATCH_WARNING" ? "#FF4560" : "#4ADE80",
      strokeWidth: edge.label === "NAME_MISMATCH_WARNING" ? 3 : 2,
    },
    labelStyle: {
      fill: edge.label === "NAME_MISMATCH_WARNING" ? "#FF4560" : "#4ADE80",
      fontSize: 10,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: "#0C1A0F",
      fillOpacity: 0.8,
    },
    animated: edge.label === "NAME_MISMATCH_WARNING",
  }));

  return { nodes: flowNodes, edges: reactFlowEdges };
}, [positionedNodes, graphData, cnic, showVehicles, showProperties, showUtilities, showTravels, showWarnings]);
  const onNodeClick = (_event: MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07100A", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      {/* Header bar */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyItems: "center", borderBottom: "1px solid rgba(74,222,128,0.12)", background: "#07100A", zIndex: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.25)",
            color: "#4ADE80",
            padding: "9px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            marginRight: "20px",
            transition: "all .2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(74,222,128,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(74,222,128,0.12)"}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Interactive Knowledge Graph</h1>
        {cnic && <span style={{ marginLeft: "14px", padding: "4px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>CNIC: {cnic}</span>}
      </div>

      {loading && <div style={{ padding: "40px", color: "#4ADE80", textAlign: "center" }}>Loading network topology from Neo4j database...</div>}
      {error && <div style={{ padding: "40px", color: "#FF4560", textAlign: "center" }}>Error: {error}</div>}
      
      {!cnic && !loading && !error && (
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          Please select a case from the High Risk Cases page to load their Knowledge Graph network.
        </div>
      )}

      {cnic && !loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, position: "relative" }}>
          
          {/* Main Graph Canvas */}
          <div style={{ height: "calc(100vh - 80px)", position: "relative", borderRight: "1px solid rgba(74,222,128,0.12)" }}>
            
            {/* Filter Toggle Panel */}
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10, background: "rgba(12, 26, 15, 0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "12px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#4ADE80", textTransform: "uppercase", letterSpacing: ".05em" }}>Graph Filters</h3>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={showVehicles} onChange={e => setShowVehicles(e.target.checked)} />
                Vehicles (Blue)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={showProperties} onChange={e => setShowProperties(e.target.checked)} />
                Real Estate (Amber)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={showUtilities} onChange={e => setShowUtilities(e.target.checked)} />
                Utility Accounts (Orange)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" checked={showTravels} onChange={e => setShowTravels(e.target.checked)} />
                International Travel (Purple)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", color: "#FF4560", fontWeight: "600" }}>
                <input type="checkbox" checked={showWarnings} onChange={e => setShowWarnings(e.target.checked)} />
                Name Mismatch Warnings (Red Edge)
              </label>
            </div>

            <ReactFlowProvider>
              <GraphInner 
                nodes={filteredNodesAndEdges.nodes} 
                edges={filteredNodesAndEdges.edges} 
                onNodeClick={onNodeClick} 
              />
            </ReactFlowProvider>
          </div>

          {/* Right sidebar for Node details */}
          <div style={{ background: "#0C1A0F", padding: "24px", overflowY: "auto", height: "calc(100vh - 80px)" }}>
            <h2 style={{ color: "#4ADE80", fontSize: "18px", fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid rgba(74,222,128,0.15)", paddingBottom: "10px" }}>
              Inspector Detail Panel
            </h2>
            
            {selectedNode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Node Label</span>
                  <div style={{ fontSize: "15px", fontWeight: "bold", color: "#fff", marginTop: "4px" }}>{selectedNode.data?.label || selectedNode.data?.name || selectedNode.id}</div>
                </div>

                <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Node Type</span>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#4ADE80", textTransform: "capitalize", marginTop: "4px" }}>{selectedNode.data?.type}</div>
                </div>

                {selectedNode.data?.type === "person" && (
                  <>
                    <div style={{ padding: "12px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#4ADE80", textTransform: "uppercase" }}>Tax Compliance Score</span>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ADE80", marginTop: "4px" }}>{selectedNode.data?.risk_score}/100</div>
                    </div>
                    
                    {selectedNode.data?.city && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>City:</b> {selectedNode.data.city}</p>
                    )}
                    {selectedNode.data?.cnic && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>CNIC:</b> {selectedNode.data.cnic}</p>
                    )}
                    {selectedNode.data?.name && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Name:</b> {selectedNode.data.name}</p>
                    )}
                    {selectedNode.data?.audit_trail && (
                      <div style={{ marginTop: "10px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "4px" }}>Risk Evidence:</span>
                        <div style={{ padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "11px", lineHeight: "1.4", color: "rgba(255,255,255,0.7)" }}>
                          {selectedNode.data.audit_trail.split("|").map((t: string, i: number) => (
                            <div key={i} style={{ marginBottom: "6px" }}>• {t.trim()}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedNode.data?.type === "vehicle" && (
                  <>
                    {selectedNode.data?.registration_no && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Registration No:</b> {selectedNode.data.registration_no}</p>
                    )}
                    {selectedNode.data?.engine_cc && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Engine CC:</b> {selectedNode.data.engine_cc} cc</p>
                    )}
                    {selectedNode.data?.model_year && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Model Year:</b> {selectedNode.data.model_year}</p>
                    )}
                    {selectedNode.data?.owner_name && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Registered Name:</b> {selectedNode.data.owner_name}</p>
                    )}
                  </>
                )}

                {selectedNode.data?.type === "property" && (
                  <>
                    {selectedNode.data?.title_number && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Title Number:</b> {selectedNode.data.title_number}</p>
                    )}
                    {selectedNode.data?.value && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Estimated Value:</b> PKR {selectedNode.data.value.toLocaleString()}</p>
                    )}
                    {selectedNode.data?.area && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Area Size:</b> {selectedNode.data.area} Sqft</p>
                    )}
                    {selectedNode.data?.location && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Location:</b> {selectedNode.data.location}</p>
                    )}
                  </>
                )}

                {selectedNode.data?.type === "utility" && (
                  <>
                    {selectedNode.data?.account_no && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Account No:</b> {selectedNode.data.account_no}</p>
                    )}
                    {selectedNode.data?.address && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Address:</b> {selectedNode.data.address}</p>
                    )}
                    {selectedNode.data?.monthly_bill && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Monthly Bill:</b> PKR {selectedNode.data.monthly_bill.toLocaleString()}</p>
                    )}
                  </>
                )}

                {selectedNode.data?.type === "travel" && (
                  <>
                    {selectedNode.data?.passport_no && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Passport No:</b> {selectedNode.data.passport_no}</p>
                    )}
                    {selectedNode.data?.destination && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Destination:</b> {selectedNode.data.destination}</p>
                    )}
                    {selectedNode.data?.ticket_price && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Ticket Price:</b> PKR {selectedNode.data.ticket_price.toLocaleString()}</p>
                    )}
                    {selectedNode.data?.travel_date && (
                      <p style={{ margin: 0, fontSize: "13px" }}><b>Travel Date:</b> {selectedNode.data.travel_date}</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px", padding: "20px 0" }}>
                Click on any node in the knowledge graph network to view their registration, value and audit details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}