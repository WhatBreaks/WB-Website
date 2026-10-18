import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Search,
  ShieldAlert,
  X
} from 'lucide-react'
import { SCENARIOS } from '../../mockData'

interface AffectedServicesViewProps {
  selectedScenarioKey: string
  onSelectScenario: (scenarioKey: string) => void
  onNavigateToGraph: (serviceId?: string) => void
  onInvestigate?: (resourceName: string) => void
  initialSelectedServiceId?: string | null
}

interface ServiceDetail {
  id: string
  name: string
  runtime: string
  version: string
  relation: 'Direct dependency' | 'Indirect dependency'
  risk: 'HIGH' | 'MEDIUM' | 'LOW'
  impactCategory: string
  status: 'Impacted' | 'Warning' | 'Degraded' | 'Low impact'
  targetDependency: string
  potentialFailure: string
  configuration: string
  traffic: string
  relatedResources: string[]
  endpoints: string[]
  suggestedAction: string
}

export const AffectedServicesView: React.FC<AffectedServicesViewProps> = ({
  selectedScenarioKey,
  onSelectScenario,
  onNavigateToGraph,
  onInvestigate,
  initialSelectedServiceId
}) => {
  const scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['pg-15-16']
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialSelectedServiceId || 'auth-service'
  )

  // Rich services data mapped to current change scenario
  const servicesData: ServiceDetail[] = React.useMemo(() => {
    if (selectedScenarioKey === 'pg-15-16') {
      return [
        {
          id: 'auth-service',
          name: 'Auth Service',
          runtime: 'Node.js',
          version: 'v2.14.0',
          relation: 'Direct dependency',
          risk: 'HIGH',
          impactCategory: 'Database connection',
          status: 'Impacted',
          targetDependency: 'PostgreSQL 16.1',
          potentialFailure:
            'Database connection incompatibility: SCRAM-SHA-256 handshake negotiation fails under legacy client protocol.',
          configuration: 'pg@8.7.1 in package.json',
          traffic: '1,420 requests/sec',
          relatedResources: ['API Gateway', 'PostgreSQL', 'Redis'],
          endpoints: ['/oauth/token', '/auth/login', '/auth/verify'],
          suggestedAction: 'Upgrade pg to ^8.11.3 and update sslmode configuration.'
        },
        {
          id: 'billing-service',
          name: 'Billing Service',
          runtime: 'Ruby on Rails',
          version: 'v1.9.4',
          relation: 'Direct dependency',
          risk: 'HIGH',
          impactCategory: 'Connection compatibility',
          status: 'Impacted',
          targetDependency: 'PostgreSQL 16.1',
          potentialFailure:
            'Transaction pooler timeout: PgBouncer cold connection negotiation exceeds the configured 5000ms threshold.',
          configuration: 'connectionTimeoutMillis: 5000 (helm/values-prod.yaml)',
          traffic: '380 requests/sec',
          relatedResources: ['API Gateway', 'PostgreSQL', 'Analytics'],
          endpoints: ['/webhooks/stripe', '/subscriptions/charge', '/invoices/generate'],
          suggestedAction: 'Increase connectionTimeoutMillis to 10000ms.'
        },
        {
          id: 'redis',
          name: 'Redis Cluster',
          runtime: 'Redis Engine',
          version: '7.0.11',
          relation: 'Indirect dependency',
          risk: 'MEDIUM',
          impactCategory: 'Configuration conflict',
          status: 'Warning',
          targetDependency: 'PostgreSQL 16.1',
          potentialFailure:
            'Session cache fallback spike: if Auth Service encounters PG connection retries, session read pressure surges 4.2x.',
          configuration: 'maxmemory-policy: allkeys-lru',
          traffic: '9,500 ops/sec',
          relatedResources: ['Auth Service', 'API Gateway'],
          endpoints: ['session:token:*', 'rate:limit:*'],
          suggestedAction: 'Monitor connection pool sizing during database cutover window.'
        },
        {
          id: 'worker-service',
          name: 'Worker Service',
          runtime: 'Python (Celery)',
          version: 'v2.6.0',
          relation: 'Indirect dependency',
          risk: 'MEDIUM',
          impactCategory: 'Connection retry behavior',
          status: 'Degraded',
          targetDependency: 'PostgreSQL 16.1',
          potentialFailure:
            'Implicit timestamp casting deprecation in bulk event writes leads to task worker retries accumulating in queue.',
          configuration: 'SQLAlchemy 1.4.32 (raw SQL queries)',
          traffic: '85 jobs/sec',
          relatedResources: ['RabbitMQ', 'PostgreSQL', 'Analytics'],
          endpoints: ['queue:events.drain', 'cron:reconciliation'],
          suggestedAction: 'Cast raw timestamp expressions to explicit ::timestamptz.'
        },
        {
          id: 'analytics-service',
          name: 'Analytics Service',
          runtime: 'Rust / Actix',
          version: 'v1.11.0',
          relation: 'Indirect dependency',
          risk: 'LOW',
          impactCategory: 'Read workload',
          status: 'Low impact',
          targetDependency: 'PostgreSQL 16.1',
          potentialFailure:
            'Logical replication streaming slot needs re-creation; telemetry aggregation will observe 300s lag.',
          configuration: 'replication_slot: telemetry_events_v1',
          traffic: '42 batch/sec',
          relatedResources: ['Billing Service', 'Worker Service'],
          endpoints: ['/metrics/ingest', '/reports/aggregate'],
          suggestedAction: 'Trigger slot migration script during maintenance window.'
        }
      ]
    } else if (selectedScenarioKey === 'redis-6-7') {
      return [
        {
          id: 'auth-service',
          name: 'Auth Service',
          runtime: 'Node.js',
          version: 'v2.14.0',
          relation: 'Direct dependency',
          risk: 'MEDIUM',
          impactCategory: 'Cache protocol negotiation',
          status: 'Impacted',
          targetDependency: 'Redis 7.2',
          potentialFailure:
            'RESP3 protocol default behavior change causes unexpected null return types on legacy ioredis driver.',
          configuration: 'ioredis@4.28.0 (package.json)',
          traffic: '1,420 requests/sec',
          relatedResources: ['API Gateway', 'Redis'],
          endpoints: ['/auth/verify', '/session/validate'],
          suggestedAction: 'Update ioredis to ^5.3.2 to support RESP3 protocol.'
        },
        {
          id: 'api-gateway',
          name: 'API Gateway',
          runtime: 'Envoy',
          version: '1.28.0',
          relation: 'Indirect dependency',
          risk: 'LOW',
          impactCategory: 'Rate limiter sync',
          status: 'Warning',
          targetDependency: 'Redis 7.2',
          potentialFailure:
            'Transient token bucket reconnect lag during cluster topology update.',
          configuration: 'ratelimit.yaml (redis_cluster)',
          traffic: '12,400 requests/sec',
          relatedResources: ['Auth Service', 'User Service'],
          endpoints: ['/v1/*', '/public/*'],
          suggestedAction: 'Verify client reconnect backoff policy.'
        }
      ]
    } else if (selectedScenarioKey === 'ingress-patch') {
      return [
        {
          id: 'api-gateway',
          name: 'API Gateway',
          runtime: 'Envoy',
          version: '1.28.2',
          relation: 'Direct dependency',
          risk: 'LOW',
          impactCategory: 'Ingress Controller Routing',
          status: 'Low impact',
          targetDependency: 'Ingress NGINX 1.13',
          potentialFailure:
            'Annotation schema and TLS termination verification; backward compatible with active routing rules.',
          configuration: 'k8s/ingress.yaml',
          traffic: '12,400 requests/sec',
          relatedResources: ['Ingress NGINX', 'API Gateway'],
          endpoints: ['/*'],
          suggestedAction: 'Verify ingress controller readiness probe during standard rolling reload.'
        }
      ]
    } else {
      // envoy-minor (API Gateway)
      return [
        {
          id: 'auth-service',
          name: 'Auth Service',
          runtime: 'Node.js',
          version: 'v2.14.0',
          relation: 'Direct dependency',
          risk: 'LOW',
          impactCategory: 'ext_authz Filter',
          status: 'Low impact',
          targetDependency: 'API Gateway (Envoy 1.28)',
          potentialFailure:
            'Minor protobuf header normalization; verified backward compatible with zero routing disruption.',
          configuration: 'ext_authz in envoy-gateway.yaml',
          traffic: '2,100 requests/sec',
          relatedResources: ['API Gateway', 'Auth Service'],
          endpoints: ['/ext-auth/*'],
          suggestedAction: 'Deploy 1 canary replica to verify header preservation before full cluster rollout.'
        }
      ]
    }
  }, [selectedScenarioKey])

  // Filtered rows
  const filteredServices = servicesData.filter((svc) => {
    const matchesRisk = riskFilter === 'ALL' || svc.risk === riskFilter
    const matchesSearch =
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.impactCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.potentialFailure.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRisk && matchesSearch
  })

  const inspectedService =
    servicesData.find((s) => s.id === selectedServiceId) || servicesData[0]

  return (
    <div className="affected-services-workspace">
      {/* Workspace Header */}
      <div className="services-page-header">
        <div className="services-header-text">
          <div className="services-eyebrow mono">
            <span>IMPACT RADIUS INSPECTION</span>
            <span className="dot-divider">/</span>
            <span>PROPOSED CHANGE: {scenario.resource} {scenario.proposedVersion}</span>
          </div>
          <h2 className="services-title">Affected services</h2>
          <p className="services-subtitle">
            Services that may be impacted by the selected infrastructure change.
            Inspect failure mechanisms, runtime compatibility, and traffic exposure across downstream dependents.
          </p>
        </div>

        {/* Change Scenario Picker */}
        <div className="services-scenario-picker">
          <span className="mono text-xs text-muted">TARGET CHANGE:</span>
          <div className="scenario-pills">
            <button
              type="button"
              className={`scenario-pill ${selectedScenarioKey === 'pg-15-16' ? 'scenario-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('pg-15-16')
                setSelectedServiceId('auth-service')
              }}
            >
              <span className="dot dot-risk" />
              <span>PostgreSQL 15.4 → 16.1</span>
              <span className="badge badge-risk mono" style={{ fontSize: '9px' }}>HIGH</span>
            </button>
            <button
              type="button"
              className={`scenario-pill ${selectedScenarioKey === 'redis-6-7' ? 'scenario-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('redis-6-7')
                setSelectedServiceId('auth-service')
              }}
            >
              <span className="dot dot-warning" />
              <span>Redis 6.2 → 7.2</span>
              <span className="badge badge-warning mono" style={{ fontSize: '9px' }}>MED</span>
            </button>
            <button
              type="button"
              className={`scenario-pill ${selectedScenarioKey === 'envoy-minor' ? 'scenario-pill-active' : ''}`}
              onClick={() => {
                onSelectScenario('envoy-minor')
                setSelectedServiceId('api-gateway')
              }}
            >
              <span className="dot dot-healthy" />
              <span>API Gateway 1.27 → 1.28</span>
              <span className="badge badge-healthy mono" style={{ fontSize: '9px' }}>LOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Tiles */}
      <div className="services-metrics-row">
        <div className="service-kpi-card panel">
          <div className="kpi-label mono">TOTAL AFFECTED SERVICES</div>
          <div className="kpi-value text-white">{servicesData.length}</div>
          <div className="kpi-subtext text-muted">Across 4 topology tiers</div>
        </div>
        <div className="service-kpi-card panel">
          <div className="kpi-label mono">DIRECT DEPENDENCIES</div>
          <div className="kpi-value text-risk">
            {servicesData.filter((s) => s.relation === 'Direct dependency').length}
          </div>
          <div className="kpi-subtext text-muted">Immediate failure potential</div>
        </div>
        <div className="service-kpi-card panel">
          <div className="kpi-label mono">INDIRECT / CASCADING</div>
          <div className="kpi-value text-warning">
            {servicesData.filter((s) => s.relation === 'Indirect dependency').length}
          </div>
          <div className="kpi-subtext text-muted">Buffer & retry degradation</div>
        </div>
        <div className="service-kpi-card panel">
          <div className="kpi-label mono">TOTAL TRAFFIC AT RISK</div>
          <div className="kpi-value text-white">11,385 req/s</div>
          <div className="kpi-subtext text-muted">Peak production throughput</div>
        </div>
      </div>

      {/* Main Table + Right Drawer Layout */}
      <div className="services-body-layout">
        {/* Left: Table Container */}
        <div className="services-table-container panel">
          {/* Table Controls (Filter & Search) */}
          <div className="table-controls-bar">
            <div className="search-input-wrap">
              <Search size={14} className="text-muted" />
              <input
                type="text"
                placeholder="Search services, impact or failure mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="table-search-input mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="risk-filter-tabs">
              <button
                type="button"
                className={`risk-filter-tab ${riskFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setRiskFilter('ALL')}
              >
                All ({servicesData.length})
              </button>
              <button
                type="button"
                className={`risk-filter-tab ${riskFilter === 'HIGH' ? 'active' : ''}`}
                onClick={() => setRiskFilter('HIGH')}
              >
                <span className="dot dot-risk" style={{ width: 6, height: 6 }} />
                High ({servicesData.filter((s) => s.risk === 'HIGH').length})
              </button>
              <button
                type="button"
                className={`risk-filter-tab ${riskFilter === 'MEDIUM' ? 'active' : ''}`}
                onClick={() => setRiskFilter('MEDIUM')}
              >
                <span className="dot dot-warning" style={{ width: 6, height: 6 }} />
                Medium ({servicesData.filter((s) => s.risk === 'MEDIUM').length})
              </button>
              <button
                type="button"
                className={`risk-filter-tab ${riskFilter === 'LOW' ? 'active' : ''}`}
                onClick={() => setRiskFilter('LOW')}
              >
                <span className="dot dot-healthy" style={{ width: 6, height: 6 }} />
                Low ({servicesData.filter((s) => s.risk === 'LOW').length})
              </button>
            </div>
          </div>

          {/* Desktop Table (Visible on Desktop) */}
          <div className="table-responsive desktop-services-table">
            <table className="affected-services-table">
              <thead>
                <tr>
                  <th className="mono">SERVICE</th>
                  <th className="mono">RELATION</th>
                  <th className="mono">RISK</th>
                  <th className="mono">IMPACT</th>
                  <th className="mono">STATUS</th>
                  <th className="mono" style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((svc) => {
                  const isSelected = selectedServiceId === svc.id
                  return (
                    <tr
                      key={svc.id}
                      className={`service-table-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => setSelectedServiceId(svc.id)}
                    >
                      <td className="col-service">
                        <div className="service-name-cell">
                          <div className="font-semibold text-white">{svc.name}</div>
                          <div className="service-meta-sub mono text-muted text-xs">
                            {svc.runtime} · {svc.version}
                          </div>
                        </div>
                      </td>
                      <td className="col-relation">
                        <span className="mono text-xs text-muted">
                          {svc.relation}
                        </span>
                      </td>
                      <td className="col-risk">
                        <span
                          className={`badge ${
                            svc.risk === 'HIGH'
                              ? 'badge-risk'
                              : svc.risk === 'MEDIUM'
                              ? 'badge-warning'
                              : 'badge-healthy'
                          } mono text-xs`}
                        >
                          <span
                            className={`dot ${
                              svc.risk === 'HIGH'
                                ? 'dot-risk'
                                : svc.risk === 'MEDIUM'
                                ? 'dot-warning'
                                : 'dot-healthy'
                            }`}
                          />
                          {svc.risk}
                        </span>
                      </td>
                      <td className="col-impact">
                        <div className="impact-text-cell">
                          <span className="impact-category text-white font-medium">
                            {svc.impactCategory}
                          </span>
                          <span className="impact-snippet text-muted text-xs">
                            {svc.potentialFailure.slice(0, 75)}...
                          </span>
                        </div>
                      </td>
                      <td className="col-status">
                        <span
                          className={`status-pill mono text-xs ${
                            svc.status === 'Impacted'
                              ? 'status-impacted'
                              : svc.status === 'Warning'
                              ? 'status-warning'
                              : 'status-low'
                          }`}
                        >
                          {svc.status}
                        </span>
                      </td>
                      <td className="col-action" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="inspect-row-btn mono text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedServiceId(svc.id)
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Resource Cards View (Visible on Mobile) */}
          <div className="mobile-services-cards-list">
            {filteredServices.map((svc) => {
              const isSelected = selectedServiceId === svc.id
              return (
                <div
                  key={svc.id}
                  className={`mobile-resource-card panel ${isSelected ? 'm-card-selected' : ''}`}
                >
                  <div className="m-card-header">
                    <div>
                      <div className="m-card-title font-semibold text-white">{svc.name}</div>
                      <div className="mono text-muted text-xs">
                        {svc.runtime} · {svc.version}
                      </div>
                      <div className="mono text-muted text-xs" style={{ marginTop: '2px', wordBreak: 'break-all' }}>
                        prod-us-east-1 / {svc.name.toLowerCase().replace(/\s+/g, '-')}
                      </div>
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

                  <div className="m-card-meta-row mono text-xs">
                    <span className="text-secondary">{svc.relation}</span>
                    <span className="text-muted">·</span>
                    <span className="text-white">{svc.traffic}</span>
                  </div>

                  <p className="m-card-reason text-secondary text-xs">{svc.potentialFailure}</p>

                  <div className="mobile-card-actions-row">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => {
                        if (onInvestigate) {
                          onInvestigate(svc.name)
                        } else {
                          onNavigateToGraph(svc.id)
                        }
                      }}
                    >
                      <span>Investigate Resource</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex-1"
                      onClick={() => setSelectedServiceId(svc.id)}
                    >
                      <span>Inspect Details</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="table-empty-state">
              <p className="text-muted mono">No services match the active filter criteria.</p>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setRiskFilter('ALL')
                  setSearchQuery('')
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Mobile Inspection Drawer Backdrop */}
        {inspectedService && (
          <div
            className="mobile-inspection-backdrop"
            onClick={() => setSelectedServiceId(null)}
            aria-hidden="true"
          />
        )}

        {/* Right: Service Inspection Drawer */}
        {inspectedService && (
          <aside className="service-inspection-drawer panel">
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span className="drawer-eyebrow mono text-muted">
                  SERVICE INSPECTOR
                </span>
                <h3 className="drawer-title">{inspectedService.name}</h3>
                <div className="drawer-runtime-badge mono text-muted text-xs">
                  {inspectedService.runtime} · {inspectedService.version}
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedServiceId(null)}
                aria-label="Close Inspection Drawer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Risk Indicator Bar */}
            <div className="drawer-risk-bar">
              <div className="drawer-risk-badge-group">
                <span
                  className={`dot ${
                    inspectedService.risk === 'HIGH'
                      ? 'dot-risk'
                      : inspectedService.risk === 'MEDIUM'
                      ? 'dot-warning'
                      : 'dot-healthy'
                  }`}
                />
                <span className={`badge ${
                  inspectedService.risk === 'HIGH'
                    ? 'badge-risk'
                    : inspectedService.risk === 'MEDIUM'
                    ? 'badge-warning'
                    : 'badge-healthy'
                } mono text-xs`}>
                  {inspectedService.risk} RISK
                </span>
              </div>
              <span className="drawer-relation-tag mono text-xs text-muted">
                {inspectedService.relation}
              </span>
            </div>

            {/* Drawer Detail Rows */}
            <div className="drawer-body-sections">
              <div className="drawer-field">
                <div className="drawer-label mono">TARGET DEPENDENCY</div>
                <div className="drawer-value text-white font-semibold flex items-center gap-2">
                  <Database size={13} className="text-muted" />
                  <span>{inspectedService.targetDependency}</span>
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">POTENTIAL FAILURE MODE</div>
                <div className="failure-mode-box panel">
                  <div
                    className={`flex items-center gap-1.5 mono text-xs font-semibold ${
                      inspectedService.risk === 'HIGH'
                        ? 'text-risk'
                        : inspectedService.risk === 'MEDIUM'
                        ? 'text-warning'
                        : 'text-healthy'
                    }`}
                  >
                    {inspectedService.risk === 'HIGH' ? (
                      <ShieldAlert size={13} />
                    ) : inspectedService.risk === 'MEDIUM' ? (
                      <AlertTriangle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>
                      {inspectedService.risk === 'HIGH'
                        ? 'High Impact Failure Risk'
                        : inspectedService.risk === 'MEDIUM'
                        ? 'Operational Degradation Risk'
                        : 'Contained Impact Mode'}
                    </span>
                  </div>
                  <p className="failure-desc-text">
                    {inspectedService.potentialFailure}
                  </p>
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">CONFIGURATION / DRIVER</div>
                <div className="config-code-box mono text-xs">
                  {inspectedService.configuration}
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">MEASURED PRODUCTION TRAFFIC</div>
                <div className="traffic-value text-white mono font-semibold">
                  {inspectedService.traffic}
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">RELATED RESOURCES</div>
                <div className="related-resources-pills">
                  {inspectedService.relatedResources.map((res) => (
                    <span key={res} className="related-pill mono text-xs">
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">AFFECTED ENDPOINTS</div>
                <div className="endpoints-list mono text-xs">
                  {inspectedService.endpoints.map((ep) => (
                    <div key={ep} className="endpoint-item">
                      {ep}
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-field">
                <div className="drawer-label mono">SUGGESTED ACTION</div>
                <div className="suggested-action-box panel">
                  <p className="text-xs text-white" style={{ lineHeight: 1.5 }}>
                    {inspectedService.suggestedAction}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => onNavigateToGraph(inspectedService.id)}
              >
                <span>Locate on Impact Graph</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
