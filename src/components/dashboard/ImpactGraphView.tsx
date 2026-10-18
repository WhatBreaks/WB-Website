import React, { useState, useRef, useMemo } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Filter,
  Layers,
  List,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sliders,
  X
} from 'lucide-react'
import { SCENARIOS } from '../../mockData'

interface ImpactGraphViewProps {
  selectedScenarioKey: string
  onSelectScenario: (scenarioKey: string) => void
  onInspectService?: (serviceId: string) => void
}

interface GraphNode {
  id: string
  name: string
  type: 'gateway' | 'service' | 'database' | 'cache' | 'queue' | 'worker'
  version: string
  x: number
  y: number
  tier: number
  callers: number
  status: 'healthy' | 'warning' | 'risk' | 'unaffected'
  impactRole?: 'source' | 'direct' | 'indirect' | 'none'
  description: string
  traffic: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  protocol: string
  status: 'healthy' | 'warning' | 'risk' | 'unaffected'
  pathType: 'direct' | 'indirect' | 'standard'
  impactDetails?: string
}

export const ImpactGraphView: React.FC<ImpactGraphViewProps> = ({
  selectedScenarioKey,
  onSelectScenario,
  onInspectService
}) => {
  const [viewFormat, setViewFormat] = useState<'graph' | 'list'>('graph')
  const [isExpandedFullscreen, setIsExpandedFullscreen] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('postgresql')
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'affected' | 'high' | 'healthy'>('all')
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'radial'>('hierarchical')

  const containerRef = useRef<HTMLDivElement>(null)
  const scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['pg-15-16']

  // Base raw nodes definition with tier coordinates
  const rawNodes: GraphNode[] = useMemo(() => {
    return [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        type: 'gateway',
        version: 'Envoy 1.28',
        x: 460,
        y: 60,
        tier: 1,
        callers: 12400,
        status: 'healthy',
        description: 'Edge reverse proxy routing public ingress traffic via Envoy.',
        traffic: '12.4k req/sec'
      },
      {
        id: 'auth-service',
        name: 'Auth Service',
        type: 'service',
        version: 'v2.14.0 (Node.js)',
        x: 220,
        y: 190,
        tier: 2,
        callers: 1420,
        status: 'healthy',
        description: 'OAuth2 and session token issuance with SCRAM authentication.',
        traffic: '1,420 req/sec'
      },
      {
        id: 'user-service',
        name: 'User Service',
        type: 'service',
        version: 'v3.1.2 (Go)',
        x: 460,
        y: 190,
        tier: 2,
        callers: 2890,
        status: 'healthy',
        description: 'Directory service, RBAC roles, and customer profiles.',
        traffic: '2,890 req/sec'
      },
      {
        id: 'billing-service',
        name: 'Billing Service',
        type: 'service',
        version: 'v1.9.4 (Ruby)',
        x: 700,
        y: 190,
        tier: 2,
        callers: 380,
        status: 'healthy',
        description: 'Payment reconciliation, invoice ledger, and Stripe webhooks.',
        traffic: '380 req/sec'
      },
      {
        id: 'redis',
        name: 'Redis',
        type: 'cache',
        version: '7.0.11',
        x: 140,
        y: 330,
        tier: 3,
        callers: 9500,
        status: 'healthy',
        description: 'Cluster for active session storage and API rate limits.',
        traffic: '9,500 ops/sec'
      },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        type: 'database',
        version: scenario.id === 'pg-15-16' ? '15.4 → 16.1' : '15.4',
        x: 460,
        y: 340,
        tier: 3,
        callers: 4200,
        status: 'healthy',
        description: 'Primary transactional cluster (Aurora Multi-AZ replica).',
        traffic: '4,200 tps'
      },
      {
        id: 'queue',
        name: 'RabbitMQ',
        type: 'queue',
        version: '3.12 (AMQP)',
        x: 780,
        y: 330,
        tier: 3,
        callers: 1100,
        status: 'healthy',
        description: 'Message broker buffering async audit logs and webhooks.',
        traffic: '1,100 msg/sec'
      },
      {
        id: 'worker',
        name: 'Worker Service',
        type: 'worker',
        version: 'v2.6.0 (Python)',
        x: 640,
        y: 470,
        tier: 4,
        callers: 85,
        status: 'healthy',
        description: 'Background worker running queue consumers and scheduled cron.',
        traffic: '85 jobs/sec'
      },
      {
        id: 'analytics',
        name: 'Analytics Service',
        type: 'service',
        version: 'v1.11.0 (Rust)',
        x: 280,
        y: 470,
        tier: 4,
        callers: 42,
        status: 'healthy',
        description: 'Telemetry aggregation and business event data streaming.',
        traffic: '42 batch/sec'
      }
    ]
  }, [scenario])

  // Radial positions calculation if radial layout selected
  const nodes: GraphNode[] = useMemo(() => {
    return rawNodes.map((node) => {
      let x = node.x
      let y = node.y

      if (layoutMode === 'radial') {
        const angleMap: Record<string, number> = {
          'postgresql': 0, // center
          'auth-service': (Math.PI * 0.85),
          'billing-service': (Math.PI * 0.15),
          'user-service': (Math.PI * 0.5),
          'api-gateway': (Math.PI * 0.65),
          'redis': (Math.PI * 1.15),
          'queue': (Math.PI * 1.85),
          'worker': (Math.PI * 1.5),
          'analytics': (Math.PI * 1.35)
        }
        if (node.id === 'postgresql') {
          x = 460
          y = 280
        } else {
          const angle = angleMap[node.id] || 0
          const radius = node.tier === 2 ? 150 : node.tier === 4 ? 240 : 200
          x = 460 + Math.cos(angle) * radius
          y = 280 - Math.sin(angle) * radius
        }
      }

      // Calculate blast radius status based on current scenario
      let status: GraphNode['status'] = 'unaffected'
      let impactRole: GraphNode['impactRole'] = 'none'

      if (selectedScenarioKey === 'pg-15-16') {
        if (node.id === 'postgresql') {
          status = 'risk'
          impactRole = 'source'
        } else if (node.id === 'auth-service' || node.id === 'billing-service') {
          status = 'risk'
          impactRole = 'direct'
        } else if (node.id === 'worker') {
          status = 'warning'
          impactRole = 'indirect'
        } else if (node.id === 'analytics') {
          status = 'warning'
          impactRole = 'indirect'
        } else if (node.id === 'api-gateway' || node.id === 'user-service' || node.id === 'redis' || node.id === 'queue') {
          status = 'healthy'
          impactRole = 'none'
        }
      } else if (selectedScenarioKey === 'redis-6-7') {
        if (node.id === 'redis') {
          status = 'warning'
          impactRole = 'source'
        } else if (node.id === 'auth-service') {
          status = 'warning'
          impactRole = 'direct'
        } else if (node.id === 'api-gateway') {
          status = 'warning'
          impactRole = 'indirect'
        } else {
          status = 'healthy'
          impactRole = 'none'
        }
      } else {
        // envoy-minor
        if (node.id === 'api-gateway') {
          status = 'healthy'
          impactRole = 'source'
        } else {
          status = 'healthy'
          impactRole = 'none'
        }
      }

      return {
        ...node,
        x,
        y,
        status,
        impactRole
      }
    })
  }, [rawNodes, layoutMode, selectedScenarioKey])

  // Edges definition
  const edges: GraphEdge[] = useMemo(() => {
    const rawEdges: GraphEdge[] = [
      {
        id: 'e-gw-auth',
        source: 'api-gateway',
        target: 'auth-service',
        label: 'HTTP/2 Ingress',
        protocol: 'HTTP/2',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-gw-user',
        source: 'api-gateway',
        target: 'user-service',
        label: 'HTTP/2 Ingress',
        protocol: 'HTTP/2',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-gw-bill',
        source: 'api-gateway',
        target: 'billing-service',
        label: 'HTTP/2 Ingress',
        protocol: 'HTTP/2',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-auth-redis',
        source: 'auth-service',
        target: 'redis',
        label: 'Redis Cache (mTLS)',
        protocol: 'Redis TCP',
        status: selectedScenarioKey === 'redis-6-7' ? 'warning' : 'healthy',
        pathType: selectedScenarioKey === 'redis-6-7' ? 'direct' : 'standard',
        impactDetails: selectedScenarioKey === 'redis-6-7' ? 'Protocol bump causes connection drop during auth token verify.' : undefined
      },
      {
        id: 'e-auth-pg',
        source: 'auth-service',
        target: 'postgresql',
        label: 'Database Connection (TCP)',
        protocol: 'TCP (pgx)',
        status: selectedScenarioKey === 'pg-15-16' ? 'risk' : 'healthy',
        pathType: selectedScenarioKey === 'pg-15-16' ? 'direct' : 'standard',
        impactDetails: selectedScenarioKey === 'pg-15-16' ? 'SCRAM-SHA-256 handshake mismatch. Client pg@8.7.1 lacks channel binding.' : undefined
      },
      {
        id: 'e-user-pg',
        source: 'user-service',
        target: 'postgresql',
        label: 'Database Connection (TCP)',
        protocol: 'TCP (lib/pq)',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-user-queue',
        source: 'user-service',
        target: 'queue',
        label: 'AMQP Publish',
        protocol: 'AMQP 0-9-1',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-bill-pg',
        source: 'billing-service',
        target: 'postgresql',
        label: 'Database Connection (PgBouncer)',
        protocol: 'TCP / SSL',
        status: selectedScenarioKey === 'pg-15-16' ? 'risk' : 'healthy',
        pathType: selectedScenarioKey === 'pg-15-16' ? 'direct' : 'standard',
        impactDetails: selectedScenarioKey === 'pg-15-16' ? 'Pool timeout 5000ms < PG16 cold handshake time 6200ms.' : undefined
      },
      {
        id: 'e-queue-worker',
        source: 'queue',
        target: 'worker',
        label: 'AMQP Consume',
        protocol: 'AMQP 0-9-1',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-worker-pg',
        source: 'worker',
        target: 'postgresql',
        label: 'Database Connection (Batch)',
        protocol: 'TCP',
        status: selectedScenarioKey === 'pg-15-16' ? 'warning' : 'healthy',
        pathType: selectedScenarioKey === 'pg-15-16' ? 'indirect' : 'standard',
        impactDetails: selectedScenarioKey === 'pg-15-16' ? 'Implicit timestamp casting deprecation in bulk update batch.' : undefined
      },
      {
        id: 'e-worker-analytics',
        source: 'worker',
        target: 'analytics',
        label: 'Telemetry gRPC',
        protocol: 'gRPC HTTP/2',
        status: 'healthy',
        pathType: 'standard'
      },
      {
        id: 'e-bill-analytics',
        source: 'billing-service',
        target: 'analytics',
        label: 'Event Stream',
        protocol: 'gRPC',
        status: selectedScenarioKey === 'pg-15-16' ? 'warning' : 'healthy',
        pathType: selectedScenarioKey === 'pg-15-16' ? 'indirect' : 'standard',
        impactDetails: selectedScenarioKey === 'pg-15-16' ? 'Replication slot reset causes 300s telemetry ingestion lag.' : undefined
      }
    ]
    return rawEdges
  }, [selectedScenarioKey])

  // Filter nodes based on active filter
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (filterMode === 'all') return true
      if (filterMode === 'affected') return n.status === 'risk' || n.status === 'warning'
      if (filterMode === 'high') return n.status === 'risk'
      if (filterMode === 'healthy') return n.status === 'healthy' || n.status === 'unaffected'
      return true
    })
  }, [nodes, filterMode])

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])

  // Filter edges where both source and target are visible
  const visibleEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
  }, [edges, visibleNodeIds])

  // Find inspected node
  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null
  }, [nodes, selectedNodeId])

  // Find inspected edge
  const activeEdge = useMemo(() => {
    return edges.find((e) => e.id === selectedEdgeId) || null
  }, [edges, selectedEdgeId])

  // Direct connected nodes to the selected node
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>([selectedNodeId])
    edges.forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target)
      if (e.target === selectedNodeId) set.add(e.source)
    })
    return set
  }, [selectedNodeId, edges])

  // Dragging handlers for canvas pan (Mouse and Touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0]
      setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNodeId('postgresql')
    setSelectedEdgeId(null)
  }

  return (
    <div className="graph-workspace-root">
      {/* Workspace Header with Context & Scenario Switcher */}
      <div className="graph-workspace-header">
        <div className="graph-header-info">
          <div className="graph-header-meta mono">
            <span>TOPOLOGY GRAPH ENGINE</span>
            <span className="dot-divider">/</span>
            <span>CLUSTER: prod-us-east-1</span>
            <span className="dot-divider">/</span>
            <span className="text-white">TARGET: {scenario.resource}</span>
          </div>
          <h2 className="graph-header-title">Infrastructure Impact Graph</h2>
          <p className="graph-header-subtitle">
            Visual blast-radius calculation. Nodes in red represent critical failure paths; amber represents configuration warnings; green represents unaffected routes.
          </p>
        </div>

        {/* Change Scenario Quick-Switcher */}
        <div className="graph-scenario-switcher">
          <span className="mono text-muted text-xs">SIMULATE TARGET:</span>
          <div className="graph-scenario-buttons">
            <button
              type="button"
              className={`graph-pill ${selectedScenarioKey === 'pg-15-16' ? 'graph-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('pg-15-16')
                setSelectedNodeId('postgresql')
                setSelectedEdgeId(null)
              }}
            >
              <span className="dot dot-risk" />
              <span>PostgreSQL 15.4 → 16.1</span>
              <span className="badge badge-risk mono" style={{ fontSize: '10px' }}>HIGH</span>
            </button>
            <button
              type="button"
              className={`graph-pill ${selectedScenarioKey === 'redis-6-7' ? 'graph-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('redis-6-7')
                setSelectedNodeId('redis')
                setSelectedEdgeId(null)
              }}
            >
              <span className="dot dot-warning" />
              <span>Redis 6.2 → 7.2</span>
              <span className="badge badge-warning mono" style={{ fontSize: '10px' }}>MED</span>
            </button>
            <button
              type="button"
              className={`graph-pill ${selectedScenarioKey === 'envoy-minor' ? 'graph-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('envoy-minor')
                setSelectedNodeId('api-gateway')
                setSelectedEdgeId(null)
              }}
            >
              <span className="dot dot-healthy" />
              <span>API Gateway 1.27 → 1.28</span>
              <span className="badge badge-healthy mono" style={{ fontSize: '10px' }}>LOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Graph Toolbar Controls */}
      <div className="graph-toolbar">
        {/* Left: Filter Buttons */}
        <div className="graph-toolbar-group">
          <span className="toolbar-label mono">
            <Filter size={12} />
            <span>FILTER:</span>
          </span>
          <button
            type="button"
            className={`toolbar-btn ${filterMode === 'all' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Resources ({nodes.length})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterMode === 'affected' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setFilterMode('affected')}
          >
            <span className="dot dot-risk" style={{ width: 6, height: 6 }} />
            Affected Only ({nodes.filter(n => n.status === 'risk' || n.status === 'warning').length})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterMode === 'high' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setFilterMode('high')}
          >
            <span className="dot dot-risk" style={{ width: 6, height: 6 }} />
            High Risk Only ({nodes.filter(n => n.status === 'risk').length})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterMode === 'healthy' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setFilterMode('healthy')}
          >
            <span className="dot dot-healthy" style={{ width: 6, height: 6 }} />
            Healthy ({nodes.filter(n => n.status === 'healthy' || n.status === 'unaffected').length})
          </button>
        </div>

        {/* Center: Layout Selector */}
        <div className="graph-toolbar-group">
          <span className="toolbar-label mono">
            <Layers size={12} />
            <span>LAYOUT:</span>
          </span>
          <button
            type="button"
            className={`toolbar-btn ${layoutMode === 'hierarchical' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setLayoutMode('hierarchical')}
          >
            Tiered Pipeline
          </button>
          <button
            type="button"
            className={`toolbar-btn ${layoutMode === 'radial' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setLayoutMode('radial')}
          >
            Radial Blast
          </button>
        </div>

        {/* Center-Right: View Mode & Fullscreen */}
        <div className="graph-toolbar-group graph-view-toggle-group">
          <button
            type="button"
            className={`toolbar-btn ${viewFormat === 'graph' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setViewFormat('graph')}
          >
            <Layers size={12} />
            <span>Graph Canvas</span>
          </button>
          <button
            type="button"
            className={`toolbar-btn ${viewFormat === 'list' ? 'toolbar-btn-active' : ''}`}
            onClick={() => setViewFormat('list')}
          >
            <List size={12} />
            <span>Dependency List</span>
          </button>
        </div>

        {/* Right: Zoom / Pan Controls */}
        <div className="graph-toolbar-group graph-controls-right">
          <button
            type="button"
            className="toolbar-icon-btn"
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
          >
            <ZoomIn size={14} />
          </button>
          <span className="zoom-percentage mono">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="toolbar-icon-btn"
            title="Zoom Out"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="toolbar-icon-btn"
            title="Fit to Screen"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            className="toolbar-icon-btn"
            title="Reset Graph"
            onClick={handleReset}
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            className={`toolbar-icon-btn ${isExpandedFullscreen ? 'toolbar-btn-active' : ''}`}
            title={isExpandedFullscreen ? "Exit Fullscreen Mode" : "Expand Graph Fullscreen"}
            onClick={() => setIsExpandedFullscreen(!isExpandedFullscreen)}
            aria-label={isExpandedFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
          >
            {isExpandedFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {viewFormat === 'list' ? (
        /* Accessible Dependency List / Table Alternative */
        <div className="dependency-list-view panel">
          <div className="dep-list-header">
            <div className="mono text-xs text-muted">TOPOLOGY DEPENDENCY INVENTORY & CONNECTIONS</div>
            <p className="text-secondary text-xs" style={{ margin: '4px 0 0 0' }}>
              Explore relationships directly across production microservices. Tap any resource to inspect immediate callers and downstream dependencies.
            </p>
          </div>

          <div className="dep-nodes-grid">
            {nodes.map((n) => {
              const isSelected = selectedNodeId === n.id
              const incomingEdges = visibleEdges.filter((e) => e.target === n.id)
              const outgoingEdges = visibleEdges.filter((e) => e.source === n.id)
              return (
                <div
                  key={n.id}
                  className={`dep-node-card panel ${isSelected ? 'dep-card-selected' : ''}`}
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <div className="dep-card-top">
                    <div>
                      <div className="dep-node-name font-semibold text-white">{n.name}</div>
                      <div className="mono text-muted text-xs">
                        {n.version} · {n.type.toUpperCase()} · Tier {n.tier}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        n.status === 'risk'
                          ? 'badge-risk'
                          : n.status === 'warning'
                          ? 'badge-warning'
                          : 'badge-healthy'
                      } mono text-xs`}
                    >
                      {n.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-secondary text-xs" style={{ margin: '8px 0' }}>
                    {n.description}
                  </p>

                  <div className="dep-connections-block mono text-xs">
                    <div className="dep-conn-row">
                      <span className="text-muted">UPSTREAM CALLERS ({incomingEdges.length}):</span>
                      <span className="text-white" style={{ marginLeft: 6 }}>
                        {incomingEdges.length > 0
                          ? incomingEdges
                              .map((e) => nodes.find((x) => x.id === e.source)?.name || e.source)
                              .join(', ')
                          : 'Edge Ingress Entry'}
                      </span>
                    </div>
                    <div className="dep-conn-row" style={{ marginTop: '4px' }}>
                      <span className="text-muted">DOWNSTREAM TARGETS ({outgoingEdges.length}):</span>
                      <span className="text-white" style={{ marginLeft: 6 }}>
                        {outgoingEdges.length > 0
                          ? outgoingEdges
                              .map((e) => nodes.find((x) => x.id === e.target)?.name || e.target)
                              .join(', ')
                          : 'Terminal Storage Node'}
                      </span>
                    </div>
                  </div>

                  <div className="dep-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNodeId(n.id)
                        setViewFormat('graph')
                      }}
                    >
                      <span>Locate on Graph</span>
                    </button>
                    {onInspectService && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onInspectService(n.id)
                        }}
                      >
                        <span>Inspect Resource</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Main Interactive Canvas Area */
        <div
          className={`graph-canvas-container ${isExpandedFullscreen ? 'graph-fullscreen-mobile' : ''}`}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {isExpandedFullscreen && (
            <button
              type="button"
              className="exit-fullscreen-btn mono"
              onClick={() => setIsExpandedFullscreen(false)}
            >
              <Minimize2 size={13} />
              <span>Exit Fullscreen</span>
            </button>
          )}
        {/* Background Grid Lines Pattern */}
        <div className="graph-grid-backdrop" />

        {/* Legend Overlay in top-left of canvas */}
        <div className="graph-legend panel">
          <div className="legend-title mono">BLAST PATH METRICS</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="dot dot-risk" />
              <span>High Risk / Breaker</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-warning" />
              <span>Config Warning / Lag</span>
            </div>
            <div className="legend-item">
              <span className="dot dot-healthy" />
              <span>Healthy / Unaffected</span>
            </div>
          </div>
          <div className="legend-footer mono">
            CLICK NODE OR EDGE TO INSPECT
          </div>
        </div>

        {/* SVG Drawing Layer */}
        <svg
          className="graph-svg-layer"
          viewBox="0 0 920 560"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Arrow markers */}
            <marker
              id="arrow-risk"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
            </marker>
            <marker
              id="arrow-warning"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker
              id="arrow-healthy"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
            </marker>
            <marker
              id="arrow-dim"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4B5563" />
            </marker>
          </defs>

          {/* Render Connections / Edges */}
          <g className="graph-edges-group">
            {visibleEdges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source)
              const tgt = nodes.find((n) => n.id === edge.target)
              if (!src || !tgt) return null

              const isEdgeSelected = selectedEdgeId === edge.id
              const isConnectedToSelectedNode =
                selectedNodeId === edge.source || selectedNodeId === edge.target

              const isDimmed =
                selectedNodeId && !isConnectedToSelectedNode && !isEdgeSelected

              // Color mapping
              let strokeColor = '#3A3A3A'
              let marker = 'url(#arrow-dim)'

              if (edge.status === 'risk') {
                strokeColor = '#EF4444'
                marker = 'url(#arrow-risk)'
              } else if (edge.status === 'warning') {
                strokeColor = '#F59E0B'
                marker = 'url(#arrow-warning)'
              } else if (edge.status === 'healthy') {
                strokeColor = '#22C55E'
                marker = 'url(#arrow-healthy)'
              }

              if (isDimmed) {
                strokeColor = '#2A2A2A'
                marker = 'url(#arrow-dim)'
              }

              // Path computation (curved bezier)
              const dx = tgt.x - src.x
              const dy = tgt.y - src.y
              const cx1 = src.x + dx * 0.25
              const cy1 = src.y + dy * 0.75
              const cx2 = src.x + dx * 0.75
              const cy2 = tgt.y - dy * 0.25

              const pathD = `M ${src.x} ${src.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tgt.x} ${tgt.y}`

              return (
                <g key={edge.id} className="graph-edge-element">
                  {/* Invisible thicker hit-area for easier clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEdgeId(edge.id)
                      setSelectedNodeId(null)
                    }}
                  />
                  {/* Visual Connection line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isEdgeSelected ? 3.5 : isConnectedToSelectedNode ? 2.5 : 1.5}
                    strokeDasharray={edge.status === 'warning' ? '4 3' : undefined}
                    markerEnd={marker}
                    className={`graph-edge-path ${edge.status === 'risk' ? 'edge-pulse-risk' : ''}`}
                  />
                  {/* Protocol pill on edge midpoint */}
                  {(isEdgeSelected || isConnectedToSelectedNode) && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      textAnchor="middle"
                      fill={edge.status === 'risk' ? '#EF4444' : '#E8E8E3'}
                      fontSize="9"
                      fontFamily="monospace"
                      className="edge-protocol-label"
                    >
                      {edge.protocol}
                    </text>
                  )}
                </g>
              )
            })}
          </g>

          {/* Render Nodes */}
          <g className="graph-nodes-group">
            {visibleNodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              const isConnected = connectedNodeIds.has(node.id)
              const isDimmed = selectedNodeId && !isSelected && !isConnected

              let strokeColor = '#3A3A3A'
              let fillColor = '#202020'
              let badgeColor = '#8C8C86'

              if (node.status === 'risk') {
                strokeColor = '#EF4444'
                badgeColor = '#EF4444'
                fillColor = '#241414'
              } else if (node.status === 'warning') {
                strokeColor = '#F59E0B'
                badgeColor = '#F59E0B'
                fillColor = '#241D14'
              } else if (node.status === 'healthy') {
                strokeColor = '#22C55E'
                badgeColor = '#22C55E'
                fillColor = '#142017'
              }

              if (isSelected) {
                strokeColor = '#FFFFFF'
              }

              const nodeWidth = 140
              const nodeHeight = 56
              const nx = node.x - nodeWidth / 2
              const ny = node.y - nodeHeight / 2

              return (
                <g
                  key={node.id}
                  className={`graph-node-g ${isSelected ? 'node-selected' : ''} ${isDimmed ? 'node-dimmed' : ''}`}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedNodeId(node.id)
                    setSelectedEdgeId(null)
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selected Outer Ring */}
                  {isSelected && (
                    <rect
                      x={nx - 4}
                      y={ny - 4}
                      width={nodeWidth + 8}
                      height={nodeHeight + 8}
                      rx="8"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Impact Source Pulse Halo */}
                  {node.impactRole === 'source' && (
                    <rect
                      x={nx - 6}
                      y={ny - 6}
                      width={nodeWidth + 12}
                      height={nodeHeight + 12}
                      rx="10"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1"
                      className="source-pulse-halo"
                    />
                  )}

                  {/* Main Node Card Body */}
                  <rect
                    x={nx}
                    y={ny}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="6"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Node Type Tag */}
                  <text
                    x={nx + 10}
                    y={ny + 16}
                    fill={badgeColor}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                    letterSpacing="0.05em"
                  >
                    {node.type.toUpperCase()}
                  </text>

                  {/* Status Indicator Dot */}
                  <circle
                    cx={nx + nodeWidth - 14}
                    cy={ny + 14}
                    r="4"
                    fill={
                      node.status === 'risk'
                        ? '#EF4444'
                        : node.status === 'warning'
                        ? '#F59E0B'
                        : '#22C55E'
                    }
                  />

                  {/* Node Name */}
                  <text
                    x={nx + 10}
                    y={ny + 33}
                    fill="#FFFFFF"
                    fontSize="11.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {node.name}
                  </text>

                  {/* Node Version / Metric */}
                  <text
                    x={nx + 10}
                    y={ny + 46}
                    fill="#8C8C86"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.version}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNodeId && !selectedNodeId && (
          <div
            className="graph-hover-tooltip panel"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              pointerEvents: 'none'
            }}
          >
            {(() => {
              const hNode = nodes.find((n) => n.id === hoveredNodeId)
              if (!hNode) return null
              return (
                <div>
                  <div className="mono text-xs text-muted">{hNode.type.toUpperCase()}</div>
                  <div className="font-semibold text-white">{hNode.name}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    Traffic: {hNode.traffic}
                  </div>
                  <div className="text-xs text-muted">
                    Dependents: {hNode.callers} callers
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Node Information Inspection Panel (Right Drawer) */}
        {activeNode && (
          <div className="graph-inspector-panel panel">
            <div className="inspector-panel-header">
              <div className="inspector-panel-title-wrap">
                <span className="mono text-xs text-muted">{activeNode.type.toUpperCase()} SPECIFICATION</span>
                <h3 className="inspector-panel-title">{activeNode.name}</h3>
              </div>
              <button
                type="button"
                className="close-inspector-btn"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close Inspector"
              >
                <X size={14} />
              </button>
            </div>

            <div className="inspector-risk-banner">
              <div className="flex items-center gap-2">
                <span
                  className={`dot ${
                    activeNode.status === 'risk'
                      ? 'dot-risk'
                      : activeNode.status === 'warning'
                      ? 'dot-warning'
                      : 'dot-healthy'
                  }`}
                />
                <span className="mono text-xs font-semibold text-white">
                  STATUS: {activeNode.status.toUpperCase()}
                </span>
              </div>
              {activeNode.impactRole && activeNode.impactRole !== 'none' && (
                <span className="badge badge-risk mono" style={{ fontSize: '10px' }}>
                  ROLE: {activeNode.impactRole.toUpperCase()}
                </span>
              )}
            </div>

            <div className="inspector-metrics-grid">
              <div className="metric-box">
                <div className="metric-lbl mono">VERSION</div>
                <div className="metric-val mono text-white">{activeNode.version}</div>
              </div>
              <div className="metric-box">
                <div className="metric-lbl mono">TRAFFIC</div>
                <div className="metric-val mono text-white">{activeNode.traffic}</div>
              </div>
              <div className="metric-box">
                <div className="metric-lbl mono">DEPENDENT CALLERS</div>
                <div className="metric-val mono text-white">{activeNode.callers}</div>
              </div>
              <div className="metric-box">
                <div className="metric-lbl mono">TIER LEVEL</div>
                <div className="metric-val mono text-white">Tier {activeNode.tier}</div>
              </div>
            </div>

            <div className="inspector-section">
              <div className="section-title-sm mono">RESOURCE DESCRIPTION</div>
              <p className="inspector-desc">{activeNode.description}</p>
            </div>

            {/* Direct and Indirect Dependents Summary */}
            <div className="inspector-section">
              <div className="section-title-sm mono">DEPENDENCY BREAKDOWN</div>
              <div className="dependency-breakdown-box panel">
                <div className="dependency-stat-row">
                  <span className="mono text-xs text-muted">DEPENDENTS</span>
                  <span className="mono text-xs text-white font-semibold">{activeNode.callers}</span>
                </div>
                <div className="dependency-group">
                  <div className="dependency-group-label mono text-xs text-muted">DIRECT DEPENDENCIES:</div>
                  <div className="dependency-pills-wrap">
                    <span className="related-pill mono text-xs">Auth Service</span>
                    <span className="related-pill mono text-xs">Billing Service</span>
                  </div>
                </div>
                <div className="dependency-group">
                  <div className="dependency-group-label mono text-xs text-muted">INDIRECT:</div>
                  <div className="dependency-pills-wrap">
                    <span className="related-pill mono text-xs">Worker Service</span>
                    <span className="related-pill mono text-xs">Analytics Service</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Action: Simulate Change */}
            <div className="inspector-section">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (activeNode.id === 'postgresql') {
                    onSelectScenario('pg-15-16')
                  } else if (activeNode.id === 'redis') {
                    onSelectScenario('redis-6-7')
                  } else {
                    onSelectScenario('envoy-minor')
                  }
                }}
              >
                <Sliders size={13} />
                <span>Simulate Change on {activeNode.name}</span>
              </button>
            </div>

            {/* If node is impacted in this scenario, show failure mode */}
            {activeNode.status === 'risk' && (
              <div className="inspector-failure-alert panel">
                <div className="flex items-center gap-2 text-risk mono text-xs font-semibold">
                  <ShieldAlert size={14} />
                  <span>IDENTIFIED BLAST RISK</span>
                </div>
                <p className="text-xs text-muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                  Under the proposed <strong>{scenario.resource} {scenario.proposedVersion}</strong> change,
                  this resource encounters a direct protocol compatibility failure during upstream service handshakes.
                </p>
                {onInspectService && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: 10, width: '100%' }}
                    onClick={() => onInspectService(activeNode.id)}
                  >
                    Inspect in Affected Services Table
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Direct Connections List */}
            <div className="inspector-section">
              <div className="section-title-sm mono">CONNECTED TOPOLOGY</div>
              <div className="inspector-connections-list">
                {edges
                  .filter((e) => e.source === activeNode.id || e.target === activeNode.id)
                  .map((e) => {
                    const isOut = e.source === activeNode.id
                    const otherNodeId = isOut ? e.target : e.source
                    const otherNode = nodes.find((n) => n.id === otherNodeId)
                    return (
                      <div
                        key={e.id}
                        className="connection-item"
                        onClick={() => setSelectedEdgeId(e.id)}
                      >
                        <div className="connection-direction mono text-xs">
                          {isOut ? '→ CALLS OUT TO' : '← CALLED BY'}
                        </div>
                        <div className="connection-name font-semibold text-white">
                          {otherNode?.name || otherNodeId}
                        </div>
                        <div className="connection-proto mono text-muted text-xs">
                          {e.protocol} · {e.label}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Edge / Connection Inspector Panel */}
        {activeEdge && !activeNode && (
          <div className="graph-inspector-panel panel">
            <div className="inspector-panel-header">
              <div className="inspector-panel-title-wrap">
                <span className="mono text-xs text-muted">DEPENDENCY RELATIONSHIP</span>
                <h3 className="inspector-panel-title">{activeEdge.label}</h3>
              </div>
              <button
                type="button"
                className="close-inspector-btn"
                onClick={() => setSelectedEdgeId(null)}
                aria-label="Close Inspector"
              >
                <X size={14} />
              </button>
            </div>

            <div className="inspector-risk-banner">
              <span
                className={`dot ${
                  activeEdge.status === 'risk'
                    ? 'dot-risk'
                    : activeEdge.status === 'warning'
                    ? 'dot-warning'
                    : 'dot-healthy'
                }`}
              />
              <span className="mono text-xs font-semibold text-white">
                PATH STATE: {activeEdge.status.toUpperCase()}
              </span>
            </div>

            <div className="edge-flow-card panel">
              <div className="flow-step">
                <span className="mono text-xs text-muted">SOURCE</span>
                <div className="text-white font-semibold">
                  {nodes.find((n) => n.id === activeEdge.source)?.name}
                </div>
              </div>
              <div className="flow-arrow mono text-muted text-xs">
                ↓ {activeEdge.protocol}
              </div>
              <div className="flow-step">
                <span className="mono text-xs text-muted">TARGET</span>
                <div className="text-white font-semibold">
                  {nodes.find((n) => n.id === activeEdge.target)?.name}
                </div>
              </div>
            </div>

            {activeEdge.impactDetails ? (
              <div className="inspector-failure-alert panel">
                <div className="flex items-center gap-2 text-risk mono text-xs font-semibold">
                  <AlertTriangle size={14} />
                  <span>IDENTIFIED CONFLICT</span>
                </div>
                <p className="text-xs text-muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                  {activeEdge.impactDetails}
                </p>
              </div>
            ) : (
              <div className="inspector-healthy-note panel">
                <div className="flex items-center gap-2 text-healthy mono text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  <span>PATH VERIFIED COMPLIANT</span>
                </div>
                <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                  No breaking protocol or configuration conflicts detected along this dependency edge.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mobile Inspection Drawer Backdrop */}
        {(activeNode || activeEdge) && (
          <div
            className="mobile-inspector-backdrop"
            onClick={() => {
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            }}
            aria-hidden="true"
          />
        )}
      </div>
      )}
    </div>
  )
}
