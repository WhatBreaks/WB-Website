import React, { useState } from 'react'
import {
  ArrowRight,
  Database,
  Layers,
  Network,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Sliders,
  Zap
} from 'lucide-react'
import { SCENARIOS } from '../../mockData'

interface OverviewViewProps {
  onSelectScenario: (scenarioId: string) => void
  onNavigate: (navId: string) => void
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSelectScenario,
  onNavigate
}) => {
  // Input method: 'natural' | 'structured'
  const [inputMode, setInputMode] = useState<'natural' | 'structured'>('natural')
  const [naturalQuery, setNaturalQuery] = useState(
    'What happens if I upgrade PostgreSQL from 15.4 to 16.1?'
  )

  // Structured form inputs
  const [resource, setResource] = useState('PostgreSQL')
  const [changeType, setChangeType] = useState<'version' | 'config' | 'replicas' | 'schema'>('version')
  const [currentVersion, setCurrentVersion] = useState('15.4')
  const [proposedVersion, setProposedVersion] = useState('16.1')
  const [environment, setEnvironment] = useState('Production')
  const [optionalDetails, setOptionalDetails] = useState('connectionTimeoutMillis: 5000\nsslmode: verify-full\nmax_connections: 500')

  // Live Analysis progress simulation state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisPhase, setAnalysisPhase] = useState<number>(0)
  const [analysisResult, setAnalysisResult] = useState<{
    scenarioKey: string
    title: string
    risk: 'HIGH' | 'MEDIUM' | 'LOW'
    affectedCount: number
    conflictsCount: number
    pathsCount: number
    dependenciesCount: number
  } | null>(null)

  const quickQueries = [
    {
      label: 'PostgreSQL 15.4 → 16.1',
      query: 'What happens if I upgrade PostgreSQL from 15.4 to 16.1?',
      scenarioKey: 'pg-15-16'
    },
    {
      label: 'Redis 6.2 → 7.2',
      query: 'Can I upgrade Redis from 6.2 to 7.2?',
      scenarioKey: 'redis-6-7'
    },
    {
      label: 'API Gateway 1.27 → 1.28',
      query: 'What breaks if I upgrade API Gateway Envoy from 1.27 to 1.28?',
      scenarioKey: 'envoy-minor'
    },
    {
      label: 'Dependencies on PostgreSQL',
      query: 'What services depend directly on PostgreSQL?',
      scenarioKey: 'pg-15-16'
    }
  ]

  const handleRunAnalysis = (targetKey = 'pg-15-16') => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisPhase(1)

    // Phase 1: Understanding change
    setTimeout(() => {
      setAnalysisPhase(2)
    }, 600)

    // Phase 2: Tracing dependencies
    setTimeout(() => {
      setAnalysisPhase(3)
    }, 1200)

    // Phase 3: Finalized
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisPhase(0)
      const sc = SCENARIOS[targetKey] || SCENARIOS['pg-15-16']
      setAnalysisResult({
        scenarioKey: targetKey,
        title: `${sc.resource} ${sc.currentVersion} → ${sc.proposedVersion}`,
        risk: sc.riskLevel.includes('HIGH')
          ? 'HIGH'
          : sc.riskLevel.includes('MEDIUM')
          ? 'MEDIUM'
          : 'LOW',
        affectedCount: sc.summary.affectedServices,
        conflictsCount: sc.summary.configConflicts,
        pathsCount: sc.summary.highRiskPaths,
        dependenciesCount: sc.summary.totalDependencies
      })
      onSelectScenario(targetKey)
    }, 1800)
  }

  const handleSelectRecent = (key: string) => {
    onSelectScenario(key)
    onNavigate('changes')
  }

  return (
    <div className="overview-workspace-root">
      {/* 1. PRIMARY FEATURE: ANALYZE A CHANGE WORKSPACE */}
      <section className="analyze-change-workspace panel">
        <div className="analyze-workspace-header">
          <div className="analyze-header-left">
            <span className="mono text-xs text-muted" style={{ letterSpacing: '0.08em' }}>
              WHATBREAKS ENGINE · INSTANT IMPACT SIMULATION
            </span>
            <h2 className="analyze-title">What are you planning to change?</h2>
            <p className="analyze-subtitle text-secondary">
              Input a proposed infrastructure upgrade or configuration modification to calculate downstream blast radius before deployment.
            </p>
          </div>

          <div className="analyze-input-mode-toggle">
            <button
              type="button"
              className={`mode-toggle-btn mono ${inputMode === 'natural' ? 'mode-toggle-active' : ''}`}
              onClick={() => setInputMode('natural')}
            >
              Natural Language
            </button>
            <button
              type="button"
              className={`mode-toggle-btn mono ${inputMode === 'structured' ? 'mode-toggle-active' : ''}`}
              onClick={() => setInputMode('structured')}
            >
              Structured Spec
            </button>
          </div>
        </div>

        {/* Input Interface */}
        {inputMode === 'natural' ? (
          <div className="natural-input-box">
            <div className="natural-input-row">
              <div className="natural-input-wrap">
                <Search size={16} className="text-muted natural-search-icon" />
                <input
                  type="text"
                  className="natural-text-input mono"
                  placeholder="Ask WhatBreaks... e.g. What happens if I upgrade PostgreSQL from 15.4 to 16.1?"
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunAnalysis('pg-15-16')
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary analyze-action-btn"
                onClick={() => handleRunAnalysis('pg-15-16')}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Questions Chips */}
            <div className="quick-queries-bar">
              <span className="mono text-xs text-muted">EXAMPLES:</span>
              <div className="quick-query-chips">
                {quickQueries.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="quick-chip mono"
                    onClick={() => {
                      setNaturalQuery(item.query)
                      handleRunAnalysis(item.scenarioKey)
                    }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="quick-chip-outline mono"
                  onClick={() => onNavigate('graph')}
                >
                  <Network size={12} />
                  <span>Select from infrastructure graph</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Structured Input Spec: Clear 4-Step Vertical Workflow */
          <div className="structured-input-box investigate-workflow-container">
            {/* Step 1: Target Resource Selector */}
            <div className="investigate-step-card">
              <div className="investigate-step-header">
                <span className="step-badge mono">STEP 01</span>
                <label className="form-label mono" htmlFor="target-resource-select">
                  TARGET RESOURCE
                </label>
              </div>
              <div className="investigate-select-wrap">
                <select
                  id="target-resource-select"
                  className="form-select mono"
                  value={resource}
                  onChange={(e) => {
                    const val = e.target.value
                    setResource(val)
                    if (val === 'PostgreSQL') {
                      setCurrentVersion('15.4')
                      setProposedVersion('16.1')
                    } else if (val === 'Redis') {
                      setCurrentVersion('6.2')
                      setProposedVersion('7.2')
                    } else if (val === 'API Gateway') {
                      setCurrentVersion('1.27')
                      setProposedVersion('1.28')
                    } else {
                      setCurrentVersion('3.12')
                      setProposedVersion('3.13')
                    }
                  }}
                >
                  <option value="PostgreSQL">PostgreSQL (Aurora RDS Primary Cluster)</option>
                  <option value="Redis">Redis (Session & Rate Limit Cluster)</option>
                  <option value="API Gateway">API Gateway (Envoy Edge Ingress)</option>
                  <option value="RabbitMQ">RabbitMQ (Event Broker Cluster)</option>
                </select>
              </div>
              <div className="resource-id-meta mono text-xs text-muted">
                IDENTIFIER:{' '}
                <span className="text-secondary">
                  {resource === 'PostgreSQL'
                    ? 'aurora-pg-cluster.c7z9.rds.amazonaws.com (Namespace: databases/prod)'
                    : resource === 'Redis'
                    ? 'elasticache-redis.cache.amazonaws.com (Namespace: caches/prod)'
                    : resource === 'API Gateway'
                    ? 'envoy-ingress.networking.k8s.io (Namespace: ingress-edge)'
                    : 'rabbitmq-cluster.amqp.internal (Namespace: messaging/prod)'}
                </span>
              </div>
            </div>

            {/* Step 2: Proposed Change Selector */}
            <div className="investigate-step-card">
              <div className="investigate-step-header">
                <span className="step-badge mono">STEP 02</span>
                <label className="form-label mono">PROPOSED CHANGE TYPE</label>
              </div>

              {/* Change Type Selector Options */}
              <div className="change-type-pills-row">
                <button
                  type="button"
                  className={`change-type-pill mono ${changeType === 'version' ? 'change-type-pill-active' : ''}`}
                  onClick={() => setChangeType('version')}
                >
                  <span className="pill-dot" />
                  <span>Version Upgrade</span>
                </button>
                <button
                  type="button"
                  className={`change-type-pill mono ${changeType === 'config' ? 'change-type-pill-active' : ''}`}
                  onClick={() => setChangeType('config')}
                >
                  <span className="pill-dot" />
                  <span>Config Update</span>
                </button>
                <button
                  type="button"
                  className={`change-type-pill mono ${changeType === 'replicas' ? 'change-type-pill-active' : ''}`}
                  onClick={() => setChangeType('replicas')}
                >
                  <span className="pill-dot" />
                  <span>Replica Scaling</span>
                </button>
                <button
                  type="button"
                  className={`change-type-pill mono ${changeType === 'schema' ? 'change-type-pill-active' : ''}`}
                  onClick={() => setChangeType('schema')}
                >
                  <span className="pill-dot" />
                  <span>Schema Migration</span>
                </button>
              </div>

              {/* Version & Environment Inputs */}
              <div className="change-specs-vertical-grid">
                <div className="change-version-pair">
                  <div className="form-field flex-1">
                    <label className="sub-field-label mono">CURRENT PRODUCTION VERSION</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={currentVersion}
                      onChange={(e) => setCurrentVersion(e.target.value)}
                      placeholder="e.g. 15.4"
                    />
                  </div>
                  <div className="version-arrow-divider mono">→</div>
                  <div className="form-field flex-1">
                    <label className="sub-field-label mono">PROPOSED TARGET VERSION</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={proposedVersion}
                      onChange={(e) => setProposedVersion(e.target.value)}
                      placeholder="e.g. 16.1"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="sub-field-label mono">TARGET ENVIRONMENT</label>
                  <select
                    className="form-select mono"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                  >
                    <option value="Production">Production (Strict Blast Radius Verification)</option>
                    <option value="Staging">Staging (Pre-release Validation)</option>
                    <option value="Development">Development (Sandbox Verification)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Optional Change Details / Manifest Diff */}
            <div className="investigate-step-card">
              <div className="investigate-step-header">
                <span className="step-badge mono">STEP 03</span>
                <label className="form-label mono" htmlFor="optional-change-details">
                  OPTIONAL CHANGE DETAILS & CONFIGURATION
                </label>
              </div>
              <textarea
                id="optional-change-details"
                className="form-textarea mono"
                rows={3}
                placeholder="e.g. connectionTimeoutMillis: 5000&#10;sslmode: verify-full&#10;max_connections: 500"
                value={optionalDetails}
                onChange={(e) => setOptionalDetails(e.target.value)}
              />
              <div className="text-muted mono text-xs" style={{ marginTop: '4px' }}>
                Optional: Supply manifest overrides, driver settings, or connection pool parameters for AST conflict detection.
              </div>
            </div>

            {/* Step 4: Full-width Analyze Impact Button */}
            <div className="investigate-step-card investigate-action-card">
              <button
                type="button"
                className="btn btn-primary btn-block analyze-submit-btn-workflow"
                onClick={() => {
                  const key =
                    resource === 'Redis'
                      ? 'redis-6-7'
                      : resource === 'API Gateway'
                      ? 'envoy-minor'
                      : 'pg-15-16'
                  handleRunAnalysis(key)
                }}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Evaluating Downstream Topology & Dependencies...</span>
                  </>
                ) : (
                  <>
                    <span>Run Impact Analysis</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="investigate-alt-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('graph')}
                >
                  <Network size={13} />
                  <span>Select from Topology Graph</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('services')}
                >
                  <Server size={13} />
                  <span>Browse Resource Catalog</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Analysis Progress State */}
        {isAnalyzing && (
          <div className="analysis-progress-container panel">
            <div className="progress-phases-row">
              <div className={`phase-item ${analysisPhase >= 1 ? 'phase-item-active' : ''}`}>
                <div className="phase-num mono">01</div>
                <div className="phase-text">
                  <div className="font-semibold text-white text-xs">UNDERSTANDING CHANGE</div>
                  <div className="mono text-muted text-xs">✓ Resource & versions identified</div>
                </div>
              </div>

              <div className={`phase-item ${analysisPhase >= 2 ? 'phase-item-active' : ''}`}>
                <div className="phase-num mono">02</div>
                <div className="phase-text">
                  <div className="font-semibold text-white text-xs">TRACING DEPENDENCIES</div>
                  <div className="mono text-muted text-xs">✓ 184 resources & 731 edges loaded</div>
                </div>
              </div>

              <div className={`phase-item ${analysisPhase >= 3 ? 'phase-item-active' : ''}`}>
                <div className="phase-num mono">03</div>
                <div className="phase-text">
                  <div className="font-semibold text-white text-xs">ANALYZING IMPACT</div>
                  <div className="mono text-muted text-xs">✓ Calculating blast radius</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Analysis Completed Result Banner */}
        {analysisResult && !isAnalyzing && (
          <div className="analysis-completed-result panel">
            <div className="result-top-banner">
              <div className="flex items-center gap-3">
                <span
                  className={`dot ${
                    analysisResult.risk === 'HIGH'
                      ? 'dot-risk'
                      : analysisResult.risk === 'MEDIUM'
                      ? 'dot-warning'
                      : 'dot-healthy'
                  }`}
                />
                <span
                  className={`badge ${
                    analysisResult.risk === 'HIGH'
                      ? 'badge-risk'
                      : analysisResult.risk === 'MEDIUM'
                      ? 'badge-warning'
                      : 'badge-healthy'
                  } mono text-xs`}
                >
                  {analysisResult.risk} RISK
                </span>
                <span className="result-title text-white font-semibold">
                  {analysisResult.title}
                </span>
              </div>

              <span className="mono text-muted text-xs">
                ANALYSIS COMPLETE · AUDIT #412
              </span>
            </div>

            <div className="result-metrics-grid">
              <div className="result-metric-item">
                <span className="mono text-muted text-xs">AFFECTED SERVICES</span>
                <span className="result-metric-val font-semibold text-white">
                  {analysisResult.affectedCount} services
                </span>
              </div>
              <div className="result-metric-item">
                <span className="mono text-muted text-xs">CONFIG CONFLICTS</span>
                <span className="result-metric-val font-semibold text-warning">
                  {analysisResult.conflictsCount} detected
                </span>
              </div>
              <div className="result-metric-item">
                <span className="mono text-muted text-xs">HIGH RISK PATHS</span>
                <span className="result-metric-val font-semibold text-risk">
                  {analysisResult.pathsCount} critical path
                </span>
              </div>
              <div className="result-metric-item">
                <span className="mono text-muted text-xs">DEPENDENCIES EVALUATED</span>
                <span className="result-metric-val font-semibold text-white">
                  {analysisResult.dependenciesCount} traced
                </span>
              </div>
            </div>

            <div className="result-actions-bar">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('changes')}
                >
                  <span>Open Full Analysis</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('blast-radius')}
                >
                  <Layers size={13} />
                  <span>View Blast Radius</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('graph')}
                >
                  <Network size={13} />
                  <span>Inspect on Graph</span>
                </button>
              </div>

              <span className="mono text-xs text-muted">
                {analysisResult.risk === 'LOW'
                  ? 'Decision: Approved for deployment via canary rollout'
                  : analysisResult.risk === 'MEDIUM'
                  ? 'Decision: Validate in staging before production cutover'
                  : 'Decision: Block deployment pending driver upgrade'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. RECENT CHANGE ANALYSES */}
      <section className="overview-recent-section panel">
        <div className="section-title-bar">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-muted" />
            <h3 className="section-title-text font-semibold text-white">RECENT CHANGE ANALYSES</h3>
          </div>
          <button
            type="button"
            className="mono text-xs text-muted hover-underline"
            onClick={() => onNavigate('changes')}
          >
            View all changes →
          </button>
        </div>

        <div className="table-responsive">
          <table className="overview-analyses-table">
            <thead>
              <tr>
                <th className="mono">PROPOSED CHANGE</th>
                <th className="mono">RISK LEVEL</th>
                <th className="mono">AFFECTED SERVICES</th>
                <th className="mono">CONFLICTS</th>
                <th className="mono">TIMING</th>
                <th className="mono" style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr onClick={() => handleSelectRecent('pg-15-16')}>
                <td>
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-muted" />
                    <span className="font-semibold text-white">PostgreSQL 15.4 → 16.1</span>
                  </div>
                  <span className="mono text-muted text-xs" style={{ display: 'block', marginTop: 2 }}>
                    Aurora RDS Primary · PR #412
                  </span>
                </td>
                <td>
                  <span className="badge badge-risk mono text-xs">
                    <span className="dot dot-risk" />
                    HIGH RISK
                  </span>
                </td>
                <td>
                  <span className="text-white font-medium">3 affected services</span>
                </td>
                <td>
                  <span className="text-warning mono text-xs">2 conflicts</span>
                </td>
                <td>
                  <span className="mono text-muted text-xs">Analyzed 2 min ago</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-sm btn-secondary mono text-xs">
                    Open Analysis →
                  </button>
                </td>
              </tr>

              <tr onClick={() => handleSelectRecent('redis-6-7')}>
                <td>
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-muted" />
                    <span className="font-semibold text-white">Redis 6.2 → 7.2</span>
                  </div>
                  <span className="mono text-muted text-xs" style={{ display: 'block', marginTop: 2 }}>
                    Session Cluster · PR #409
                  </span>
                </td>
                <td>
                  <span className="badge badge-warning mono text-xs">
                    <span className="dot dot-warning" />
                    MEDIUM RISK
                  </span>
                </td>
                <td>
                  <span className="text-white font-medium">4 affected services</span>
                </td>
                <td>
                  <span className="text-warning mono text-xs">1 conflict</span>
                </td>
                <td>
                  <span className="mono text-muted text-xs">Analyzed 14 min ago</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-sm btn-secondary mono text-xs">
                    Open Analysis →
                  </button>
                </td>
              </tr>

              <tr onClick={() => handleSelectRecent('envoy-minor')}>
                <td>
                  <div className="flex items-center gap-2">
                    <Network size={14} className="text-muted" />
                    <span className="font-semibold text-white">API Gateway 1.27 → 1.28</span>
                  </div>
                  <span className="mono text-muted text-xs" style={{ display: 'block', marginTop: 2 }}>
                    Envoy Edge Proxy · Sync #288
                  </span>
                </td>
                <td>
                  <span className="badge badge-healthy mono text-xs">
                    <span className="dot dot-healthy" />
                    LOW RISK
                  </span>
                </td>
                <td>
                  <span className="text-white font-medium">1 service</span>
                </td>
                <td>
                  <span className="text-healthy mono text-xs">0 critical paths</span>
                </td>
                <td>
                  <span className="mono text-muted text-xs">Analyzed 1 hr ago</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-sm btn-secondary mono text-xs">
                    Open Analysis →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. COMPACT SYSTEM METRICS */}
      <section className="overview-kpi-grid">
        <div className="overview-kpi-card panel">
          <div className="kpi-value text-white">12</div>
          <div className="kpi-label mono">ACTIVE ANALYSES</div>
          <div className="kpi-subtext text-muted">Across 3 Kubernetes clusters</div>
        </div>

        <div className="overview-kpi-card panel">
          <div className="kpi-value text-risk">3</div>
          <div className="kpi-label mono">HIGH RISK CHANGES</div>
          <div className="kpi-subtext text-muted">Blocked at CI gate</div>
        </div>

        <div className="overview-kpi-card panel">
          <div className="kpi-value text-warning">17</div>
          <div className="kpi-label mono">AFFECTED SERVICES</div>
          <div className="kpi-subtext text-muted">Downstream in blast path</div>
        </div>

        <div className="overview-kpi-card panel">
          <div className="kpi-value text-white">184</div>
          <div className="kpi-label mono">DEPENDENCIES TRACED</div>
          <div className="kpi-subtext text-muted">Kubernetes DAG synced</div>
        </div>
      </section>

      {/* 4. INFRASTRUCTURE STATUS & ACTIVITY */}
      <div className="overview-two-col-grid">
        {/* Status */}
        <section className="overview-card panel">
          <div className="overview-card-header">
            <span className="overview-card-title">INFRASTRUCTURE STATUS</span>
            <span className="badge badge-healthy mono text-xs">
              <span className="dot dot-healthy" />
              ALL SYSTEMS SYNCED
            </span>
          </div>

          <div className="health-list">
            <div className="health-item">
              <div>
                <div className="font-semibold text-white text-xs">Kubernetes Cluster</div>
                <div className="mono text-muted text-xs">prod-us-east-1 (v1.28.4)</div>
              </div>
              <span className="badge badge-healthy mono text-xs">
                <span className="dot dot-healthy" />
                Healthy
              </span>
            </div>

            <div className="health-item">
              <div>
                <div className="font-semibold text-white text-xs">Dependency Graph</div>
                <div className="mono text-muted text-xs">184 nodes · 731 edges</div>
              </div>
              <span className="badge badge-healthy mono text-xs">
                <span className="dot dot-healthy" />
                Synced
              </span>
            </div>

            <div className="health-item">
              <div>
                <div className="font-semibold text-white text-xs">Last Topology Scan</div>
                <div className="mono text-muted text-xs">Validating admission webhook</div>
              </div>
              <span className="mono text-muted text-xs">2 minutes ago</span>
            </div>
          </div>
        </section>

        {/* Activity Feed */}
        <section className="overview-card panel">
          <div className="overview-card-header">
            <span className="overview-card-title">RECENT ACTIVITY</span>
            <span className="mono text-muted text-xs">LIVE AUDIT FEED</span>
          </div>

          <div className="overview-activity-feed">
            <div className="activity-item">
              <div className="activity-icon-wrap">
                <ShieldAlert size={14} className="text-risk" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Analysis completed</div>
                <div className="text-muted text-xs">
                  PostgreSQL upgrade detected on PR #412 · High risk
                </div>
                <div className="mono text-muted text-xs" style={{ marginTop: 2 }}>2m ago</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon-wrap">
                <Network size={14} className="text-healthy" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Dependency discovered</div>
                <div className="text-muted text-xs">billing-service → postgres connection mapped</div>
                <div className="mono text-muted text-xs" style={{ marginTop: 2 }}>14m ago</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon-wrap">
                <Zap size={14} className="text-warning" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Configuration conflict</div>
                <div className="text-muted text-xs">redis connection pool timeout mismatch identified</div>
                <div className="mono text-muted text-xs" style={{ marginTop: 2 }}>28m ago</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
