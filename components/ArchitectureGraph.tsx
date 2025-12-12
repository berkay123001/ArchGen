
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SystemArchitecture, ArchitectureNode, NodeType, ArchitectureEdge } from '../types';

interface Props {
  data: SystemArchitecture | null;
  onNodeClick?: (node: ArchitectureNode) => void;
  onConnect?: (sourceId: string, targetId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  simulating: boolean;
  className?: string;
  highlightedNodeId?: string | null;
  highlightedEdgeId?: string | null;
  isLinkingMode?: boolean;
  // AI Highlights
  activeHighlightNodes?: string[];
  activeHighlightLayer?: string | null;
  // Game Feedback Highlights
  successNodeIds?: string[];
  errorNodeIds?: string[];
}

// --- CONFIGURATION ---
const LAYER_CONFIG = {
  presentation: { label: 'CLIENTS & DEVICES', color: '#3b82f6', icon: '📱' },
  gateway: { label: 'GATEWAY & INGRESS', color: '#a855f7', icon: '🛡️' },
  service: { label: 'PROCESSING & LOGIC', color: '#f59e0b', icon: '⚙️' },
  data: { label: 'DATA & STATE', color: '#10b981', icon: '💾' },
  infra: { label: 'INFRASTRUCTURE', color: '#64748b', icon: '☁️' }
};

// Dimensions
const NODE_WIDTH = 180;
const NODE_HEIGHT = 70; 
const GRID_COLUMNS = 4; 
const COL_SPACING = 250;
const ROW_SPACING = 150;
const LAYER_MARGIN = 200;

interface Packet {
  id: string; 
  edgeId: string;
  progress: number;
  color: string;
  history: {x: number, y: number}[]; 
}

export const ArchitectureGraph: React.FC<Props> = ({ 
  data, 
  onNodeClick, 
  onConnect, 
  onDeleteEdge,
  simulating, 
  className, 
  highlightedNodeId, 
  highlightedEdgeId, 
  isLinkingMode = false,
  activeHighlightNodes = [],
  activeHighlightLayer = null,
  successNodeIds = [],
  errorNodeIds = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [positions, setPositions] = useState<{ [id: string]: { x: number, y: number } }>({});
  const [packets, setPackets] = useState<Packet[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [layerBounds, setLayerBounds] = useState<{[key: string]: { y: number, height: number, collapsed: boolean, count: number }}>({});
  
  // Interaction State
  const [collapsedLayers, setCollapsedLayers] = useState<{[key: string]: boolean}>({});
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.75); 
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLayerKey, setHoveredLayerKey] = useState<string | null>(null);
  
  // Edge Interaction
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [isDeleteBtnHovered, setIsDeleteBtnHovered] = useState(false);

  // Linking
  const [isLinkingDrag, setIsLinkingDrag] = useState(false); 
  const [linkStartNodeId, setLinkStartNodeId] = useState<string | null>(null); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 

  const lastPos = useRef({ x: 0, y: 0 });
  const isDragInteraction = useRef(false);
  
  const dataRef = useRef(data);
  const positionsRef = useRef(positions);
  const highlightedEdgeIdRef = useRef(highlightedEdgeId);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { highlightedEdgeIdRef.current = highlightedEdgeId; }, [highlightedEdgeId]);

  useEffect(() => {
      if (!isLinkingMode) {
          setLinkStartNodeId(null);
      }
  }, [isLinkingMode]);

  const getNodeLayerKey = (type: NodeType): string => {
      if (type === NodeType.CLIENT || type === NodeType.MOBILE || type === NodeType.IOT_DEVICE) return 'presentation';
      if (type === NodeType.LOAD_BALANCER || type === NodeType.API_GATEWAY || type === NodeType.MQTT_BROKER || type === NodeType.CDN) return 'gateway';
      if (type === NodeType.DATABASE || type === NodeType.CACHE || type === NodeType.STORAGE || type === NodeType.LEDGER || type === NodeType.VECTOR_DB) return 'data';
      if (type === NodeType.EXTERNAL) return 'infra';
      return 'service';
  };

