import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  FileCode,
  GitBranch,
  GitFork,
  Info,
  Layers,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap
} from 'lucide-react'
import {
  SCENARIOS,
  generateScenarioRiskExplanation,
  getScenarioRiskFactors
} from '../../mockData'

interface ChangesViewProps {
  selectedScenarioKey: string
  onSelectScenario: (scenarioKey: string) => void
  onNavigateToGraph: () => void
  onNavigateToServices: () => void
}

type ChangeTab = 'overview' | 'impact' | 'services' | 'conflicts' | 'recommendations'

export const ChangesView: React.FC<ChangesViewProps> = ({
  selectedScenarioKey,
  onSelectScenario,
  onNavigateToGraph,
  onNavigateToServices
}) => {
  const [activeTab, setActiveTab] = useState<ChangeTab>('overview')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simulationStep, setSimulationStep] = useState<number>(0)
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Simulation form inputs
  const [simResource, setSimResource] = useState<'postgresql' | 'redis' | 'envoy'>('postgresql')
  const [simFromVersion, setSimFromVersion] = useState('15.4')
  const [simToVersion, setSimToVersion] = useState('16.1')

  const scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['pg-15-16']

  const changesList = [
    {
      id: 'pg-15-16',
      name: 'PostgreSQL 15.4 → 16.1',
      resource: 'Aurora RDS Cluster',
      status: 'Analyzed',
      risk: 'HIGH',
      badgeClass: 'badge-risk',
      dotClass: 'dot-risk',
      affected: '3 services · 2 conflicts',
      created: '2 min ago',
      pr: 'PR #412'
    },
    {
      id: 'redis-6-7',
      name: 'Redis 6.2 → 7.2',
      resource: 'ElastiCache Session Store',
      status: 'Analyzed',
      risk: 'MEDIUM',
      badgeClass: 'badge-warning',
      dotClass: 'dot-warning',
      affected: '2 services · 1 conflict',
      created: '14 min ago',
      pr: 'PR #409'
    },
    {
      id: 'envoy-minor',
      name: 'API Gateway 1.27 → 1.28',
      resource: 'Envoy Edge Ingress',
      status: 'Analyzed',
      risk: 'LOW',
      badgeClass: 'badge-healthy',
      dotClass: 'dot-healthy',
      affected: '1 service · 0 conflicts',
      created: '1 hr ago',
      pr: 'PR #406'
    },
    {
      id: 'ingress-patch',
      name: 'Ingress NGINX 1.12 → 1.13',
      resource: 'k8s/networking.k8s.io',
      status: 'Analyzed',
      risk: 'LOW',
      badgeClass: 'badge-healthy',
      dotClass: 'dot-healthy',
      affected: '1 service · 0 conflicts',
      created: '3 hrs ago',
      pr: 'PR #401'
    }
  ]

  const runSimulation = () => {
    setIsSimulating(true)
    setSimulationStep(1)

    setTimeout(() => setSimulationStep(2), 600)
    setTimeout(() => setSimulationStep(3), 1200)
    setTimeout(() => setSimulationStep(4), 1800)
    setTimeout(() => {
      setSimulationStep(5)
      setTimeout(() => {
        setIsSimulating(false)
        setShowSimulateModal(false)
        if (simResource === 'postgresql') onSelectScenario('pg-15-16')
        else if (simResource === 'redis') onSelectScenario('redis-6-7')
        else onSelectScenario('envoy-minor')
      }, 700)
    }, 2400)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  return (
    <div className="dash-changes-workspace">
      {/* Top Header */}
      <div className="dash-workspace-header">
        <div>
          <h2 className="dash-view-title">Change analysis</h2>
          <p className="dash-view-sub">
            Review proposed infrastructure modifications, trace dependent services, and examine automated remediation steps.
          </p>
        </div>
        <div className="dash-workspace-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowSimulateModal(true)}
          >
            <Zap size={14} />
            <span>+ Analyze a change</span>
          </button>
        </div>
      </div>

      {/* Change Selection Bar */}
      <div className="dash-scenario-bar">
        <span className="mono text-muted" style={{ fontSize: '11px' }}>SELECT CHANGE TO INSPECT:</span>
        <div className="dash-scenario-pill-list">
          {changesList.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dash-scenario-btn ${selectedScenarioKey === item.id ? 'dash-scenario-btn-active' : ''}`}
              onClick={() => onSelectScenario(item.id)}
            >
              <span className={`dot ${item.dotClass}`} />
              <span>{item.name}</span>
              <span className={`badge ${item.badgeClass} mono`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                {item.risk}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dedicated Change Analysis Detail Frame */}
      <div className="dash-change-detail-container">
        {/* Banner with Target Resource and Risk Badge */}
        <div className="change-detail-banner">
          <div className="banner-left">
            <div className="banner-tag mono text-muted">
              TARGET CLUSTER: prod-us-east-1 · REPOSITORY: infra-terraform
            </div>
            <h3 className="banner-title">
              {scenario.resource}: {scenario.currentVersion} → {scenario.proposedVersion}
            </h3>
          </div>

          <div className="banner-right">
            <span
              className={`badge ${
                scenario.riskLevel === 'HIGH RISK'
                  ? 'badge-risk'
                  : scenario.riskLevel === 'MEDIUM RISK'
                  ? 'badge-warning'
                  : 'badge-healthy'
              }`}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <span
                className={`dot ${
                  scenario.riskLevel === 'HIGH RISK'
                    ? 'dot-risk'
                    : scenario.riskLevel === 'MEDIUM RISK'
                    ? 'dot-warning'
                    : 'dot-healthy'
                }`}
              />
              {scenario.riskLevel}
            </span>
          </div>
        </div>

        {/* 4 Summary KPI Tiles */}
        <div className="change-summary-kpis">
          <div className="kpi-metric-box">
            <div className="metric-val mono">{scenario.summary.affectedServices}</div>
            <div className="metric-lbl">affected services</div>
          </div>
          <div className="kpi-metric-box">
            <div className="metric-val mono">{scenario.summary.configConflicts}</div>
            <div className="metric-lbl">configuration conflicts</div>
          </div>
          <div className="kpi-metric-box">
            <div className="metric-val mono">{scenario.summary.highRiskPaths}</div>
            <div className="metric-lbl">high-risk path</div>
          </div>
          <div className="kpi-metric-box">
            <div className="metric-val mono">{scenario.summary.totalDependencies}</div>
            <div className="metric-lbl">total dependencies</div>
          </div>
        </div>

        {/* 5 Distinct Functional Tabs */}
        <div className="change-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`change-tab-btn ${activeTab === 'overview' ? 'change-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Layers size={14} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'impact'}
            className={`change-tab-btn ${activeTab === 'impact' ? 'change-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('impact')}
          >
            <GitBranch size={14} />
            <span>Impact Tree</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'services'}
            className={`change-tab-btn ${activeTab === 'services' ? 'change-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Server size={14} />
            <span>Affected Services ({scenario.affectedServices.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'conflicts'}
            className={`change-tab-btn ${activeTab === 'conflicts' ? 'change-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
          >
            <AlertTriangle size={14} />
            <span>Conflicts ({scenario.configConflicts.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recommendations'}
            className={`change-tab-btn ${activeTab === 'recommendations' ? 'change-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <CheckCircle2 size={14} />
            <span>Recommendations ({scenario.recommendations.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="change-tab-pane">
            <div className="overview-summary-strip panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
              <div className="change-summary-grid">
                <div>
                  <span className="mono text-xs text-muted">CHANGE</span>
                  <div className="font-semibold text-white" style={{ marginTop: 2 }}>
                    {scenario.resource} {scenario.currentVersion} → {scenario.proposedVersion}
                  </div>
                </div>
                <div>
                  <span className="mono text-xs text-muted">RISK</span>
                  <div style={{ marginTop: 2 }}>
                    <span className={`badge ${scenario.riskLevel.includes('HIGH') ? 'badge-risk' : scenario.riskLevel.includes('MEDIUM') ? 'badge-warning' : 'badge-healthy'} mono text-xs`}>
                      <span className={`dot ${scenario.riskLevel.includes('HIGH') ? 'dot-risk' : scenario.riskLevel.includes('MEDIUM') ? 'dot-warning' : 'dot-healthy'}`} />
                      {scenario.riskLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="mono text-xs text-muted">BLAST RADIUS</span>
                  <div className="font-semibold text-white" style={{ marginTop: 2 }}>
                    {scenario.summary.affectedServices} services
                  </div>
                </div>
                <div>
                  <span className="mono text-xs text-muted">CONFLICTS</span>
                  <div className="font-semibold text-warning" style={{ marginTop: 2 }}>
                    {scenario.summary.configConflicts} detected
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Risk Explanation Derived from Actual Scenario Data */}
            <div
              className="why-risk-card panel"
              style={{
                padding: '18px 20px',
                marginBottom: '20px',
                borderLeft: `4px solid ${
                  scenario.riskLevel.includes('HIGH')
                    ? 'var(--status-risk)'
                    : scenario.riskLevel.includes('MEDIUM')
                    ? 'var(--status-warning)'
                    : 'var(--status-healthy)'
                }`
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-2 font-semibold text-white text-sm">
                  {scenario.riskLevel.includes('HIGH') ? (
                    <ShieldAlert size={16} className="text-risk" />
                  ) : scenario.riskLevel.includes('MEDIUM') ? (
                    <AlertTriangle size={16} className="text-warning" />
                  ) : (
                    <CheckCircle2 size={16} className="text-healthy" />
                  )}
                  <span>WHY THIS IS {scenario.riskLevel}</span>
                </div>
                <span
                  className={`badge mono text-xs ${
                    scenario.riskLevel.includes('HIGH')
                      ? 'badge-risk'
                      : scenario.riskLevel.includes('MEDIUM')
                      ? 'badge-warning'
                      : 'badge-healthy'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {scenario.riskLevel.includes('HIGH')
                    ? 'BREAKING PROTOCOL RISK'
                    : scenario.riskLevel.includes('MEDIUM')
                    ? 'BOUNDED DEGRADATION'
                    : 'CONTAINED & TESTABLE'}
                </span>
              </div>

              {/* 4 Quantitative Scenario Evaluation Factors */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div>
                  <div className="mono text-muted" style={{ fontSize: '10px' }}>1. AFFECTED SERVICES</div>
                  <div className="font-semibold text-white mono text-xs" style={{ marginTop: '2px' }}>
                    {scenario.summary.affectedServices} {scenario.summary.affectedServices === 1 ? 'service' : 'services'}
                  </div>
                </div>
                <div>
                  <div className="mono text-muted" style={{ fontSize: '10px' }}>2. CONFIG CONFLICTS</div>
                  <div
                    className={`font-semibold mono text-xs ${
                      scenario.summary.configConflicts > 0 ? 'text-warning' : 'text-healthy'
                    }`}
                    style={{ marginTop: '2px' }}
                  >
                    {scenario.summary.configConflicts} detected
                  </div>
                </div>
                <div>
                  <div className="mono text-muted" style={{ fontSize: '10px' }}>3. HIGH-RISK PATHS</div>
                  <div
                    className={`font-semibold mono text-xs ${
                      scenario.summary.highRiskPaths > 0 ? 'text-risk' : 'text-healthy'
                    }`}
                    style={{ marginTop: '2px' }}
                  >
                    {scenario.summary.highRiskPaths} critical
                  </div>
                </div>
                <div>
                  <div className="mono text-muted" style={{ fontSize: '10px' }}>4. DEPENDENCY FOOTPRINT</div>
                  <div className="font-semibold text-white mono text-xs" style={{ marginTop: '2px' }}>
                    {scenario.summary.totalDependencies <= 2
                      ? 'Limited'
                      : scenario.summary.totalDependencies <= 5
                      ? 'Moderate'
                      : 'Extensive'}{' '}
                    ({scenario.summary.totalDependencies} {scenario.summary.totalDependencies === 1 ? 'dep' : 'deps'})
                  </div>
                </div>
              </div>

              {/* 5. Qualitative Justification Derived from Actual Scenario Factors */}
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="mono text-muted" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                  5. RISK JUSTIFICATION:
                </span>
                <span className="mono text-xs font-semibold text-white">
                  {getScenarioRiskFactors(scenario).justificationText}
                </span>
              </div>

              {/* Paragraph derived from actual scenario data */}
              <p className="text-secondary text-xs" style={{ lineHeight: 1.6, margin: 0 }}>
                {scenario.whyRiskExplanation || generateScenarioRiskExplanation(scenario)}
              </p>
            </div>

            <div className="top-risks-section">
              <div className="section-title-sm mono" style={{ marginBottom: 10 }}>
                {scenario.riskLevel.includes('LOW')
                  ? 'KEY VERIFICATION & SAFETY FACTORS'
                  : 'TOP RISKS IDENTIFIED'}
              </div>
              <div className="top-risks-grid">
                {scenario.id === 'envoy-minor' ? (
                  <>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">CONTAINED IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Auth Service
                      </h4>
                      <p className="text-muted text-xs">
                        ext_authz filter protobuf header normalization; verified backward-compatible with no routing disruption.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">VERIFIED CLEAN</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Ingress Route Table
                      </h4>
                      <p className="text-muted text-xs">
                        0 route conflicts, path pattern deprecations, or TLS handshake mismatches across edge listeners.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">CANARY CANDIDATE</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Deployment Strategy
                      </h4>
                      <p className="text-muted text-xs">
                        Single canary replica deployment isolates initial traffic validation for a safe, testable rollout.
                      </p>
                    </div>
                  </>
                ) : scenario.id === 'ingress-patch' ? (
                  <>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">CONTAINED IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        API Gateway Ingress
                      </h4>
                      <p className="text-muted text-xs">
                        Ingress annotation schemas, TLS secrets, and upstream routing rules remain backward compatible.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">VERIFIED CLEAN</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Cluster Networking
                      </h4>
                      <p className="text-muted text-xs">
                        0 configuration conflicts detected across active Kubernetes ingress manifests.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">TESTABLE ROLLOUT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        DaemonSet Readiness
                      </h4>
                      <p className="text-muted text-xs">
                        Standard rolling restart candidate with verified controller health probes.
                      </p>
                    </div>
                  </>
                ) : scenario.id === 'redis-6-7' ? (
                  <>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-warning)' }}
                    >
                      <span className="mono text-xs text-warning font-semibold">MEDIUM IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Auth Service
                      </h4>
                      <p className="text-muted text-xs">
                        ioredis session token cache RESP3 protocol negotiation fallback (+45ms query latency to primary DB).
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-warning)' }}
                    >
                      <span className="mono text-xs text-warning font-semibold">CONFIG CONFLICT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Redis ACL Credentials
                      </h4>
                      <p className="text-muted text-xs">
                        Default user permissions require explicit command category grants (+@read +@write).
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-healthy)' }}
                    >
                      <span className="mono text-xs text-healthy font-semibold">LOW IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        API Gateway
                      </h4>
                      <p className="text-muted text-xs">
                        Rate limit filter transient counter bypass for 120s during Redis cluster reboot.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-risk)' }}
                    >
                      <span className="mono text-xs text-risk font-semibold">HIGH IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Auth Service
                      </h4>
                      <p className="text-muted text-xs">
                        Database connection incompatibility under SCRAM-SHA-256 handshake.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-risk)' }}
                    >
                      <span className="mono text-xs text-risk font-semibold">HIGH IMPACT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Billing Service
                      </h4>
                      <p className="text-muted text-xs">
                        Connection pool timeout mismatch under PgBouncer cold initialization.
                      </p>
                    </div>
                    <div
                      className="panel risk-summary-card"
                      style={{ padding: '14px', borderLeft: '3px solid var(--status-warning)' }}
                    >
                      <span className="mono text-xs text-warning font-semibold">CONFIG CONFLICT</span>
                      <h4 className="font-semibold text-white text-sm" style={{ margin: '4px 0' }}>
                        Redis Cache
                      </h4>
                      <p className="text-muted text-xs">
                        Fallback read traffic surge during token verify retry loop.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="overview-action-footer" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onNavigateToGraph}
              >
                <Network size={14} />
                <span>Explore Interactive Topology Graph →</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('recommendations')}
              >
                <CheckCircle2 size={14} />
                <span>View Remediation Actions →</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Impact Tree */}
        {activeTab === 'impact' && (
          <div className="change-tab-pane">
            <div className="impact-tree-view">
              <div className="tree-depth-block">
                <div className="tree-depth-header mono text-muted">DEPTH 0 · ORIGIN OF CHANGE</div>
                <div className="tree-node-item tree-origin">
                  <Database size={15} />
                  <strong>
                    {scenario.resource} ({scenario.proposedVersion})
                  </strong>
                  <span
                    className={`badge ${
                      scenario.riskLevel.includes('HIGH')
                        ? 'badge-risk'
                        : scenario.riskLevel.includes('MEDIUM')
                        ? 'badge-warning'
                        : 'badge-healthy'
                    } mono`}
                    style={{ marginLeft: 'auto' }}
                  >
                    {scenario.riskLevel.includes('HIGH')
                      ? 'CHANGE ROOT'
                      : scenario.riskLevel.includes('MEDIUM')
                      ? 'CHANGE ORIGIN'
                      : 'CONTAINED ROOT'}
                  </span>
                </div>
              </div>

              <div className="tree-connector-arrow">↓ Direct Dependencies (Depth 1)</div>

              <div className="tree-depth-block">
                <div className="tree-depth-header mono text-muted">DEPTH 1 · DIRECT CLIENT POOLS & LINKS</div>
                <div className="tree-nodes-list">
                  {scenario.affectedServices
                    .filter((s) => s.dependencyType === 'Direct dependency')
                    .map((svc) => (
                      <div
                        key={svc.id}
                        className={`tree-node-item ${
                          svc.risk === 'HIGH'
                            ? 'tree-risk'
                            : svc.risk === 'MEDIUM'
                            ? 'tree-warning'
                            : 'tree-healthy'
                        }`}
                      >
                        <Server size={15} />
                        <div>
                          <strong>{svc.name}</strong>
                          <span className="node-detail text-muted">
                            {svc.component} · {svc.impactReason}
                          </span>
                        </div>
                        <span
                          className={`badge ${
                            svc.risk === 'HIGH'
                              ? 'badge-risk'
                              : svc.risk === 'MEDIUM'
                              ? 'badge-warning'
                              : 'badge-healthy'
                          } mono`}
                          style={{ marginLeft: 'auto' }}
                        >
                          {svc.risk} RISK
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="tree-connector-arrow">
                {scenario.affectedServices.some((s) => s.dependencyType === 'Indirect dependency')
                  ? '↓ Downstream Propagation (Depth 2 & 3)'
                  : '— Downstream Propagation Terminated'}
              </div>

              <div className="tree-depth-block">
                <div className="tree-depth-header mono text-muted">
                  DEPTH 2+ · INDIRECT DOWNSTREAM PROPAGATION
                </div>
                <div className="tree-nodes-list">
                  {scenario.affectedServices.filter((s) => s.dependencyType === 'Indirect dependency')
                    .length === 0 ? (
                    <div className="tree-node-item tree-healthy">
                      <CheckCircle2 size={15} className="text-healthy" />
                      <div>
                        <strong>No Indirect Downstream Workloads</strong>
                        <span className="node-detail text-muted">
                          Change footprint terminates at Depth 1 direct integration; 0 multi-hop cascades detected.
                        </span>
                      </div>
                      <span className="badge badge-healthy mono" style={{ marginLeft: 'auto' }}>
                        CONTAINED
                      </span>
                    </div>
                  ) : (
                    scenario.affectedServices
                      .filter((s) => s.dependencyType === 'Indirect dependency')
                      .map((svc) => (
                        <div
                          key={svc.id}
                          className={`tree-node-item ${
                            svc.risk === 'HIGH'
                              ? 'tree-risk'
                              : svc.risk === 'MEDIUM'
                              ? 'tree-warning'
                              : 'tree-healthy'
                          }`}
                        >
                          <Server size={15} />
                          <div>
                            <strong>{svc.name}</strong>
                            <span className="node-detail text-muted">
                              {svc.component} · {svc.impactReason}
                            </span>
                          </div>
                          <span
                            className={`badge ${
                              svc.risk === 'HIGH'
                                ? 'badge-risk'
                                : svc.risk === 'MEDIUM'
                                ? 'badge-warning'
                                : 'badge-healthy'
                            } mono`}
                            style={{ marginLeft: 'auto' }}
                          >
                            {svc.risk} RISK
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Affected Services (Desktop Table + Mobile Responsive Cards) */}
        {activeTab === 'services' && (
          <div className="change-tab-pane">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="dash-table-wrapper desktop-only-table">
              <table className="dash-data-table">
                <thead>
                  <tr>
                    <th>SERVICE</th>
                    <th>RELATION</th>
                    <th>RISK</th>
                    <th>POTENTIAL FAILURE</th>
                    <th>CALLERS</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.affectedServices.map((svc) => (
                    <tr key={svc.id}>
                      <td>
                        <strong>{svc.name}</strong>
                        <span className="mono text-muted" style={{ display: 'block', fontSize: '11px' }}>
                          {svc.component}
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary">{svc.dependencyType}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            svc.risk === 'HIGH' ? 'badge-risk' : svc.risk === 'MEDIUM' ? 'badge-warning' : 'badge-healthy'
                          } mono`}
                        >
                          {svc.risk}
                        </span>
                      </td>
                      <td>
                        <p style={{ maxWidth: '380px', fontSize: '12px', lineHeight: 1.4 }}>
                          {svc.impactReason}
                        </p>
                      </td>
                      <td>
                        <span className="mono">{svc.dependentCallers} rps</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Resource Cards View (Shown on mobile) */}
            <div className="mobile-resource-cards-list">
              {scenario.affectedServices.map((svc) => {
                const isExpanded = !!expandedCards[svc.id]
                return (
                  <div key={svc.id} className="mobile-resource-card panel">
                    {/* Top Row: Service Name, Component, Risk Badge */}
                    <div className="m-card-header">
                      <div>
                        <div className="m-card-title font-semibold text-white">{svc.name}</div>
                        <span className="mono text-muted text-xs">{svc.component}</span>
                      </div>
                      <span
                        className={`badge ${
                          svc.risk === 'HIGH'
                            ? 'badge-risk'
                            : svc.risk === 'MEDIUM'
                            ? 'badge-warning'
                            : 'badge-healthy'
                        } mono text-xs`}
                      >
                        {svc.risk} RISK
                      </span>
                    </div>

                    {/* Metadata Row */}
                    <div className="m-card-meta-row mono text-xs">
                      <span className="text-secondary">{svc.dependencyType}</span>
                      <span className="text-muted">·</span>
                      <span className="text-white">{svc.dependentCallers} rps callers</span>
                    </div>

                    {/* Primary Failure Reason */}
                    <p className="m-card-reason text-secondary text-xs">{svc.impactReason}</p>

                    {/* Expandable Secondary Details Accordion Button */}
                    <button
                      type="button"
                      className="m-card-expand-btn mono text-xs"
                      onClick={() => toggleCardExpand(svc.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-1.5">
                        <Info size={13} className="text-muted" />
                        <span>{isExpanded ? 'Hide Evidence & Call Path' : 'View Evidence, Path & Diagnostics'}</span>
                      </div>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Expanded Content: Evidence, Dependency Path, Assumptions, Diagnostics */}
                    {isExpanded && (
                      <div className="m-card-expanded-content panel">
                        {/* Dependency Path */}
                        <div className="m-expanded-section">
                          <div className="m-section-label mono">
                            <GitFork size={12} />
                            <span>DEPENDENCY PATH</span>
                          </div>
                          <div className="m-path-code mono text-xs">
                            <span className="text-muted">API Gateway</span>
                            <span className="m-path-arrow">→</span>
                            <span className="text-white font-semibold">{svc.name}</span>
                            <span className="m-path-arrow">→</span>
                            <span className="text-risk font-semibold">
                              {scenario.resource} ({scenario.proposedVersion})
                            </span>
                          </div>
                        </div>

                        {/* Evidence */}
                        <div className="m-expanded-section">
                          <div className="m-section-label mono">
                            <FileCode size={12} />
                            <span>EVIDENCE & MANIFEST SPEC</span>
                          </div>
                          <div className="m-evidence-text mono text-xs text-secondary">
                            Client driver specification in {svc.component} references protocol incompatible with target version upgrade.
                          </div>
                        </div>

                        {/* Assumptions & Limitations */}
                        <div className="m-expanded-section">
                          <div className="m-section-label mono">ASSUMPTIONS & LIMITATIONS</div>
                          <div className="text-muted mono text-xs">
                            Traced via Kubernetes manifests & connection pool parameters in prod-us-east-1. Ephemeral connections excluded.
                          </div>
                        </div>

                        {/* Diagnostics */}
                        <div className="m-expanded-section">
                          <div className="m-section-label mono">DIAGNOSTICS</div>
                          <div className="m-diag-badge-row mono text-xs">
                            <span className="badge badge-neutral">AST Check: Validated</span>
                            <span className="badge badge-risk">Protocol: Incompatible</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="services-tab-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary btn-block-mobile"
                onClick={onNavigateToServices}
              >
                <span>Open Dedicated Resources Workspace →</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Conflicts Diff */}
        {activeTab === 'conflicts' && (
          <div className="change-tab-pane">
            {scenario.configConflicts.length === 0 ? (
              <div className="panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
                <CheckCircle2 size={32} className="text-healthy" style={{ margin: '0 auto 12px' }} />
                <h4 className="font-semibold text-white text-sm">No Configuration Conflicts Detected</h4>
                <p className="text-secondary text-xs" style={{ maxWidth: '460px', margin: '6px auto 0', lineHeight: 1.5 }}>
                  All manifest attributes, connection parameters, and client driver specifications are fully compatible with {scenario.resource} {scenario.proposedVersion}. Zero configuration diffs required.
                </p>
              </div>
            ) : (
              <div className="conflicts-stack">
                {scenario.configConflicts.map((conf) => (
                  <div key={conf.id} className="conflict-card-item">
                    <div className="conflict-card-header">
                      <div>
                        <span className={`badge ${conf.severity === 'HIGH' ? 'badge-risk' : 'badge-warning'} mono`}>
                          {conf.severity} SEVERITY
                        </span>
                        <strong style={{ marginLeft: '10px' }}>{conf.title}</strong>
                      </div>
                      <span className="mono text-muted" style={{ fontSize: '11px' }}>{conf.resource}</span>
                    </div>

                    <p className="conflict-card-reason text-secondary">{conf.reason}</p>

                    {conf.diff && (
                      <div className="conflict-diff-container">
                        <div className="diff-titlebar mono text-muted">MANIFEST DIFF</div>
                        <div className="diff-lines mono">
                          <div className="diff-line diff-del">- {conf.diff.current}</div>
                          <div className="diff-line diff-add">+ {conf.diff.required}</div>
                        </div>
                      </div>
                    )}

                    <div className="conflict-card-remedy">
                      <span className="mono text-muted">SUGGESTED RESOLUTION:</span>
                      <p className="text-primary" style={{ fontSize: '13px' }}>{conf.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="change-tab-pane">
            <div className="recs-stack">
              {scenario.recommendations.map((rec) => (
                <div key={rec.step} className="rec-card-item">
                  <div className="rec-top-row">
                    <div className="rec-step-pill mono">ACTION 0{rec.step}</div>
                    <h4 className="rec-title-text">{rec.title}</h4>
                    <span className="badge badge-neutral mono" style={{ marginLeft: 'auto' }}>
                      {rec.status}
                    </span>
                  </div>

                  <p className="rec-desc-text text-secondary">{rec.description}</p>

                  {rec.codeSnippet && (
                    <div className="rec-code-box">
                      <div className="code-box-header">
                        <span className="mono text-muted" style={{ fontSize: '11px' }}>TERMINAL COMMAND</span>
                        <button
                          type="button"
                          className="copy-btn mono"
                          onClick={() => copyToClipboard(rec.codeSnippet || '', rec.step)}
                        >
                          <Copy size={11} />
                          <span>{copiedSnippet === rec.step ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                      <pre className="code-box-pre mono">{rec.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Simulation Modal */}
      {showSimulateModal && (
        <div className="dash-modal-backdrop" role="dialog" aria-modal="true">
          <div className="dash-modal-window">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Simulate an infrastructure change</h3>
                <p className="modal-sub">
                  Test WhatBreaks impact analysis on proposed version and configuration updates
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => { if (!isSimulating) setShowSimulateModal(false) }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {!isSimulating ? (
                <div className="sim-form">
                  <div className="form-field">
                    <label className="form-label mono">TARGET RESOURCE</label>
                    <select
                      className="form-select"
                      value={simResource}
                      onChange={(e) => {
                        const val = e.target.value as 'postgresql' | 'redis' | 'envoy'
                        setSimResource(val)
                        if (val === 'postgresql') {
                          setSimFromVersion('15.4')
                          setSimToVersion('16.1')
                        } else if (val === 'redis') {
                          setSimFromVersion('6.2')
                          setSimToVersion('7.2')
                        } else {
                          setSimFromVersion('1.27')
                          setSimToVersion('1.28')
                        }
                      }}
                    >
                      <option value="postgresql">PostgreSQL (Aurora RDS Primary)</option>
                      <option value="redis">Redis (ElastiCache Session Store)</option>
                      <option value="envoy">API Gateway (Envoy Edge Ingress)</option>
                    </select>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="form-label mono">CURRENT PRODUCTION VERSION</label>
                      <input
                        type="text"
                        className="form-input mono"
                        value={simFromVersion}
                        onChange={(e) => setSimFromVersion(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label mono">PROPOSED TARGET VERSION</label>
                      <input
                        type="text"
                        className="form-input mono"
                        value={simToVersion}
                        onChange={(e) => setSimToVersion(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="sim-form-note mono text-muted">
                    ENGINE: WhatBreaks Graph Analysis Engine (DAG traversal + manifest AST parser)
                  </div>
                </div>
              ) : (
                <div className="sim-progress-box">
                  <div className="sim-progress-step mono">
                    <span className={simulationStep >= 1 ? 'step-done text-healthy' : 'step-wait'}>
                      {simulationStep >= 1 ? '✓' : '○'} STEP 1: Loading infrastructure graph...
                    </span>
                  </div>
                  <div className="sim-progress-step mono">
                    <span className={simulationStep >= 2 ? 'step-done text-healthy' : 'step-wait'}>
                      {simulationStep >= 2 ? '✓' : '○'} STEP 2: Tracing 731 dependency paths...
                    </span>
                  </div>
                  <div className="sim-progress-step mono">
                    <span className={simulationStep >= 3 ? 'step-done text-healthy' : 'step-wait'}>
                      {simulationStep >= 3 ? '✓' : '○'} STEP 3: Checking configurations & protocols...
                    </span>
                  </div>
                  <div className="sim-progress-step mono">
                    <span className={simulationStep >= 4 ? 'step-done text-healthy' : 'step-wait'}>
                      {simulationStep >= 4 ? '✓' : '○'} STEP 4: Calculating blast radius bounds...
                    </span>
                  </div>
                  <div className="sim-progress-step mono">
                    <span className={simulationStep >= 5 ? 'step-done text-healthy' : 'step-wait'}>
                      {simulationStep >= 5 ? '✓' : '○'} STEP 5: Generating remediation actions...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSimulateModal(false)}
                disabled={isSimulating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={runSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Run Impact Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
