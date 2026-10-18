import React, { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileCheck,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Terminal,
  X
} from 'lucide-react'

interface ReportsViewProps {
  onSelectScenario: (scenarioKey: string) => void
  onNavigateToChanges: () => void
}

interface AuditReport {
  id: string
  scenarioKey: string
  title: string
  targetResource: string
  risk: 'HIGH' | 'MEDIUM' | 'LOW'
  badgeClass: string
  dotClass: string
  generatedAt: string
  triggeredBy: string
  affectedServicesCount: number
  dependencyCount: number
  conflictsCount: number
  recommendationsCount: number
  summaryText: string
  servicesList: string[]
  conflictsList: string[]
  recommendationsList: string[]
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onSelectScenario,
  onNavigateToChanges
}) => {
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null)
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null)
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false)
  const [diagnosticPassed, setDiagnosticPassed] = useState<boolean | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const handleRunDiagnostic = () => {
    setIsRunningDiagnostic(true)
    setDiagnosticPassed(null)
    setTimeout(() => {
      setIsRunningDiagnostic(false)
      setDiagnosticPassed(true)
      setTimeout(() => setDiagnosticPassed(null), 4000)
    }, 1500)
  }

  const reports: AuditReport[] = [
    {
      id: 'rep-412',
      scenarioKey: 'pg-15-16',
      title: 'PostgreSQL 15.4 → 16.1 Upgrade Analysis',
      targetResource: 'Aurora RDS Cluster (prod-us-east-1)',
      risk: 'HIGH',
      badgeClass: 'badge-risk',
      dotClass: 'dot-risk',
      generatedAt: 'Oct 8, 2026 · 23:14 UTC',
      triggeredBy: 'alex.sre · GitHub PR #412',
      affectedServicesCount: 3,
      dependencyCount: 7,
      conflictsCount: 2,
      recommendationsCount: 4,
      summaryText:
        'High-risk infrastructure change. SCRAM-SHA-256 client authentication mismatch in Auth Service and PgBouncer connection timeout threshold failure in Billing Service.',
      servicesList: ['Auth Service (Direct)', 'Billing Service (Direct)', 'Worker Service (Indirect)'],
      conflictsList: [
        'Auth Service: pg@8.7.1 lacks SCRAM-SHA-256 channel binding handshake support',
        'Billing Service: connectionTimeoutMillis 5000ms < PG16 cold handshake time 6200ms'
      ],
      recommendationsList: [
        'Upgrade pg client driver to ^8.11.3 in services/auth-service',
        'Increase PgBouncer timeout to 10000ms in helm/values-prod.yaml',
        'Run whatbreaks verify --target postgresql:16.1 --suite integration',
        'Verify database migration scripts with explicit ::timestamptz casts'
      ]
    },
    {
      id: 'rep-409',
      scenarioKey: 'redis-6-7',
      title: 'Redis 6.2 → 7.2 Upgrade Analysis',
      targetResource: 'Session & Rate Limit Cluster',
      risk: 'MEDIUM',
      badgeClass: 'badge-warning',
      dotClass: 'dot-warning',
      generatedAt: 'Oct 8, 2026 · 21:45 UTC',
      triggeredBy: 'sarah.infra · Terraform Apply Plan #409',
      affectedServicesCount: 4,
      dependencyCount: 5,
      conflictsCount: 1,
      recommendationsCount: 2,
      summaryText:
        'Medium risk. Default RESP3 protocol negotiation change in Redis 7.2 causes null response discrepancies in legacy ioredis clients.',
      servicesList: [
        'Auth Service (Direct)',
        'API Gateway Rate Limiter (Direct)',
        'User Session Cache (Direct)',
        'Worker Ingestion (Indirect)'
      ],
      conflictsList: [
        'Auth Service: ioredis@4.28.0 lacks full RESP3 typing fallback support'
      ],
      recommendationsList: [
        'Upgrade ioredis client to ^5.3.2 prior to production cluster upgrade',
        'Audit client reconnect backoff policies under failover conditions'
      ]
    },
    {
      id: 'rep-388',
      scenarioKey: 'envoy-minor',
      title: 'API Gateway 1.27 → 1.28 Envoy Version Bump',
      targetResource: 'Envoy Edge Proxy',
      risk: 'LOW',
      badgeClass: 'badge-healthy',
      dotClass: 'dot-healthy',
      generatedAt: 'Oct 8, 2026 · 18:02 UTC',
      triggeredBy: 'devops-bot · ArgoCD Sync #288',
      affectedServicesCount: 1,
      dependencyCount: 12,
      conflictsCount: 0,
      recommendationsCount: 1,
      summaryText:
        'Low risk. Minor Envoy proxy version bump. Backwards-compatible HTTP/2 pseudo-header sanitization checks passed successfully.',
      servicesList: ['API Gateway Ingress Proxy'],
      conflictsList: [],
      recommendationsList: [
        'Ensure downstream clients emit lowercase normalized headers in staging canary'
      ]
    },
    {
      id: 'rep-310',
      scenarioKey: 'rabbitmq-3-12',
      title: 'RabbitMQ 3.11 → 3.12 AMQP Broker Upgrade',
      targetResource: 'Core Event Broker',
      risk: 'LOW',
      badgeClass: 'badge-healthy',
      dotClass: 'dot-healthy',
      generatedAt: 'Oct 7, 2026 · 14:20 UTC',
      triggeredBy: 'marcus.eng · Helm Release #104',
      affectedServicesCount: 2,
      dependencyCount: 4,
      conflictsCount: 0,
      recommendationsCount: 1,
      summaryText:
        'Low risk. RabbitMQ cluster upgrade verified. Stream queue quorum definitions are compliant across all worker nodes.',
      servicesList: ['Worker Service (Consumer)', 'User Service (Publisher)'],
      conflictsList: [],
      recommendationsList: [
        'Verify Erlang 26 runtime flags during rolling pod restart'
      ]
    }
  ]

  const filteredReports = reports.filter((rep) => {
    const matchesRisk = filterRisk === 'ALL' || rep.risk === filterRisk
    const matchesSearch =
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.targetResource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.triggeredBy.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRisk && matchesSearch
  })

  // Trigger download of report as JSON
  const handleExportJSON = (rep: AuditReport) => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rep, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `whatbreaks-report-${rep.id}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setDownloadSuccessMessage(`Exported report ${rep.id} as JSON`)
    setTimeout(() => setDownloadSuccessMessage(null), 3000)
  }

  // Trigger download of report as CSV
  const handleExportCSV = (rep: AuditReport) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `REPORT_ID,TITLE,TARGET,RISK,AFFECTED_SERVICES,DEPENDENCY_COUNT,CONFLICTS,GENERATED_AT\n"${rep.id}","${rep.title}","${rep.targetResource}","${rep.risk}","${rep.affectedServicesCount}","${rep.dependencyCount}","${rep.conflictsCount}","${rep.generatedAt}"`
      )
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', csvContent)
    downloadAnchor.setAttribute('download', `whatbreaks-report-${rep.id}.csv`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setDownloadSuccessMessage(`Exported report ${rep.id} as CSV`)
    setTimeout(() => setDownloadSuccessMessage(null), 3000)
  }

  return (
    <div className="reports-workspace-root">
      {/* Workspace Header */}
      <div className="reports-page-header">
        <div className="reports-header-text">
          <div className="reports-eyebrow mono">
            <span>PLATFORM HEALTH & AUDIT</span>
            <span className="dot-divider">/</span>
            <span>CLUSTER: prod-us-east-1</span>
          </div>
          <h2 className="reports-title">System Health & Reports</h2>
          <p className="reports-subtitle">
            Real-time cluster synchronization, topology health status, automated diagnostics, and pre-deployment audit reports.
          </p>
        </div>

        {downloadSuccessMessage && (
          <div className="download-toast-alert panel">
            <CheckCircle2 size={14} className="text-healthy" />
            <span className="mono text-xs">{downloadSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 1. Real-time Cluster Health & Component Status Panel */}
      <section className="system-health-panel panel">
        <div className="health-panel-top">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-healthy" />
            <span className="mono font-semibold text-white text-sm">CLUSTER COMPONENT HEALTH</span>
          </div>
          <div className="health-sync-badge mono text-xs">
            <span className="dot dot-healthy" />
            <span>SYNCED (v1.28.4 · 2m ago)</span>
          </div>
        </div>

        {/* 4 Diagnostic Health Indicators (Stacked vertically on mobile, grid on desktop) */}
        <div className="health-indicators-grid">
          <div className="health-indicator-card panel">
            <div className="indicator-header">
              <span className="indicator-title mono text-xs">KUBE API SERVER</span>
              <span className="badge badge-healthy mono text-xs">HEALTHY</span>
            </div>
            <div className="indicator-main font-semibold text-white text-sm">v1.28.4 Connected</div>
            <div className="indicator-sub mono text-muted text-xs">Latency: 12ms · 0 sync failures</div>
          </div>

          <div className="health-indicator-card panel">
            <div className="indicator-header">
              <span className="indicator-title mono text-xs">GRAPH ENGINE</span>
              <span className="badge badge-healthy mono text-xs">OPERATIONAL</span>
            </div>
            <div className="indicator-main font-semibold text-white text-sm">731 Topology Edges</div>
            <div className="indicator-sub mono text-muted text-xs">Traversal: 0.4ms · 184 nodes</div>
          </div>

          <div className="health-indicator-card panel">
            <div className="indicator-header">
              <span className="indicator-title mono text-xs">MANIFEST AST PARSER</span>
              <span className="badge badge-healthy mono text-xs">READY</span>
            </div>
            <div className="indicator-main font-semibold text-white text-sm">Helm & Kustomize</div>
            <div className="indicator-sub mono text-muted text-xs">0 schema parsing errors</div>
          </div>

          <div className="health-indicator-card panel">
            <div className="indicator-header">
              <span className="indicator-title mono text-xs">ACTIVE WARNINGS</span>
              <span className="badge badge-warning mono text-xs">1 DETECTED</span>
            </div>
            <div className="indicator-main font-semibold text-warning text-sm">Auth SCRAM Protocol</div>
            <div className="indicator-sub mono text-muted text-xs">pg@8.7.1 incompatible with PG 16</div>
          </div>
        </div>

        {/* Diagnostics Trigger & Logs Toggle (Full-width buttons on mobile) */}
        <div className="health-actions-bar">
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block-mobile"
            onClick={handleRunDiagnostic}
            disabled={isRunningDiagnostic}
          >
            {isRunningDiagnostic ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Running Cluster Health Diagnostic...</span>
              </>
            ) : (
              <>
                <Cpu size={14} />
                <span>Run Full Cluster Diagnostic</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block-mobile"
            onClick={() => setShowLogs(!showLogs)}
            aria-expanded={showLogs}
          >
            <Terminal size={14} />
            <span>{showLogs ? 'Hide Diagnostic Console Logs' : 'View Diagnostic Console Logs'}</span>
            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Diagnostic Run Success Toast */}
        {diagnosticPassed && (
          <div className="diagnostic-passed-banner panel mono text-xs">
            <CheckCircle2 size={14} className="text-healthy" />
            <span>Diagnostic complete: 4/4 subsystems healthy. 0 cluster unreachable faults.</span>
          </div>
        )}

        {/* Collapsible Diagnostic Console Logs */}
        {showLogs && (
          <div className="diagnostic-logs-drawer panel">
            <div className="logs-header mono text-xs text-muted">
              <span>DIAGNOSTIC CONSOLE LOGS · prod-us-east-1</span>
              <span>BUFFER: 5/5 OK</span>
            </div>
            <pre className="diagnostic-logs-pre mono text-xs">
{`[2026-10-18 21:40:02 UTC] [INFO] kube-client: Connected to API server https://kubernetes.default.svc:443 (v1.28.4)
[2026-10-18 21:40:04 UTC] [INFO] graph-engine: Ingested 184 resources from namespace ingress-edge, services, databases
[2026-10-18 21:40:07 UTC] [INFO] graph-engine: Computed DAG with 731 directed edges in 0.42ms
[2026-10-18 21:40:11 UTC] [WARN] ast-validator: Node "auth-service" driver "pg@8.7.1" lacks SCRAM channel binding for PostgreSQL 16
[2026-10-18 21:40:15 UTC] [INFO] health-daemon: Subsystems operational; readiness probe returning HTTP 200`}
            </pre>
          </div>
        )}
      </section>

      {/* Top Metrics Row */}
      <div className="reports-metrics-row">
        <div className="report-metric-card panel">
          <div className="metric-lbl mono">TOTAL REPORTS GENERATED</div>
          <div className="metric-val text-white">24</div>
          <div className="metric-sub text-muted">Across 18 pull requests</div>
        </div>
        <div className="report-metric-card panel">
          <div className="metric-lbl mono">BLOCKED HIGH-RISK CHANGES</div>
          <div className="metric-val text-risk">3</div>
          <div className="metric-sub text-muted">Prevented production outages</div>
        </div>
        <div className="report-metric-card panel">
          <div className="metric-lbl mono">PASSED CI GATES</div>
          <div className="metric-val text-healthy">21</div>
          <div className="metric-sub text-muted">100% verified dependency paths</div>
        </div>
        <div className="report-metric-card panel">
          <div className="metric-lbl mono">AVERAGE ANALYSIS DURATION</div>
          <div className="metric-val text-white">1.4s</div>
          <div className="metric-sub text-muted">Full DAG blast calculation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="reports-toolbar panel">
        <div className="search-input-wrap">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            placeholder="Search reports by resource, author or PR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search-input mono"
          />
        </div>

        <div className="risk-filter-tabs">
          <button
            type="button"
            className={`risk-filter-tab ${filterRisk === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterRisk('ALL')}
          >
            All Reports ({reports.length})
          </button>
          <button
            type="button"
            className={`risk-filter-tab ${filterRisk === 'HIGH' ? 'active' : ''}`}
            onClick={() => setFilterRisk('HIGH')}
          >
            <span className="dot dot-risk" style={{ width: 6, height: 6 }} />
            High Risk ({reports.filter((r) => r.risk === 'HIGH').length})
          </button>
          <button
            type="button"
            className={`risk-filter-tab ${filterRisk === 'MEDIUM' ? 'active' : ''}`}
            onClick={() => setFilterRisk('MEDIUM')}
          >
            <span className="dot dot-warning" style={{ width: 6, height: 6 }} />
            Medium ({reports.filter((r) => r.risk === 'MEDIUM').length})
          </button>
          <button
            type="button"
            className={`risk-filter-tab ${filterRisk === 'LOW' ? 'active' : ''}`}
            onClick={() => setFilterRisk('LOW')}
          >
            <span className="dot dot-healthy" style={{ width: 6, height: 6 }} />
            Low / Safe ({reports.filter((r) => r.risk === 'LOW').length})
          </button>
        </div>
      </div>

      {/* Reports List Cards */}
      <div className="reports-list-grid">
        {filteredReports.map((report) => (
          <div key={report.id} className="report-card panel">
            <div className="report-card-top">
              <div className="report-card-title-group">
                <div className="flex items-center gap-2">
                  <span className={`dot ${report.dotClass}`} />
                  <span className={`badge ${report.badgeClass} mono text-xs`}>
                    {report.risk} RISK
                  </span>
                  <span className="mono text-xs text-muted">ID: {report.id}</span>
                </div>
                <h3 className="report-card-title">{report.title}</h3>
                <div className="report-card-meta mono text-xs text-muted">
                  <span>Target: {report.targetResource}</span>
                  <span className="dot-divider">·</span>
                  <span>{report.generatedAt}</span>
                  <span className="dot-divider">·</span>
                  <span>{report.triggeredBy}</span>
                </div>
              </div>
            </div>

            <p className="report-card-summary text-muted text-xs">
              {report.summaryText}
            </p>

            {/* Key Metrics Columns */}
            <div className="report-stats-grid">
              <div className="report-stat-item">
                <span className="stat-lbl mono">AFFECTED SERVICES</span>
                <span className="stat-val font-semibold text-white">
                  {report.affectedServicesCount}
                </span>
              </div>
              <div className="report-stat-item">
                <span className="stat-lbl mono">DEPENDENCY PATHS</span>
                <span className="stat-val font-semibold text-white">
                  {report.dependencyCount}
                </span>
              </div>
              <div className="report-stat-item">
                <span className="stat-lbl mono">CONFIG CONFLICTS</span>
                <span className="stat-val font-semibold text-white">
                  {report.conflictsCount}
                </span>
              </div>
              <div className="report-stat-item">
                <span className="stat-lbl mono">RECOMMENDATIONS</span>
                <span className="stat-val font-semibold text-white">
                  {report.recommendationsCount}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="report-card-actions">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setSelectedReport(report)}
                >
                  <FileText size={13} />
                  <span>View Report</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    onSelectScenario(report.scenarioKey)
                    onNavigateToChanges()
                  }}
                >
                  <Sliders size={13} />
                  <span>Open in Changes</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  title="Export JSON report"
                  onClick={() => handleExportJSON(report)}
                >
                  <ArrowDownToLine size={13} />
                  <span className="mono text-xs">JSON</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  title="Export CSV report"
                  onClick={() => handleExportCSV(report)}
                >
                  <ArrowDownToLine size={13} />
                  <span className="mono text-xs">CSV</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Audit Report Modal */}
      {selectedReport && (
        <div className="modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="report-modal panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="mono text-xs text-muted">
                  WHATBREAKS AUDIT REPORT · {selectedReport.id.toUpperCase()}
                </div>
                <h3 className="modal-title">{selectedReport.title}</h3>
                <div className="modal-meta mono text-xs text-muted">
                  <span>Generated: {selectedReport.generatedAt}</span>
                  <span className="dot-divider">/</span>
                  <span>Trigger: {selectedReport.triggeredBy}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedReport(null)}
                aria-label="Close Modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Executive Risk Banner */}
              <div
                className={`audit-banner panel ${
                  selectedReport.risk === 'HIGH'
                    ? 'audit-banner-risk'
                    : selectedReport.risk === 'MEDIUM'
                    ? 'audit-banner-warning'
                    : 'audit-banner-healthy'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {selectedReport.risk === 'HIGH' ? (
                    <ShieldAlert size={16} className="text-risk" />
                  ) : selectedReport.risk === 'MEDIUM' ? (
                    <AlertTriangle size={16} className="text-warning" />
                  ) : (
                    <CheckCircle2 size={16} className="text-healthy" />
                  )}
                  <span className="mono text-sm">
                    DECISION GATE: {selectedReport.risk === 'HIGH' ? 'BLOCKED — HIGH BLAST RISK' : selectedReport.risk === 'MEDIUM' ? 'WARNING — MANUAL APPROVAL REQUIRED' : 'PASSED — SAFE TO MERGE'}
                  </span>
                </div>
                <p className="text-xs text-muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                  {selectedReport.summaryText}
                </p>
              </div>

              {/* Blast Radius Section */}
              <div className="modal-section">
                <div className="section-title-sm mono">AFFECTED SERVICES BREAKDOWN</div>
                <div className="report-modal-list">
                  {selectedReport.servicesList.map((svc) => (
                    <div key={svc} className="report-modal-item">
                      <span className="dot dot-risk" />
                      <span className="text-white text-xs">{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicts Section */}
              <div className="modal-section">
                <div className="section-title-sm mono">DETECTED CONFIGURATION CONFLICTS</div>
                {selectedReport.conflictsList.length > 0 ? (
                  <div className="report-modal-list">
                    {selectedReport.conflictsList.map((c) => (
                      <div key={c} className="report-modal-conflict-box panel">
                        <AlertTriangle size={13} className="text-warning" />
                        <span className="mono text-xs text-white">{c}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="report-modal-clean panel">
                    <CheckCircle2 size={13} className="text-healthy" />
                    <span className="mono text-xs text-muted">
                      No breaking configuration or protocol conflicts found.
                    </span>
                  </div>
                )}
              </div>

              {/* Recommendations Section */}
              <div className="modal-section">
                <div className="section-title-sm mono">MANDATORY REMEDIATION ACTIONS</div>
                <div className="report-modal-recs">
                  {selectedReport.recommendationsList.map((rec, i) => (
                    <div key={i} className="report-rec-item panel">
                      <span className="rec-step-badge mono">STEP 0{i + 1}</span>
                      <span className="rec-step-text text-white text-xs">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Sign-Off */}
              <div className="audit-signoff-bar panel">
                <FileCheck size={14} className="text-healthy" />
                <span className="mono text-xs text-muted">
                  CRYPTOGRAPHIC SIGN-OFF: SHA-256 e8f412... verified by WhatBreaks Engine v1.0
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleExportCSV(selectedReport)}
                >
                  <ArrowDownToLine size={13} />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleExportJSON(selectedReport)}
                >
                  <ArrowDownToLine size={13} />
                  <span>Download JSON Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