  const calculateLayout = useCallback((nodes: ArchitectureNode[]) => {
    const newPositions: { [id: string]: { x: number, y: number } } = {};
    const newLayerBounds: {[key: string]: { y: number, height: number, collapsed: boolean, count: number }} = {};
    
    const layers: { [key: string]: ArchitectureNode[] } = {
      presentation: [], gateway: [], service: [], data: [], infra: []
    };

    nodes.forEach(n => {
      const key = getNodeLayerKey(n.type);
      if (layers[key]) layers[key].push(n);
    });

    const layerKeys = Object.keys(layers);
    let currentY = 100;

    layerKeys.forEach((key) => {
      const layerNodes = layers[key];
      if (layerNodes.length === 0) return;

      const isCollapsed = collapsedLayers[key];
      const headerY = currentY;
      
      newLayerBounds[key] = { 
          y: headerY, 
          height: isCollapsed ? 60 : 0, 
          collapsed: !!isCollapsed,
          count: layerNodes.length
      };

      if (isCollapsed) {
          currentY += 100; 
          return; 
      }

      const nodesStartY = currentY + 80; 
      const count = layerNodes.length;
      const rows = Math.ceil(count / GRID_COLUMNS);

      layerNodes.forEach((node, idx) => {
        const row = Math.floor(idx / GRID_COLUMNS);
        const col = idx % GRID_COLUMNS;
        const itemsInThisRow = (row === rows - 1) ? (count % GRID_COLUMNS || GRID_COLUMNS) : GRID_COLUMNS;
        const rowWidth = (itemsInThisRow - 1) * COL_SPACING;
        const startX = -rowWidth / 2;
        const x = startX + (col * COL_SPACING);
        const y = nodesStartY + (row * ROW_SPACING);
        newPositions[node.id] = { x, y };
      });

      const layerHeight = (rows * ROW_SPACING) + 40;
      newLayerBounds[key].height = layerHeight + 60; 
      currentY += layerHeight + LAYER_MARGIN; 
    });

    setLayerBounds(newLayerBounds);
    return newPositions;
  }, [collapsedLayers]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width, height });
      setOffset({ x: width / 2, y: 50 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data) return;
    setPositions(prev => {
      const layout = calculateLayout(data.nodes);
      if (draggedNodeId && prev[draggedNodeId] && layout[draggedNodeId]) {
         layout[draggedNodeId] = prev[draggedNodeId];
      }
      return layout;
    });
  }, [data?.nodes.length, data?.edges.length, calculateLayout, draggedNodeId]); 

  // --- HELPER FOR OFFSET ---
  const getEdgeOffset = (edge: ArchitectureEdge, allEdges: ArchitectureEdge[]) => {
      const reverse = allEdges.find(e => e.source === edge.target && e.target === edge.source && e.id !== edge.id);
      if (reverse) {
          return edge.source < edge.target ? 8 : -8;
      }
      return 0;
  };

  const getOrthogonalPath = (start: {x: number, y: number}, end: {x: number, y: number}, offset: number = 0) => {
     const startY = start.y + NODE_HEIGHT/2;
     const endY = end.y - NODE_HEIGHT/2;
     const midY = (startY + endY) / 2;
     return [
       { x: start.x + offset, y: startY },
       { x: start.x + offset, y: midY },
       { x: end.x + offset, y: midY },
       { x: end.x + offset, y: endY }
     ];
  };

  /**
   * IMPROVED PATH INTERPOLATION
   * Calculates actual segment lengths to ensure constant speed regardless of segment size.
   * Prevents "stop-and-go" visual stutter.
   */
  const getPointOnPath = (pts: {x: number, y: number}[], t: number) => {
        // Calculate lengths of the 3 segments
        const d1 = Math.abs(pts[1].y - pts[0].y) + Math.abs(pts[1].x - pts[0].x);
        const d2 = Math.abs(pts[2].x - pts[1].x) + Math.abs(pts[2].y - pts[1].y);
        const d3 = Math.abs(pts[3].y - pts[2].y) + Math.abs(pts[3].x - pts[2].x);
        
        const total = d1 + d2 + d3;
        
        // Handle zero length edge case
        if (total === 0) return pts[0];

        const t1 = d1 / total;
        const t2 = (d1 + d2) / total;

        let px = 0, py = 0;

        if (t < t1) {
            // Segment 1
            const localT = t / t1;
            px = pts[0].x + (pts[1].x - pts[0].x) * localT;
            py = pts[0].y + (pts[1].y - pts[0].y) * localT;
        } else if (t < t2) {
            // Segment 2
            const localT = (t - t1) / (t2 - t1);
            px = pts[1].x + (pts[2].x - pts[1].x) * localT;
            py = pts[1].y + (pts[2].y - pts[1].y) * localT;
        } else {
            // Segment 3
            const localT = (t - t2) / (1 - t2);
            px = pts[2].x + (pts[3].x - pts[2].x) * localT;
            py = pts[2].y + (pts[3].y - pts[2].y) * localT;
        }
        return { x: px, y: py };
  };

  // --- SIMULATION LOOP ---
  useEffect(() => {
    if (simulating) {
      const interval = setInterval(() => {
        const currentData = dataRef.current;
        const currentPositions = positionsRef.current;
        const hlEdgeId = highlightedEdgeIdRef.current;

        if (!currentData || !currentData.edges) return;

        setPackets(prev => {
            // 1. Move existing packets
            const moved = prev.map(pkt => {
                const edge = currentData.edges.find(e => e.id === pkt.edgeId);
                if (!edge || !currentPositions[edge.source] || !currentPositions[edge.target]) return pkt;
                
                const start = currentPositions[edge.source];
                const end = currentPositions[edge.target];
                const offset = getEdgeOffset(edge, currentData.edges);
                const pts = getOrthogonalPath(start, end, offset);
                
                const currentPos = getPointOnPath(pts, pkt.progress);
                const newHistory = [currentPos, ...pkt.history].slice(0, 3);

                // Constant visual speed approx
                return { ...pkt, progress: pkt.progress + 0.008, history: newHistory };
            }).filter(p => p.progress <= 1);

            // 2. Controlled Spawn Logic
            const edgeCount = currentData.edges.length;
            
            // INCREASED GLOBAL CAP: Allow more density but keep it controlled.
            // Small: 15, Medium: 30, Large: 50
            const maxGlobalPackets = edgeCount < 10 ? 15 : (edgeCount < 30 ? 30 : 50);

            if (moved.length >= maxGlobalPackets) {
                return moved;
            }

            // High priority spawn for tutorials
            if (hlEdgeId) {
                const targetEdge = currentData.edges.find(e => e.id === hlEdgeId);
                if (targetEdge && Math.random() < 0.20) { // Increased tut spawn rate
                     const p: Packet[] = [];
                     spawnPacket(targetEdge, currentData, p);
                     return [...moved, ...p];
                }
            }

            // Balanced Random Spawn
            // We want enough activity without chaos. 
            // Loop a few times to potentially spawn multiple packets in big graphs
            const spawnAttempts = edgeCount > 30 ? 3 : 1;
            const newPackets: Packet[] = [];
            
            for(let i=0; i<spawnAttempts; i++) {
                if (moved.length + newPackets.length >= maxGlobalPackets) break;

                // Higher base chance for liveliness
                let spawnChance = 0.15; 
                if (edgeCount > 20) spawnChance = 0.08; 
                if (edgeCount > 50) spawnChance = 0.05;

                if (Math.random() < spawnChance) {
                    const randomEdge = currentData.edges[Math.floor(Math.random() * currentData.edges.length)];
                    
                    if (randomEdge && currentPositions[randomEdge.source] && currentPositions[randomEdge.target]) {
                        // Allow slight overlap for more density
                        spawnPacket(randomEdge, currentData, newPackets);
                    }
                }
            }

            return [...moved, ...newPackets];
        });
      }, 16);
      return () => clearInterval(interval);
    } else {
        setPackets([]);
    }
  }, [simulating]); 

  const spawnPacket = (edge: any, currentData: SystemArchitecture, list: Packet[]) => {
        const sourceNode = currentData.nodes.find(n => n.id === edge.source);
        
        let pktColor = '#22d3ee'; 
        
        if (sourceNode) {
             const layer = getNodeLayerKey(sourceNode.type);
             if (layer === 'presentation') pktColor = '#60a5fa'; 
             else if (layer === 'service') pktColor = '#fbbf24'; 
             else if (layer === 'data') pktColor = '#34d399'; 
             else if (layer === 'gateway') pktColor = '#a855f7'; 
        }

        list.push({ 
            id: Math.random().toString(36).substr(2, 9),
            edgeId: edge.id, 
            progress: 0, 
            color: pktColor, 
            history: []
        });
  };

  const drawChevron = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, scale: number = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.lineWidth = 2 * scale;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.moveTo(-4 * scale, -4 * scale);
      ctx.lineTo(2 * scale, 0);
      ctx.lineTo(-4 * scale, 4 * scale);
      ctx.stroke();
      ctx.restore();
  };
  
  const drawArrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, scale: number = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6 * scale, -3 * scale);
      ctx.lineTo(-6 * scale, 3 * scale);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const getLayerColor = (type: NodeType) => {
      const key = getNodeLayerKey(type);
      // @ts-ignore
      return LAYER_CONFIG[key]?.color || '#fff';
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 1. DRAW LAYER BOUNDARIES
    Object.keys(layerBounds).forEach(key => {
        const bounds = layerBounds[key];
        const conf = LAYER_CONFIG[key as keyof typeof LAYER_CONFIG];
        if (!conf) return;

        const boxWidth = (GRID_COLUMNS * COL_SPACING) + 100;
        const boxX = -boxWidth / 2;
        const pillW = 280;
        const pillX = -pillW / 2;
        const pillY = bounds.y - 20;
        const isLayerActive = activeHighlightLayer === key;

        if (!bounds.collapsed) {
            ctx.beginPath();
            drawRoundedRect(ctx, boxX, bounds.y, boxWidth, bounds.height, 24);
            ctx.strokeStyle = isLayerActive ? '#fbbf24' : conf.color; 
            ctx.lineWidth = isLayerActive ? 4 : 2;
            
            if (isLayerActive) {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20;
            }

            ctx.globalAlpha = isLayerActive ? 0.5 : 0.3;
            ctx.stroke();
            ctx.shadowBlur = 0; 

            ctx.fillStyle = conf.color;
            ctx.globalAlpha = 0.02;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pillX - 10, bounds.y - 4, pillW + 20, 8); 

        const isLayerHover = hoveredLayerKey === key;
        ctx.fillStyle = isLayerHover ? '#1e293b' : '#0f172a';
        drawRoundedRect(ctx, pillX, pillY, pillW, 40, 20);
        ctx.fill();
        
        ctx.strokeStyle = conf.color;
        ctx.lineWidth = isLayerHover ? 2 : 1.5;
        drawRoundedRect(ctx, pillX, pillY, pillW, 40, 20);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 13px JetBrains Mono';
        ctx.fillStyle = conf.color; 
        
        const arrow = bounds.collapsed ? '▶' : '▼';
        const labelText = bounds.collapsed 
            ? `${arrow} ${conf.icon} ${conf.label} (${bounds.count})`
            : `${arrow} ${conf.icon} ${conf.label}`;
            
        ctx.fillText(labelText, 0, pillY + 20);
    });

    // 2. DRAW EDGES
    const time = Date.now();
    data.edges.forEach(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        if (!start || !end) return;

        let opacity = 0.5; 
        let isHighlighted = false;

        const isHovered = hoveredEdgeId === edge.id;

        if (hoveredNodeId) {
            if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
                opacity = 1.0;
                isHighlighted = true;
            } else {
                opacity = 0.1; 
            }
        }
        if (highlightedEdgeId === edge.id || isHovered) {
             opacity = 1.0;
             isHighlighted = true;
        }

        const color = isHighlighted ? '#f59e0b' : '#64748b';
        
        const offset = getEdgeOffset(edge, data.edges);
        const points = getOrthogonalPath(start, end, offset);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);

        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighlighted ? 3 : 2; 
        
        ctx.shadowColor = color; 
        ctx.shadowBlur = isHighlighted ? 15 : 0; 
        
        ctx.setLineDash([8, 8]); 
        ctx.lineDashOffset = -time / 40; 
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        if (opacity > 0.1) {
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            
            ctx.beginPath(); 
            ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI*2); 
            ctx.fill();

            const pEnd = points[3];
            const pPrev = points[2];
            let angle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
            if (pEnd.x === pPrev.x && pEnd.y === pPrev.y) {
                 angle = Math.atan2(points[2].y - points[1].y, points[2].x - points[1].x);
            }

            drawArrowHead(ctx, pEnd.x, pEnd.y, angle, color, isHighlighted ? 1.5 : 1.2);
            
            ctx.globalAlpha = 1.0;
        }

        if (isHovered && onDeleteEdge) {
             const midX = (points[1].x + points[2].x) / 2;
             const midY = (points[1].y + points[2].y) / 2;

             const btnSize = isDeleteBtnHovered ? 14 : 10;
             
             ctx.beginPath();
             ctx.arc(midX, midY, btnSize, 0, Math.PI * 2);
             ctx.fillStyle = isDeleteBtnHovered ? '#ef4444' : '#1e293b';
             ctx.fill();
             ctx.strokeStyle = '#ef4444';
             ctx.lineWidth = 2;
             ctx.stroke();

             const xSize = isDeleteBtnHovered ? 4 : 3;
             ctx.beginPath();
             ctx.moveTo(midX - xSize, midY - xSize);
             ctx.lineTo(midX + xSize, midY + xSize);
             ctx.moveTo(midX + xSize, midY - xSize);
             ctx.lineTo(midX - xSize, midY + xSize);
             ctx.strokeStyle = isDeleteBtnHovered ? '#fff' : '#ef4444';
             ctx.lineWidth = 2;
             ctx.stroke();
        }
    });

    // 3. DRAW PACKETS
    packets.forEach(pkt => {
        const edge = data.edges.find(e => e.id === pkt.edgeId);
        if (!edge) return;
        if (hoveredNodeId && (edge.source !== hoveredNodeId && edge.target !== hoveredNodeId)) return;
        
        const start = positions[edge.source];
        const end = positions[edge.target];
        if (!start || !end) return;

        const offset = getEdgeOffset(edge, data.edges);
        const pts = getOrthogonalPath(start, end, offset);
        
        const headPos = getPointOnPath(pts, pkt.progress);
        
        // Accurate Angle Calculation based on current segment
        // We can determine segment by checking which 2 points we are between
        let angle = 0;
        const d1 = Math.abs(pts[1].y - pts[0].y) + Math.abs(pts[1].x - pts[0].x);
        const d2 = Math.abs(pts[2].x - pts[1].x) + Math.abs(pts[2].y - pts[1].y);
        const d3 = Math.abs(pts[3].y - pts[2].y) + Math.abs(pts[3].x - pts[2].x);
        const total = d1 + d2 + d3;
        
        if (total > 0) {
            const t1 = d1 / total;
            const t2 = (d1 + d2) / total;
            
            if (pkt.progress < t1) {
                angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
            } else if (pkt.progress < t2) {
                angle = Math.atan2(pts[2].y - pts[1].y, pts[2].x - pts[1].x);
            } else {
                angle = Math.atan2(pts[3].y - pts[2].y, pts[3].x - pts[2].x);
            }
        }

        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 8;
        drawChevron(ctx, headPos.x, headPos.y, angle, pkt.color, 1.5);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    });

    // 4. DRAW NODES
    const connectedNodeIds = new Set<string>();
    data.edges.forEach(e => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
    });

    data.nodes.forEach(node => {
        const pos = positions[node.id];
        if (!pos) return;

        const x = pos.x - NODE_WIDTH / 2;
        const y = pos.y - NODE_HEIGHT / 2;
        const isHovered = hoveredNodeId === node.id;
        const isSelected = highlightedNodeId === node.id || draggedNodeId === node.id;
        const isLinkStart = linkStartNodeId === node.id;
        const isIsolated = !connectedNodeIds.has(node.id);
        
        const isError = errorNodeIds.includes(node.id);
        const isSuccess = successNodeIds.includes(node.id);
        const isAIHighlighted = activeHighlightNodes.includes(node.id); 

        const color = getLayerColor(node.type);

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        if (isError) {
             ctx.shadowColor = '#ef4444'; 
             ctx.shadowBlur = 30;
             ctx.shadowOffsetY = 0;
        } else if (isSuccess) {
             ctx.shadowColor = '#22c55e'; 
             ctx.shadowBlur = 30;
             ctx.shadowOffsetY = 0;
        } else if (isAIHighlighted) {
            ctx.shadowColor = '#fbbf24'; 
            ctx.shadowBlur = 30; 
            ctx.shadowOffsetY = 0; 
        }

        ctx.fillStyle = '#1e293b';
        drawRoundedRect(ctx, x, y, NODE_WIDTH, NODE_HEIGHT, 8);
        ctx.fill();
        
        if (!isAIHighlighted && !isError && !isSuccess) {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        }

        let borderColor = '#475569';
        let borderWidth = 1;

        if (isError) {
             borderColor = '#ef4444';
             borderWidth = 3;
        } else if (isSuccess) {
             borderColor = '#22c55e';
             borderWidth = 3;
        } else if (isAIHighlighted) {
            borderColor = '#fbbf24'; 
            borderWidth = 3;
        } else if (isLinkStart) {
            borderColor = '#22d3ee';
            borderWidth = 2;
        } else if (isHovered || isSelected) {
            borderColor = color;
            borderWidth = 2;
        } 

        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        
        if (isLinkStart) {
            ctx.setLineDash([5, 5]);
        }

        if ((isHovered || isSelected) && !isAIHighlighted && !isError && !isSuccess) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
        }
        
        drawRoundedRect(ctx, x, y, NODE_WIDTH, NODE_HEIGHT, 8);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowColor = 'transparent';
        ctx.setLineDash([]); 

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 5, y);
        ctx.arcTo(x, y, x, y + 6, 6);
        ctx.lineTo(x, y + NODE_HEIGHT - 6);
        ctx.arcTo(x, y + NODE_HEIGHT, x + 6, y + NODE_HEIGHT, 6);
        ctx.lineTo(x + 5, y + NODE_HEIGHT);
        ctx.lineTo(x + 5, y);
        ctx.fill();

        const iconY = y + NODE_HEIGHT/2;
        const iconX = x + 28;
        ctx.beginPath(); ctx.arc(iconX, iconY, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(iconX, iconY, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let label = node.label;
        if (label.length > 22) label = label.substring(0, 20) + '..';
        ctx.fillText(label, x + 50, y + 16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px JetBrains Mono';
        const tech = node.technologies?.[0] || node.type;
        ctx.fillText(tech.substring(0, 22), x + 50, y + 36);

        if (isIsolated) {
            const warnX = x + NODE_WIDTH; 
            const warnY = y; 

            ctx.shadowBlur = 0; 
            ctx.beginPath();
            ctx.arc(warnX, warnY, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a'; 
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.font = '16px "Material Icons"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('link_off', warnX, warnY);
        }
    });

    if ( (isLinkingDrag || isLinkingMode) && linkStartNodeId && positions[linkStartNodeId]) {
        const s = positions[linkStartNodeId];
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + NODE_HEIGHT/2);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore();

    if (data && data.nodes.length > 0) {
        const visibleNodes = data.nodes.filter(n => positions[n.id]);
        
        if (visibleNodes.length > 0) {
            const mmW = 200; 
            const mmH = 140;
            const mmPad = 24;
            const mmX = canvas.width - mmW - mmPad;
            const mmY = canvas.height - mmH - mmPad;

            ctx.save();
            ctx.fillStyle = '#0f172a'; 
            ctx.fillRect(mmX, mmY, mmW, mmH);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(mmX, mmY, mmW, mmH);

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            Object.values(layerBounds).forEach((b: any) => {
                if(b.y < minY) minY = b.y;
                if((b.y + b.height) > maxY) maxY = b.y + b.height;
            });
            visibleNodes.forEach(n => {
                const pos = positions[n.id];
                if (pos.x < minX) minX = pos.x;
                if (pos.x > maxX) maxX = pos.x;
                if (pos.y < minY) minY = pos.y;
                if (pos.y > maxY) maxY = pos.y;
            });

            minX -= 400; maxX += 400; 
            minY -= 200; maxY += 300;
            const worldW = maxX - minX;
            const worldH = maxY - minY;
            const mmScaleX = mmW / (worldW || 1);
            const mmScaleY = (mmH) / (worldH || 1);
            const mmScale = Math.min(mmScaleX, mmScaleY);
            
            const offsetX = mmX + (mmW - worldW * mmScale) / 2;
            const offsetY = mmY + (mmH - worldH * mmScale) / 2;

            visibleNodes.forEach(node => {
                const pos = positions[node.id];
                const mx = offsetX + (pos.x - minX) * mmScale;
                const my = offsetY + (pos.y - minY) * mmScale;
                const color = getLayerColor(node.type);
                
                ctx.fillStyle = color;
                ctx.fillRect(mx - 4, my - 2, 8, 4);
            });

            const vwX = -offset.x / scale;
            const vwY = -offset.y / scale;
            const vwW = canvas.width / scale;
            const vwH = canvas.height / scale;

            const mvX = offsetX + (vwX - minX) * mmScale;
            const mvY = offsetY + (vwY - minY) * mmScale;
            const mvW = vwW * mmScale;
            const mvH = vwH * mmScale;

            ctx.beginPath();
            ctx.rect(mmX, mmY, mmW, mmH); 
            ctx.clip();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(mvX, mvY, mvW, mvH);
            
            ctx.restore();
        }
    }

  }, [data, positions, packets, offset, scale, hoveredNodeId, highlightedNodeId, isLinkingDrag, isLinkingMode, linkStartNodeId, mousePos, layerBounds, collapsedLayers, hoveredLayerKey, activeHighlightNodes, activeHighlightLayer, successNodeIds, errorNodeIds, hoveredEdgeId, isDeleteBtnHovered]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      render();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [render]);


  const getEventPos = (e: React.MouseEvent | React.WheelEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, canvasX: 0, canvasY: 0 };
    return { x: e.clientX, y: e.clientY, canvasX: e.clientX - rect.left, canvasY: e.clientY - rect.top };
  };

  const toWorld = (cx: number, cy: number) => ({ x: (cx - offset.x) / scale, y: (cy - offset.y) / scale });

  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(scale + delta, 0.3), 3.0);
      const { canvasX, canvasY } = getEventPos(e);
      const worldPos = toWorld(canvasX, canvasY);
      setOffset({
          x: canvasX - worldPos.x * newScale,
          y: canvasY - worldPos.y * newScale
      });
      setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const { canvasX, canvasY, x, y } = getEventPos(e);
      const worldPos = toWorld(canvasX, canvasY);
      
      if (isDeleteBtnHovered && hoveredEdgeId && onDeleteEdge) {
          onDeleteEdge(hoveredEdgeId);
          setIsDeleteBtnHovered(false);
          setHoveredEdgeId(null);
          return;
      }

      const pillW = 280;
      let clickedLayer = null;
      Object.keys(layerBounds).forEach(key => {
          const bounds = layerBounds[key];
          const pillY = bounds.y - 20;
          if (worldPos.x >= -pillW/2 && worldPos.x <= pillW/2 && worldPos.y >= pillY && worldPos.y <= pillY + 40) {
              clickedLayer = key;
          }
      });

      if (clickedLayer) {
          setCollapsedLayers(prev => ({
              ...prev,
              [clickedLayer as string]: !prev[clickedLayer as string]
          }));
          return;
      }

      let hitId = null;
      if (data) {
          for (const node of data.nodes) {
              const pos = positions[node.id];
              if (!pos) continue;
              if (worldPos.x >= pos.x - NODE_WIDTH/2 && worldPos.x <= pos.x + NODE_WIDTH/2 &&
                  worldPos.y >= pos.y - NODE_HEIGHT/2 && worldPos.y <= pos.y + NODE_HEIGHT/2) {
                  hitId = node.id;
                  break;
              }
          }
      }

      if (hitId) {
          if (isLinkingMode) {
              if (!linkStartNodeId) {
                  setLinkStartNodeId(hitId);
                  setMousePos(worldPos);
              } else {
                  if (hitId !== linkStartNodeId) {
                      if (onConnect) onConnect(linkStartNodeId, hitId);
                      setLinkStartNodeId(null); 
                  } else {
                      setLinkStartNodeId(null);
                  }
              }
              return; 
          }

          if (e.shiftKey) {
              setIsLinkingDrag(true);
              setLinkStartNodeId(hitId);
              setMousePos(worldPos);
          } else {
              setDraggedNodeId(hitId);
              if (onNodeClick) {
                   const n = data?.nodes.find(n => n.id === hitId);
                   if (n) onNodeClick(n);
              }
          }
      } else {
          if (isLinkingMode) {
              setLinkStartNodeId(null); 
          }
          setIsPanning(true);
      }
      
      lastPos.current = { x, y };
      isDragInteraction.current = false;
  };

  const distToSegment = (p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}) => {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const { canvasX, canvasY, x, y } = getEventPos(e);
      const worldPos = toWorld(canvasX, canvasY);
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;

      if (draggedNodeId) {
          isDragInteraction.current = true;
          setPositions(prev => ({
              ...prev,
              [draggedNodeId]: { x: (prev[draggedNodeId]?.x || 0) + dx / scale, y: (prev[draggedNodeId]?.y || 0) + dy / scale }
          }));
      } else if (isPanning) {
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }

      let hitId = null;
      let hitLayer = null;

      const pillW = 280;
      Object.keys(layerBounds).forEach(key => {
          const bounds = layerBounds[key];
          const pillY = bounds.y - 20;
          if (worldPos.x >= -pillW/2 && worldPos.x <= pillW/2 && worldPos.y >= pillY && worldPos.y <= pillY + 40) {
              hitLayer = key;
          }
      });
      setHoveredLayerKey(hitLayer);

      if (data && !hitLayer) {
        for (const node of data.nodes) {
            const pos = positions[node.id];
            if (!pos) continue;
            if (worldPos.x >= pos.x - NODE_WIDTH/2 && worldPos.x <= pos.x + NODE_WIDTH/2 &&
                worldPos.y >= pos.y - NODE_HEIGHT/2 && worldPos.y <= pos.y + NODE_HEIGHT/2) {
                hitId = node.id;
                break;
            }
        }
      }
      setHoveredNodeId(hitId);

      if (!hitId && !hitLayer && data) {
          let closestEdgeId = null;
          let minDistance = Infinity;
          let overDelete = false;

          for (const edge of data.edges) {
              const start = positions[edge.source];
              const end = positions[edge.target];
              if (!start || !end) continue;

              const offsetVal = getEdgeOffset(edge, data.edges);
              const points = getOrthogonalPath(start, end, offsetVal);

              let dist = Infinity;
              dist = Math.min(dist, distToSegment(worldPos, points[0], points[1]));
              dist = Math.min(dist, distToSegment(worldPos, points[1], points[2]));
              dist = Math.min(dist, distToSegment(worldPos, points[2], points[3]));

              if (dist < 10 && dist < minDistance) {
                  minDistance = dist;
                  closestEdgeId = edge.id;
                  
                  const midX = (points[1].x + points[2].x) / 2;
                  const midY = (points[1].y + points[2].y) / 2;
                  const distToMid = Math.hypot(worldPos.x - midX, worldPos.y - midY);
                  if (distToMid < 15) {
                      overDelete = true;
                  }
              }
          }
          setHoveredEdgeId(closestEdgeId);
          setIsDeleteBtnHovered(overDelete);
      } else {
          setHoveredEdgeId(null);
          setIsDeleteBtnHovered(false);
      }

      if (isLinkingDrag || (isLinkingMode && linkStartNodeId)) {
          setMousePos(worldPos);
      }
      lastPos.current = { x, y };
  };

  const handleMouseUp = () => {
      if (isLinkingDrag && linkStartNodeId && hoveredNodeId && linkStartNodeId !== hoveredNodeId) {
          if (onConnect) onConnect(linkStartNodeId, hoveredNodeId);
      }
      
      setIsLinkingDrag(false);
      setDraggedNodeId(null);
      setIsPanning(false);
      
      if (!isLinkingMode) {
          setLinkStartNodeId(null);
      }
  };

  const cursorStyle = draggedNodeId || isPanning ? 'cursor-grabbing' : 
                      isDeleteBtnHovered ? 'cursor-pointer' :
                      isLinkingMode ? 'cursor-crosshair' : 
                      '';

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#0f172a] overflow-hidden select-none outline-none ${className || 'w-full h-full'} ${isLinkingMode ? 'cursor-crosshair' : ''}`}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px` 
        }}
      />
      <canvas 
        ref={canvasRef} 
        width={canvasSize.width} 
        height={canvasSize.height} 
        className={`block touch-none ${cursorStyle}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 font-mono pointer-events-none select-none">
        <span>SCROLL to Zoom • DRAG to Pan • CLICK Headers to Collapse</span>
      </div>
    </div>
  );
};
