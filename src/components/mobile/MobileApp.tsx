import React, { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Maximize2,
  Menu,
  Minimize2,
  Network,
  RotateCcw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  Sliders,
  Terminal,
  X
} from 'lucide-react'
import { SCENARIOS } from '../../mockData'

export type MobileNavView =
  | 'investigate'
  | 'impact-analysis'
  | 'resources'
  | 'dependencies'
  | 'blast-radius'
  | 'health'
  | 'integrations'
  | 'settings'

interface MobileAppProps {
  initialView?: MobileNavView
  initialDrawerOpen?: boolean
  initialScenarioKey?: string
  onViewChange?: (view: MobileNavView) => void
}

interface GraphNode {
  id: string
  label: string
  kind: string
  status: 'selected' | 'impacted' | 'connected'
  x: number
  y: number
}

interface GraphEdge {
  from: string
  to: string
  label: string
  type: 'lifecycle' | 'calls' | 'depends_on'
}

const CLUSTERS = [
  { id: 'prod-us-east-1', name: 'prod-us-east-1 (v1.28.4)', env: 'PRODUCTION', resources: 184, syncTime: '2m ago' },
  { id: 'staging-eu-west-1', name: 'staging-eu-west-1 (v1.28.2)', env: 'STAGING', resources: 142, syncTime: '4m ago' },
  { id: 'dev-cluster-01', name: 'dev-cluster-01 (v1.29.0)', env: 'DEVELOPMENT', resources: 96, syncTime: '1m ago' },
]

export const MobileApp: React.FC<MobileAppProps> = ({
  initialView = 'investigate',
  initialDrawerOpen = false,
  initialScenarioKey = 'pg-15-16',
  onViewChange
}) => {
  const [activeView, setActiveView] = useState<MobileNavView>(initialView)
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialDrawerOpen)
  const [selectedClusterId, setSelectedClusterId] = useState('prod-us-east-1')
  const [isClusterDropdownOpen, setIsClusterDropdownOpen] = useState(false)
  const [selectedScenarioKey, setSelectedScenarioKey] = useState(initialScenarioKey)

  // Investigate view state
  const [investigateMode, setInvestigateMode] = useState<'natural' | 'structured'>('natural')
  const [naturalQuery, setNaturalQuery] = useState(
    'e.g. What happens if I upgrade PostgreSQL from 15.4 to 16.1!?'
  )
  const [structuredResource, setStructuredResource] = useState('keda-webhook')
  const [structuredChangeType, setStructuredChangeType] = useState('Version Upgrade')
  const [structuredFromVersion, setStructuredFromVersion] = useState('15.4')
  const [structuredToVersion, setStructuredToVersion] = useState('16.1')
  const [structuredDetails, setStructuredDetails] = useState('connectionTimeoutMillis: 5000\nsslmode: verify-full\nmax_connections: 500')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Impact analysis tabs & card accordions
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'impacted' | 'paths' | 'evidence' | 'assumptions'>('impacted')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'card-0': true
  })
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string>('keda-webhook')
  const [inspectedResource, setInspectedResource] = useState<any | null>(null)

  // Resources view state
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState<'all' | 'critical' | 'pods' | 'services'>('all')

  // Dependencies view state
  const [dependencyFormat, setDependencyFormat] = useState<'graph' | 'list'>('graph')

  // System Health state
  const [diagnosticRunning, setDiagnosticRunning] = useState(false)
  const [diagnosticLogsOpen, setDiagnosticLogsOpen] = useState(false)

  const scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['pg-15-16']
  const selectedCluster = CLUSTERS.find(c => c.id === selectedClusterId) || CLUSTERS[0]

  const handleNavigate = (view: MobileNavView) => {
    setActiveView(view)
    setIsDrawerOpen(false)
    setIsClusterDropdownOpen(false)
    if (onViewChange) onViewChange(view)
  }

  const handleRunAnalysis = (scenarioKey = 'pg-15-16') => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setSelectedScenarioKey(scenarioKey)
      setActiveView('impact-analysis')
      if (onViewChange) onViewChange('impact-analysis')
    }, 450)
  }

  const toggleCardAccordion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // Mobile dependency graph nodes matching reference image
  const graphNodes: GraphNode[] = [
    { id: 'k3d-license-service', label: 'k3d-license-service', kind: 'node', status: 'connected', x: 180, y: 35 },
    { id: 'keda-admission-pod', label: 'keda-admission', kind: 'pod', status: 'connected', x: 65, y: 110 },
    { id: 'keda-webhook', label: 'keda-webhook', kind: 'serviceaccount', status: 'selected', x: 180, y: 130 },
    { id: 'keda-admission-svc', label: 'keda-admission', kind: 'service', status: 'impacted', x: 295, y: 110 },
    { id: 'kedaorg-certs', label: 'kedaorg-certs', kind: 'secret', status: 'connected', x: 65, y: 195 },
    { id: 'keda-admission-deploy', label: 'keda-admission', kind: 'deployment', status: 'impacted', x: 295, y: 175 },
    { id: 'kube-root-ca', label: 'kube-root-ca.crt', kind: 'configmap', status: 'connected', x: 180, y: 235 },
    { id: 'keda-admission-rs', label: 'keda-admission', kind: 'replicaset', status: 'impacted', x: 295, y: 235 },
  ]

  const graphEdges: GraphEdge[] = [
    { from: 'k3d-license-service', to: 'keda-webhook', label: 'DEPENDS_ON', type: 'depends_on' },
    { from: 'keda-admission-pod', to: 'keda-webhook', label: 'CALLS', type: 'calls' },
    { from: 'keda-webhook', to: 'keda-admission-svc', label: 'SERVES', type: 'calls' },
    { from: 'kedaorg-certs', to: 'keda-webhook', label: 'MOUNTS', type: 'lifecycle' },
    { from: 'kube-root-ca', to: 'keda-webhook', label: 'BINDS', type: 'lifecycle' },
    { from: 'keda-admission-deploy', to: 'keda-admission-rs', label: 'OWNS', type: 'lifecycle' },
  ]

  return (
    <div className="mobile-app-root">
      {/* 1. TOP APP BAR (matching reference image) */}
      <header className="mobile-app-topbar">
        <div className="mobile-app-brand">
          <div className="mobile-app-wb-badge mono">WB</div>
          <span className="mobile-app-brand-name mono">WHATBREAKS</span>
        </div>

        <button
          type="button"
          className="mobile-app-menu-toggle"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          aria-label={isDrawerOpen ? "Close navigation" : "Open navigation"}
        >
          {isDrawerOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* 2. MAIN SCROLLABLE VIEW CONTAINER */}
      <main className="mobile-app-content-scroll">
        {/* ======================================================== */}
        {/* VIEW 1: INVESTIGATE (Screen 1 in Reference Image)        */}
        {/* ======================================================== */}
        {activeView === 'investigate' && (
          <div className="mobile-investigate-screen">
            {/* WORKSPACE & CLUSTER CARD */}
            <div className="mobile-scope-card-wrap">
              <div className="mobile-section-label mono">WORKSPACE & CLUSTER</div>
              <div
                className="mobile-scope-selector-card"
                onClick={() => setIsClusterDropdownOpen(!isClusterDropdownOpen)}
                role="button"
                tabIndex={0}
              >
                <div className="mobile-scope-selector-content">
                  <span className="mobile-scope-cluster-name mono font-medium">
                    {selectedCluster.name}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`mobile-scope-chevron ${isClusterDropdownOpen ? 'rotated' : ''}`}
                  />
                </div>
                <div className="mobile-scope-status-line">
                  <span className="dot dot-healthy" />
                  <span className="mobile-scope-status-text mono">
                    Cluster Synced · {selectedCluster.resources} resources · {selectedCluster.syncTime}
                  </span>
                </div>
              </div>

              {/* Cluster Dropdown Menu */}
              {isClusterDropdownOpen && (
                <div className="mobile-cluster-dropdown-menu">
                  {CLUSTERS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`mobile-cluster-option ${c.id === selectedClusterId ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedClusterId(c.id)
                        setIsClusterDropdownOpen(false)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="mono text-white text-xs font-semibold">{c.name}</span>
                        <span className="badge badge-neutral mono text-xs">{c.env}</span>
                      </div>
                      <span className="text-muted text-xs mono">
                        {c.resources} resources · sync {c.syncTime}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* INVESTIGATE SECTION */}
            <div className="mobile-investigate-card">
              <div className="mobile-section-label mono">INVESTIGATE</div>
              <h1 className="mobile-investigate-title">
                What are you planning to change?
              </h1>
              <p className="mobile-investigate-description">
                Input a proposed infrastructure upgrade or configuration modification to calculate downstream blast radius before deployment.
              </p>

              {/* Mode Toggle: Natural Language vs Structured Spec */}
              <div className="mobile-mode-toggle-pill">
                <button
                  type="button"
                  className={`mobile-mode-btn ${investigateMode === 'natural' ? 'active' : ''}`}
                  onClick={() => setInvestigateMode('natural')}
                >
                  Natural Language
                </button>
                <button
                  type="button"
                  className={`mobile-mode-btn ${investigateMode === 'structured' ? 'active' : ''}`}
                  onClick={() => setInvestigateMode('structured')}
                >
                  Structured Spec
                </button>
              </div>

              {/* Natural Language Input */}
              {investigateMode === 'natural' && (
                <div className="mobile-natural-input-wrap">
                  <textarea
                    className="mobile-natural-textarea mono"
                    value={naturalQuery}
                    onChange={(e) => setNaturalQuery(e.target.value)}
                    rows={3}
                    placeholder="e.g. What happens if I upgrade PostgreSQL from 15.4 to 16.1!?"
                  />

                  {/* Big White Analyze Impact Button */}
                  <button
                    type="button"
                    className="mobile-analyze-impact-btn"
                    onClick={() => handleRunAnalysis('pg-15-16')}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <RotateCcw size={16} className="spinning" />
                        <span>Analyzing Blast Radius...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span className="play-triangle">▷</span>
                        <span>Analyze Impact</span>
                      </span>
                    )}
                  </button>

                  {/* Examples Section */}
                  <div className="mobile-examples-section">
                    <div className="mobile-examples-label mono">EXAMPLES</div>
                    <div className="mobile-examples-grid">
                      <button
                        type="button"
                        className="mobile-example-pill mono"
                        onClick={() => {
                          setNaturalQuery('What happens if I upgrade PostgreSQL from 15.4 to 16.1?')
                          handleRunAnalysis('pg-15-16')
                        }}
                      >
                        PostgreSQL 15.4 → 16.1
                      </button>
                      <button
                        type="button"
                        className="mobile-example-pill mono"
                        onClick={() => {
                          setNaturalQuery('What breaks if I upgrade Redis cache from 6.2 to 7.2?')
                          handleRunAnalysis('redis-6-7')
                        }}
                      >
                        Redis 6.2 → 7.2
                      </button>
                      <button
                        type="button"
                        className="mobile-example-pill mono"
                        onClick={() => {
                          setNaturalQuery('What is the impact of scaling web deployment replicas?')
                          handleRunAnalysis('ingress-patch')
                        }}
                      >
                        Scale web deployment
                      </button>
                      <button
                        type="button"
                        className="mobile-example-pill mono"
                        onClick={() => {
                          setNaturalQuery('Update API Gateway Envoy 1.27 to 1.28')
                          handleRunAnalysis('envoy-minor')
                        }}
                      >
                        Update API Gateway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Structured Spec Workflow */}
              {investigateMode === 'structured' && (
                <div className="mobile-structured-workflow">
                  <div className="structured-step-item">
                    <label className="structured-step-label mono">1. TARGET RESOURCE</label>
                    <select
                      className="mobile-select-input mono"
                      value={structuredResource}
                      onChange={(e) => setStructuredResource(e.target.value)}
                    >
                      <option value="keda-webhook">keda-webhook (serviceaccount / keda)</option>
                      <option value="PostgreSQL">PostgreSQL (database / production)</option>
                      <option value="Redis">Redis (cache / session-store)</option>
                      <option value="API Gateway">API Gateway (gateway / envoy-edge)</option>
                    </select>
                  </div>

                  <div className="structured-step-item">
                    <label className="structured-step-label mono">2. PROPOSED CHANGE TYPE</label>
                    <div className="mobile-change-type-pills">
                      {['Version Upgrade', 'Config Update', 'Replica Scaling', 'Schema Migration'].map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`mobile-type-pill ${structuredChangeType === t ? 'active' : ''}`}
                          onClick={() => setStructuredChangeType(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="structured-step-item">
                    <label className="structured-step-label mono">VERSION RANGE</label>
                    <div className="mobile-version-pair">
                      <input
                        type="text"
                        className="mobile-text-input mono"
                        value={structuredFromVersion}
                        onChange={(e) => setStructuredFromVersion(e.target.value)}
                        placeholder="From 15.4"
                      />
                      <span className="mono text-muted">→</span>
                      <input
                        type="text"
                        className="mobile-text-input mono"
                        value={structuredToVersion}
                        onChange={(e) => setStructuredToVersion(e.target.value)}
                        placeholder="To 16.1"
                      />
                    </div>
                  </div>

                  <div className="structured-step-item">
                    <label className="structured-step-label mono">3. OPTIONAL CHANGE DETAILS</label>
                    <textarea
                      className="mobile-natural-textarea mono text-xs"
                      rows={3}
                      value={structuredDetails}
                      onChange={(e) => setStructuredDetails(e.target.value)}
                      placeholder="Enter YAML diff or environment variables..."
                    />
                  </div>

                  <button
                    type="button"
                    className="mobile-analyze-impact-btn"
                    onClick={() => handleRunAnalysis('pg-15-16')}
                    disabled={isAnalyzing}
                  >
                    <span className="play-triangle">▷</span>
                    <span>Analyze Impact</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: IMPACT ANALYSIS (Screen 2 in Reference Image)    */}
        {/* ======================================================== */}
        {activeView === 'impact-analysis' && (
          <div className="mobile-impact-screen">
            {/* SUBHEADER: Back Arrow + Title + Timestamp */}
            <div className="mobile-impact-header">
              <button
                type="button"
                className="mobile-back-btn"
                onClick={() => handleNavigate('investigate')}
                aria-label="Back to Investigate"
              >
                <ArrowLeft size={16} />
                <span className="mobile-impact-title font-semibold">Impact Analysis</span>
              </button>

              <div className="mobile-impact-timestamp mono">
                <span className="dot dot-healthy" />
                <span>Oct 18, 2026 10:21 PM</span>
              </div>
            </div>

            {/* TARGET RESOURCE CARD */}
            <div className="mobile-target-card-wrap">
              <div className="mobile-section-label mono">TARGET RESOURCE</div>
              <div
                className="mobile-target-resource-card"
                onClick={() => setInspectedResource({
                  name: 'keda-webhook',
                  kind: 'serviceaccount',
                  namespace: 'keda',
                  cluster: selectedCluster.name,
                  impact: 'Origin of upgrade change'
                })}
                role="button"
                tabIndex={0}
              >
                <div className="mobile-target-icon-box">
                  <Box size={18} className="text-white" />
                </div>
                <div className="mobile-target-info">
                  <span className="mobile-target-name font-semibold text-white mono">
                    keda-webhook
                  </span>
                  <span className="mobile-target-sub mono text-muted">
                    keda · serviceaccount
                  </span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </div>
            </div>

            {/* SUMMARY METRICS (3 Columns matching reference) */}
            <div className="mobile-metrics-tri-grid">
              {/* Box 1: Impacted Resources */}
              <div className="mobile-metric-tri-box box-impacted">
                <div className="tri-box-icon text-risk">
                  <ShieldAlert size={16} />
                </div>
                <div className="tri-box-num text-white">12</div>
                <div className="tri-box-label text-risk mono">Impacted</div>
                <div className="tri-box-sub text-muted mono">resources</div>
              </div>

              {/* Box 2: Dependency Paths */}
              <div className="mobile-metric-tri-box box-paths">
                <div className="tri-box-icon text-healthy">
                  <Layers size={16} />
                </div>
                <div className="tri-box-num text-white">8</div>
                <div className="tri-box-label text-healthy mono">Dependency</div>
                <div className="tri-box-sub text-muted mono">paths</div>
              </div>

              {/* Box 3: Conflicts Detected */}
              <div className="mobile-metric-tri-box box-conflicts">
                <div className="tri-box-icon text-warning">
                  <AlertTriangle size={16} />
                </div>
                <div className="tri-box-num text-white">2</div>
                <div className="tri-box-label text-warning mono">Conflicts</div>
                <div className="tri-box-sub text-muted mono">detected</div>
              </div>
            </div>

            {/* DEPENDENCY GRAPH SECTION */}
            <div className={`mobile-graph-section ${isGraphFullscreen ? 'graph-fullscreen' : ''}`}>
              <div className="mobile-graph-header">
                <span className="mobile-section-label mono">DEPENDENCY GRAPH</span>
                <div className="mobile-graph-controls">
                  <button
                    type="button"
                    className="mobile-graph-btn mono"
                    onClick={() => setSelectedGraphNodeId('keda-webhook')}
                    title="Fit graph to view"
                  >
                    <RotateCcw size={11} />
                    <span>Fit</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-graph-btn"
                    onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                    title={isGraphFullscreen ? "Exit Fullscreen" : "Fullscreen Graph"}
                  >
                    {isGraphFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>

              {/* SVG Topology Canvas matching reference image nodes */}
              <div className="mobile-graph-canvas-wrap">
                <svg
                  className="mobile-graph-svg"
                  viewBox="0 0 360 270"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <marker
                      id="arrow-green"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                    </marker>
                    <marker
                      id="arrow-red"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
                    </marker>
                    <marker
                      id="arrow-dash"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#71717a" />
                    </marker>
                  </defs>

                  {/* Directed Edges */}
                  {graphEdges.map((edge, idx) => {
                    const fromNode = graphNodes.find(n => n.id === edge.from)
                    const toNode = graphNodes.find(n => n.id === edge.to)
                    if (!fromNode || !toNode) return null

                    const isDashed = edge.type === 'lifecycle'
                    const strokeColor = edge.from === 'keda-webhook' || edge.to === 'keda-webhook' ? '#10b981' : '#f43f5e'

                    const midX = (fromNode.x + toNode.x) / 2
                    const midY = (fromNode.y + toNode.y) / 2

                    return (
                      <g key={idx}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={isDashed ? '#71717a' : strokeColor}
                          strokeWidth="1.5"
                          strokeDasharray={isDashed ? '3,3' : 'none'}
                          markerEnd={isDashed ? 'url(#arrow-dash)' : 'url(#arrow-green)'}
                        />
                        <rect
                          x={midX - 24}
                          y={midY - 7}
                          width="48"
                          height="14"
                          fill="#09090b"
                          rx="3"
                          stroke="#27272a"
                          strokeWidth="0.8"
                        />
                        <text
                          x={midX}
                          y={midY + 3}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )
                  })}

                  {/* Interactive Nodes */}
                  {graphNodes.map((node) => {
                    const isSelected = selectedGraphNodeId === node.id
                    const isImpacted = node.status === 'impacted'
                    const strokeColor = isSelected ? '#38bdf8' : isImpacted ? '#f43f5e' : '#10b981'
                    const fillColor = isSelected ? '#082f49' : '#121214'

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x - 45}, ${node.y - 18})`}
                        onClick={() => {
                          setSelectedGraphNodeId(node.id)
                          setInspectedResource({
                            name: node.label,
                            kind: node.kind,
                            namespace: 'keda',
                            cluster: selectedCluster.name,
                            impact: isImpacted ? 'Directly impacted by certificate validation change' : 'Connected dependency'
                          })
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          width="90"
                          height="36"
                          rx="6"
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '2' : '1.2'}
                          filter={isSelected ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))' : undefined}
                        />
                        <text
                          x="45"
                          y="15"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="monospace"
                        >
                          {node.label}
                        </text>
                        <text
                          x="45"
                          y="27"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {`keda · ${node.kind}`}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Legend matching reference image */}
              <div className="mobile-graph-legend">
                <span className="legend-item">
                  <span className="legend-box box-selected" />
                  <span className="mono">Selected</span>
                </span>
                <span className="legend-item">
                  <span className="legend-box box-impacted" />
                  <span className="mono">Impacted</span>
                </span>
                <span className="legend-item">
                  <span className="legend-box box-connected" />
                  <span className="mono">Connected</span>
                </span>
                <span className="legend-item">
                  <span className="legend-line" />
                  <span className="mono">Lifecycle (OWNS)</span>
                </span>
              </div>
            </div>

            {/* RESULTS TABS (matching reference image) */}
            <div className="mobile-results-tab-bar">
              <button
                type="button"
                className={`mobile-tab-btn ${activeAnalysisTab === 'impacted' ? 'active' : ''}`}
                onClick={() => setActiveAnalysisTab('impacted')}
              >
                Impacted (12)
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${activeAnalysisTab === 'paths' ? 'active' : ''}`}
                onClick={() => setActiveAnalysisTab('paths')}
              >
                Paths (8)
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${activeAnalysisTab === 'evidence' ? 'active' : ''}`}
                onClick={() => setActiveAnalysisTab('evidence')}
              >
                Evidence (4)
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${activeAnalysisTab === 'assumptions' ? 'active' : ''}`}
                onClick={() => setActiveAnalysisTab('assumptions')}
              >
                Assumptions (2)
              </button>
            </div>

            {/* TAB CONTENT: STACKED RESOURCE CARDS */}
            <div className="mobile-tab-cards-container">
              {activeAnalysisTab === 'impacted' && (
                <div className="mobile-impacted-cards-list">
                  {scenario.affectedServices.map((svc, idx) => {
                    const cardId = `card-${idx}`
                    const isExpanded = !!expandedCards[cardId]

                    return (
                      <div key={svc.id} className="mobile-resource-card panel">
                        <div className="card-top-row">
                          <div className="flex items-center gap-2">
                            <Box size={14} className="text-muted" />
                            <span className="card-resource-title font-semibold text-white mono">
                              {svc.name}
                            </span>
                          </div>
                          <span className={`badge mono text-xs ${svc.risk === 'HIGH' ? 'badge-risk' : svc.risk === 'MEDIUM' ? 'badge-warning' : 'badge-neutral'}`}>
                            {svc.risk} RISK
                          </span>
                        </div>

                        <div className="card-meta-line mono text-muted text-xs">
                          {svc.component} · {svc.dependencyType}
                        </div>

                        <p className="card-failure-reason text-xs">
                          {svc.impactReason}
                        </p>

                        {/* Accordion Trigger */}
                        <button
                          type="button"
                          className="card-accordion-toggle mono text-xs"
                          onClick={() => toggleCardAccordion(cardId)}
                        >
                          <span>{isExpanded ? 'Hide Technical Evidence' : 'View Evidence & Dependency Path'}</span>
                          <ChevronDown size={14} className={`accordion-icon ${isExpanded ? 'rotated' : ''}`} />
                        </button>

                        {/* Expandable Technical Details */}
                        {isExpanded && (
                          <div className="card-expanded-body">
                            <div className="expanded-field">
                              <span className="field-label mono">FAILURE MODE</span>
                              <span className="field-val text-warning text-xs">{svc.failureMode}</span>
                            </div>

                            <div className="expanded-field">
                              <span className="field-label mono">AFFECTED ENDPOINTS / HOOKS</span>
                              <div className="field-pills-row">
                                {svc.affectedEndpoints.map(ep => (
                                  <span key={ep} className="pill-code mono text-xs">{ep}</span>
                                ))}
                              </div>
                            </div>

                            <div className="expanded-field">
                              <span className="field-label mono">ESTIMATED DEPENDENT CALLERS</span>
                              <span className="field-val text-white mono text-xs">{svc.dependentCallers.toLocaleString()} req/min</span>
                            </div>

                            <div className="card-action-bar">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary mono text-xs"
                                onClick={() => {
                                  setSelectedGraphNodeId('keda-webhook')
                                  setInspectedResource(svc)
                                }}
                              >
                                Inspect Topology →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {activeAnalysisTab === 'paths' && (
                <div className="mobile-paths-list">
                  <div className="mobile-path-card panel">
                    <div className="path-card-header">
                      <span className="badge badge-risk mono text-xs">CRITICAL PATH (HOP 1)</span>
                      <span className="mono text-xs text-muted">Latency +42ms</span>
                    </div>
                    <div className="path-route-flow mono text-xs">
                      <span className="text-white">keda-webhook</span>
                      <span className="text-muted"> → </span>
                      <span className="text-risk">keda-admission (pod)</span>
                      <span className="text-muted"> → </span>
                      <span className="text-warning">kube-apiserver webhook</span>
                    </div>
                    <div className="path-desc text-xs text-muted">
                      Admission webhook timeout blocks pod provisioning across the cluster if certificates fail to revalidate.
                    </div>
                  </div>

                  <div className="mobile-path-card panel">
                    <div className="path-card-header">
                      <span className="badge badge-warning mono text-xs">PROPAGATION PATH (HOP 2)</span>
                      <span className="mono text-xs text-muted">Timeout: 5s</span>
                    </div>
                    <div className="path-route-flow mono text-xs">
                      <span className="text-white">keda-admission</span>
                      <span className="text-muted"> → </span>
                      <span className="text-white">kedaorg-certs</span>
                      <span className="text-muted"> → </span>
                      <span className="text-muted">cert-manager-controller</span>
                    </div>
                    <div className="path-desc text-xs text-muted">
                      Mounted secrets are invalidated when controller secret version rotates without TLS reload signal.
                    </div>
                  </div>
                </div>
              )}

              {activeAnalysisTab === 'evidence' && (
                <div className="mobile-evidence-list">
                  <div className="evidence-item panel">
                    <div className="evidence-header mono text-xs text-white">
                      [1] AST Manifest Static Analysis
                    </div>
                    <pre className="evidence-code-block mono text-xs">
{`--- spec.containers[0].args
- --tls-cert-file=/certs/tls.crt
+ --tls-cert-file=/certs/v2/tls.crt
! Warning: volumeMount mountPath mismatch`}
                    </pre>
                  </div>

                  <div className="evidence-item panel">
                    <div className="evidence-header mono text-xs text-white">
                      [2] Kubernetes RBAC ClusterRoleBinding
                    </div>
                    <pre className="evidence-code-block mono text-xs">
{`RoleRef: ClusterRole/keda-operator
Missing permission: admissionregistration.k8s.io/v1`}
                    </pre>
                  </div>
                </div>
              )}

              {activeAnalysisTab === 'assumptions' && (
                <div className="mobile-assumptions-list">
                  <div className="assumption-card panel">
                    <span className="mono text-xs text-white font-medium">Cluster API Compatibility</span>
                    <p className="text-xs text-muted">
                      Target cluster is running Kubernetes v1.28.4. ValidatingWebhookConfiguration conforms to admissionregistration.k8s.io/v1.
                    </p>
                  </div>
                  <div className="assumption-card panel">
                    <span className="mono text-xs text-white font-medium">Network Policy Isolation</span>
                    <p className="text-xs text-muted">
                      Assumes default ingress policy allows control plane traffic on port 9443 to pod IP endpoints.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: RESOURCES VIEW                                   */}
        {/* ======================================================== */}
        {activeView === 'resources' && (
          <div className="mobile-resources-screen">
            <div className="mobile-section-title-bar">
              <h2 className="mobile-screen-heading">Cluster Resources</h2>
              <span className="mono text-muted text-xs">{scenario.affectedServices.length} registered</span>
            </div>

            {/* Search Input */}
            <div className="mobile-search-box">
              <Search size={14} className="text-muted" />
              <input
                type="text"
                className="mobile-search-input mono"
                placeholder="Search services, pods, databases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="mobile-filter-strip">
              {(['all', 'critical', 'pods', 'services'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  className={`mobile-filter-btn mono ${resourceFilter === f ? 'active' : ''}`}
                  onClick={() => setResourceFilter(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Stacked Resource Cards */}
            <div className="mobile-resource-cards-deck">
              {scenario.affectedServices
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(svc => (
                  <div key={svc.id} className="mobile-resource-row-card panel">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server size={14} className="text-muted" />
                        <span className="font-semibold text-white mono text-xs">{svc.name}</span>
                      </div>
                      <span className={`badge mono text-xs ${svc.risk === 'HIGH' ? 'badge-risk' : 'badge-warning'}`}>
                        {svc.risk} RISK
                      </span>
                    </div>

                    <div className="mono text-muted text-xs mt-1">
                      {svc.component} · {svc.dependentCallers} req/min
                    </div>

                    <div className="mobile-card-actions-row">
                      <button
                        type="button"
                        className="mobile-card-action-btn primary mono text-xs"
                        onClick={() => {
                          setStructuredResource(svc.name)
                          handleNavigate('investigate')
                        }}
                      >
                        Investigate Resource →
                      </button>
                      <button
                        type="button"
                        className="mobile-card-action-btn secondary mono text-xs"
                        onClick={() => setInspectedResource(svc)}
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: DEPENDENCIES VIEW                                */}
        {/* ======================================================== */}
        {activeView === 'dependencies' && (
          <div className="mobile-dependencies-screen">
            <div className="mobile-section-title-bar">
              <h2 className="mobile-screen-heading">Infrastructure Graph</h2>
              <div className="mobile-view-toggle mono text-xs">
                <button
                  type="button"
                  className={`toggle-btn ${dependencyFormat === 'graph' ? 'active' : ''}`}
                  onClick={() => setDependencyFormat('graph')}
                >
                  Canvas
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${dependencyFormat === 'list' ? 'active' : ''}`}
                  onClick={() => setDependencyFormat('list')}
                >
                  List
                </button>
              </div>
            </div>

            {dependencyFormat === 'graph' ? (
              <div className="mobile-topology-container panel">
                <div className="topology-hint mono text-muted text-xs">
                  Tap any node to trace caller & downstream dependencies
                </div>
                <div className="mobile-graph-canvas-wrap">
                  <svg className="mobile-graph-svg" viewBox="0 0 360 270">
                    {/* SVG Content identical to graph */}
                    {graphEdges.map((edge, idx) => {
                      const fromNode = graphNodes.find(n => n.id === edge.from)
                      const toNode = graphNodes.find(n => n.id === edge.to)
                      if (!fromNode || !toNode) return null
                      return (
                        <line
                          key={idx}
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="2,2"
                        />
                      )
                    })}
                    {graphNodes.map(node => (
                      <g
                        key={node.id}
                        transform={`translate(${node.x - 40}, ${node.y - 15})`}
                        onClick={() => setInspectedResource({
                          name: node.label,
                          kind: node.kind,
                          namespace: 'keda',
                          cluster: selectedCluster.name,
                          impact: 'Direct relationship node'
                        })}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect width="80" height="30" rx="4" fill="#18181b" stroke="#38bdf8" strokeWidth="1" />
                        <text x="40" y="18" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="monospace">
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="mobile-dependency-list panel">
                {graphEdges.map((e, idx) => (
                  <div key={idx} className="dep-list-row mono text-xs">
                    <span className="text-white font-medium">{e.from}</span>
                    <span className="badge badge-neutral text-xs">{e.label}</span>
                    <span className="text-muted">{e.to}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: SYSTEM HEALTH                                    */}
        {/* ======================================================== */}
        {activeView === 'health' && (
          <div className="mobile-health-screen">
            <div className="mobile-section-title-bar">
              <h2 className="mobile-screen-heading">System Diagnostics</h2>
              <span className="badge badge-healthy mono text-xs">ALL SYSTEMS NOMINAL</span>
            </div>

            {/* 4 Stacked Component Cards */}
            <div className="mobile-health-cards-stack">
              <div className="mobile-health-card panel">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white mono text-xs">Kubernetes API Server</span>
                  <span className="badge badge-healthy mono text-xs">Healthy</span>
                </div>
                <div className="mono text-muted text-xs mt-1">v1.28.4 · 18ms latency · 0 API errors</div>
              </div>

              <div className="mobile-health-card panel">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white mono text-xs">Graph Engine (WhatBreaks Core)</span>
                  <span className="badge badge-healthy mono text-xs">Healthy</span>
                </div>
                <div className="mono text-muted text-xs mt-1">Evaluated 7 nodes · 42ms AST latency</div>
              </div>

              <div className="mobile-health-card panel">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white mono text-xs">AST Parser & Linters</span>
                  <span className="badge badge-healthy mono text-xs">Synced</span>
                </div>
                <div className="mono text-muted text-xs mt-1">Helm v3 / Kustomize / Envoy specs ready</div>
              </div>

              <div className="mobile-health-card panel">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white mono text-xs">Active Cluster Warnings</span>
                  <span className="badge badge-warning mono text-xs">2 Non-Fatal</span>
                </div>
                <div className="mono text-muted text-xs mt-1">Deprecated API ingress.class annotations</div>
              </div>
            </div>

            {/* Diagnostic Action Button */}
            <button
              type="button"
              className="mobile-diagnostics-action-btn"
              onClick={() => {
                setDiagnosticRunning(true)
                setTimeout(() => {
                  setDiagnosticRunning(false)
                  setDiagnosticLogsOpen(true)
                }, 800)
              }}
              disabled={diagnosticRunning}
            >
              {diagnosticRunning ? 'Running Cluster Healthchecks...' : 'Run Diagnostics Healthcheck'}
            </button>

            {/* Collapsible Console Logs */}
            {diagnosticLogsOpen && (
              <div className="mobile-diagnostic-logs-panel panel">
                <div className="logs-header mono text-xs text-muted flex justify-between">
                  <span>DIAGNOSTIC RUN OUTPUT</span>
                  <button type="button" onClick={() => setDiagnosticLogsOpen(false)}>Close</button>
                </div>
                <pre className="diagnostic-log-body mono text-xs">
{`[22:21:04] INFO  k8s.client: authenticated with prod-us-east-1
[22:21:05] INFO  ast.evaluator: parsing 184 resources
[22:21:05] OK    dependency graph constructed (12 edges)
[22:21:06] OK    0 critical cluster anomalies detected`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 6: BLAST RADIUS                                     */}
        {/* ======================================================== */}
        {activeView === 'blast-radius' && (
          <div className="mobile-blast-screen">
            <div className="mobile-section-title-bar">
              <h2 className="mobile-screen-heading">Blast Radius Map</h2>
              <span className="badge badge-risk mono text-xs">3 HOPS AFFECTED</span>
            </div>

            <div className="mobile-blast-card panel">
              <div className="blast-level-row">
                <span className="badge badge-risk mono text-xs">DIRECT IMPACT (1 HOP)</span>
                <span className="mono text-white text-xs">keda-admission (pod)</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Direct caller receiving authentication errors on API invocation.
              </p>
            </div>

            <div className="mobile-blast-card panel">
              <div className="blast-level-row">
                <span className="badge badge-warning mono text-xs">DOWNSTREAM IMPACT (2 HOPS)</span>
                <span className="mono text-white text-xs">keda-admission (service)</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Cascading connection exhaustion under webhook retry loop.
              </p>
            </div>

            <div className="mobile-blast-card panel">
              <div className="blast-level-row">
                <span className="badge badge-neutral mono text-xs">PERIPHERAL IMPACT (3 HOPS)</span>
                <span className="mono text-white text-xs">kube-root-ca.crt</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Trust chain re-establishment required after cluster rotation.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 7: INTEGRATIONS                                     */}
        {/* ======================================================== */}
        {activeView === 'integrations' && (
          <div className="mobile-integrations-screen">
            <h2 className="mobile-screen-heading">Connected Platforms</h2>
            <div className="mobile-integration-cards">
              <div className="integration-card panel flex items-center justify-between">
                <div>
                  <div className="mono font-semibold text-white text-xs">Kubernetes Core</div>
                  <div className="mono text-muted text-xs">Connected (v1.28.4)</div>
                </div>
                <CheckCircle2 size={16} className="text-healthy" />
              </div>
              <div className="integration-card panel flex items-center justify-between">
                <div>
                  <div className="mono font-semibold text-white text-xs">AWS IAM & RDS</div>
                  <div className="mono text-muted text-xs">Role ARN Synced</div>
                </div>
                <CheckCircle2 size={16} className="text-healthy" />
              </div>
              <div className="integration-card panel flex items-center justify-between">
                <div>
                  <div className="mono font-semibold text-white text-xs">ArgoCD GitOps</div>
                  <div className="mono text-muted text-xs">Syncing manifests</div>
                </div>
                <CheckCircle2 size={16} className="text-healthy" />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 8: SETTINGS                                         */}
        {/* ======================================================== */}
        {activeView === 'settings' && (
          <div className="mobile-settings-screen">
            <h2 className="mobile-screen-heading">Workspace Settings</h2>
            <div className="mobile-settings-list panel">
              <div className="setting-row">
                <span className="mono text-xs text-white">Default Analysis Engine</span>
                <span className="badge badge-neutral mono text-xs">AST v1 (Strict)</span>
              </div>
              <div className="setting-row">
                <span className="mono text-xs text-white">Failure Threshold</span>
                <span className="badge badge-risk mono text-xs">Block on High Risk</span>
              </div>
              <div className="setting-row">
                <span className="mono text-xs text-white">Cluster Scope</span>
                <span className="mono text-xs text-muted">Multi-Cluster Allowed</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION BAR (matching reference image) */}
      <nav className="mobile-bottom-nav-bar" aria-label="Mobile Bottom Navigation">
        {/* Tab 1: Investigate */}
        <button
          type="button"
          className={`mobile-bottom-tab ${activeView === 'investigate' ? 'active' : ''}`}
          onClick={() => handleNavigate('investigate')}
        >
          <div className="tab-indicator" />
          <Sliders size={18} className="tab-icon" />
          <span className="tab-label">Investigate</span>
        </button>

        {/* Tab 2: Resources */}
        <button
          type="button"
          className={`mobile-bottom-tab ${activeView === 'resources' ? 'active' : ''}`}
          onClick={() => handleNavigate('resources')}
        >
          <div className="tab-indicator" />
          <Server size={18} className="tab-icon" />
          <span className="tab-label">Resources</span>
        </button>

        {/* Tab 3: Graph */}
        <button
          type="button"
          className={`mobile-bottom-tab ${activeView === 'dependencies' || activeView === 'impact-analysis' ? 'active' : ''}`}
          onClick={() => handleNavigate('impact-analysis')}
        >
          <div className="tab-indicator" />
          <Network size={18} className="tab-icon" />
          <span className="tab-label">Graph</span>
        </button>

        {/* Tab 4: Health */}
        <button
          type="button"
          className={`mobile-bottom-tab ${activeView === 'health' ? 'active' : ''}`}
          onClick={() => handleNavigate('health')}
        >
          <div className="tab-indicator" />
          <Activity size={18} className="tab-icon" />
          <span className="tab-label">Health</span>
        </button>
      </nav>

      {/* 4. SLIDE-IN NAVIGATION DRAWER (Screen 3 in Reference Image) */}
      {/* POSITIONED ABSOLUTE RELATIVE TO MOBILE-APP-ROOT (NEVER ESCAPES PHONE!) */}
      {isDrawerOpen && (
        <>
          {/* Backdrop inside phone screen */}
          <div
            className="mobile-drawer-local-backdrop"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body inside phone screen */}
          <div className="mobile-drawer-local-panel" role="dialog" aria-modal="true">
            {/* Drawer Top Header */}
            <div className="mobile-drawer-local-header">
              <div className="mobile-app-brand">
                <div className="mobile-app-wb-badge mono">WB</div>
                <span className="mobile-app-brand-name mono">WHATBREAKS</span>
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Workspace & Cluster in Drawer */}
            <div className="mobile-drawer-cluster-section">
              <div className="mobile-section-label mono">WORKSPACE & CLUSTER</div>
              <div
                className="mobile-drawer-cluster-card"
                onClick={() => setIsClusterDropdownOpen(!isClusterDropdownOpen)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-white text-xs font-semibold">{selectedCluster.name}</span>
                  <ChevronDown size={14} className="text-muted" />
                </div>
                <div className="mobile-scope-status-line">
                  <span className="dot dot-healthy" />
                  <span className="mobile-scope-status-text mono">
                    Cluster Synced · {selectedCluster.resources} resources · {selectedCluster.syncTime}
                  </span>
                </div>
              </div>

              {isClusterDropdownOpen && (
                <div className="mobile-drawer-cluster-dropdown">
                  {CLUSTERS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`cluster-item mono text-xs ${c.id === selectedClusterId ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedClusterId(c.id)
                        setIsClusterDropdownOpen(false)
                      }}
                    >
                      <span>{c.name}</span>
                      <span className="text-muted">{c.resources} res</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Navigation List matching Reference Image Screen 3 */}
            <div className="mobile-drawer-nav-list">
              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'investigate' ? 'active' : ''}`}
                onClick={() => handleNavigate('investigate')}
              >
                <div className="nav-btn-icon"><Sliders size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Investigate</span>
                  <span className="nav-btn-desc">Analyze proposed changes</span>
                </div>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'impact-analysis' ? 'active' : ''}`}
                onClick={() => handleNavigate('impact-analysis')}
              >
                <div className="nav-btn-icon"><Layers size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Changes</span>
                  <span className="nav-btn-desc">Active evaluations & diffs</span>
                </div>
                <span className="drawer-badge mono">3</span>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'resources' ? 'active' : ''}`}
                onClick={() => handleNavigate('resources')}
              >
                <div className="nav-btn-icon"><Server size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Resources</span>
                  <span className="nav-btn-desc">Service catalog & failure modes</span>
                </div>
                <span className="drawer-badge mono">3</span>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'dependencies' ? 'active' : ''}`}
                onClick={() => handleNavigate('dependencies')}
              >
                <div className="nav-btn-icon"><Network size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Dependencies</span>
                  <span className="nav-btn-desc">Infrastructure topology graph</span>
                </div>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'blast-radius' ? 'active' : ''}`}
                onClick={() => handleNavigate('blast-radius')}
              >
                <div className="nav-btn-icon"><Layers size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Blast Radius</span>
                  <span className="nav-btn-desc">Multi-hop propagation distance</span>
                </div>
              </button>

              {/* PLATFORM SECTION */}
              <div className="drawer-section-title mono">PLATFORM</div>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'health' ? 'active' : ''}`}
                onClick={() => handleNavigate('health')}
              >
                <div className="nav-btn-icon"><Terminal size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">System Health</span>
                  <span className="nav-btn-desc">Cluster diagnostics & reports</span>
                </div>
                <span className="drawer-badge mono">4</span>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'integrations' ? 'active' : ''}`}
                onClick={() => handleNavigate('integrations')}
              >
                <div className="nav-btn-icon"><ExternalLink size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Integrations</span>
                  <span className="nav-btn-desc">Kubernetes, AWS, Envoy & ArgoCD</span>
                </div>
                <span className="drawer-badge badge-green mono">v1</span>
              </button>

              <button
                type="button"
                className={`drawer-nav-btn ${activeView === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavigate('settings')}
              >
                <div className="nav-btn-icon"><Settings size={16} /></div>
                <div className="nav-btn-texts">
                  <span className="nav-btn-title">Settings</span>
                  <span className="nav-btn-desc">Preferences & configuration</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 5. SLIDE-UP BOTTOM SHEET FOR RESOURCE INSPECTION */}
      {/* POSITIONED ABSOLUTE RELATIVE TO MOBILE-APP-ROOT (NEVER ESCAPES PHONE!) */}
      {inspectedResource && (
        <>
          <div
            className="mobile-sheet-backdrop"
            onClick={() => setInspectedResource(null)}
            aria-hidden="true"
          />
          <div className="mobile-sheet-panel panel" role="dialog" aria-modal="true">
            <div className="mobile-sheet-drag-handle" />
            <div className="mobile-sheet-header">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-white" />
                <span className="mono font-semibold text-white text-sm">
                  {inspectedResource.name}
                </span>
              </div>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={() => setInspectedResource(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mobile-sheet-content">
              <div className="sheet-row">
                <span className="mono text-muted text-xs">KIND & NAMESPACE</span>
                <span className="mono text-white text-xs">{inspectedResource.kind} · keda</span>
              </div>
              <div className="sheet-row">
                <span className="mono text-muted text-xs">CLUSTER CONTEXT</span>
                <span className="mono text-white text-xs">{selectedCluster.name}</span>
              </div>
              <div className="sheet-row">
                <span className="mono text-muted text-xs">ANALYSIS IMPACT</span>
                <span className="mono text-warning text-xs">{inspectedResource.impact || 'Service mapped in topology'}</span>
              </div>

              <div className="sheet-action-btns">
                <button
                  type="button"
                  className="btn btn-primary mono text-xs w-full"
                  onClick={() => {
                    setStructuredResource(inspectedResource.name)
                    setInspectedResource(null)
                    handleNavigate('investigate')
                  }}
                >
                  Analyze Impact of Change on {inspectedResource.name} →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
