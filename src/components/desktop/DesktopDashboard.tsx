import React, { useState } from 'react'
import {
  ChevronDown,
  ExternalLink,
  Layers,
  Network,
  Server,
  Settings,
  Sliders,
  Terminal
} from 'lucide-react'
import { SCENARIOS } from '../../mockData'
import { OverviewView } from '../dashboard/OverviewView'
import { ChangesView } from '../dashboard/ChangesView'
import { ImpactGraphView } from '../dashboard/ImpactGraphView'
import { BlastRadiusView } from '../dashboard/BlastRadiusView'
import { AffectedServicesView } from '../dashboard/AffectedServicesView'
import { ReportsView } from '../dashboard/ReportsView'
import { IntegrationsView } from '../dashboard/IntegrationsView'
import { SettingsView } from '../dashboard/SettingsView'

export type DesktopNav =
  | 'overview'
  | 'changes'
  | 'graph'
  | 'blast-radius'
  | 'services'
  | 'reports'
  | 'integrations'
  | 'settings'

const CLUSTERS = [
  { id: 'prod-us-east-1', name: 'prod-us-east-1 (v1.28.4)', env: 'PRODUCTION', resources: 184, syncTime: '2m ago' },
  { id: 'staging-eu-west-1', name: 'staging-eu-west-1 (v1.28.2)', env: 'STAGING', resources: 142, syncTime: '4m ago' },
  { id: 'dev-cluster-01', name: 'dev-cluster-01 (v1.29.0)', env: 'DEVELOPMENT', resources: 96, syncTime: '1m ago' },
]

interface DesktopDashboardProps {
  initialNav?: DesktopNav
  initialScenarioKey?: string
  initialCluster?: string
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  initialNav = 'overview',
  initialScenarioKey = 'pg-15-16',
  initialCluster = 'prod-us-east-1'
}) => {
  const [activeNav, setActiveNav] = useState<DesktopNav>(initialNav)
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>(initialScenarioKey)
  const [selectedCluster, setSelectedCluster] = useState<string>(initialCluster)
  const [inspectedServiceId, setInspectedServiceId] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false)

  const scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['pg-15-16']

  const handleSelectScenario = (key: string) => {
    setSelectedScenarioKey(key)
    setInspectedServiceId(null)
  }

  const handleNavigate = (nav: string, serviceId?: string) => {
    setActiveNav(nav as DesktopNav)
    if (serviceId) {
      setInspectedServiceId(serviceId)
    }
  }

  // Handle escape key to close open menus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (userMenuOpen) setUserMenuOpen(false)
        if (clusterDropdownOpen) setClusterDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [userMenuOpen, clusterDropdownOpen])

  return (
    <div className="desktop-dashboard-root dashboard-app-frame panel">
      {/* Top Bar with technical breadcrumbs & status */}
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <span className="app-logo-badge mono font-bold">WB</span>
          <span className="mono text-white text-xs font-semibold ml-1">WHATBREAKS</span>

          <span className="topbar-divider">/</span>
          <span className="topbar-project mono">{selectedCluster}</span>
          <span className="topbar-divider">/</span>
          <span className="topbar-analysis mono">analysis-412</span>
          <span className="topbar-divider">/</span>
          <span className="topbar-branch mono">
            upgrade-{scenario.resource.toLowerCase().replace(/\s+/g, '-')}
          </span>
        </div>

        <div className="dashboard-topbar-right">
          <div className="desktop-status-group mono">
            <span className="status-pill text-healthy">
              <span className="dot dot-healthy" />
              <span>API [CONNECTED]</span>
            </span>
            <span className="status-pill text-healthy">
              <span className="dot dot-healthy" />
              <span>Core Engine [HEALTHY]</span>
            </span>
          </div>

          <span className="badge badge-neutral mono topbar-env-badge">
            ENV: PRODUCTION
          </span>

          {/* User / Workspace Menu */}
          <div className="user-menu-wrap">
            <button
              type="button"
              className="user-menu-btn mono text-xs"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar-dot" />
              <span className="user-name-text">alex.sre</span>
              <ChevronDown size={11} className="text-muted" />
            </button>

            {userMenuOpen && (
              <div className="user-menu-dropdown panel" onClick={() => setUserMenuOpen(false)}>
                <div className="dropdown-user-info">
                  <div className="text-white font-semibold text-xs">alex.sre@company.internal</div>
                  <div className="text-muted mono text-xs">Role: Principal Infrastructure Engineer</div>
                </div>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item mono text-xs"
                  onClick={() => setActiveNav('settings')}
                >
                  Workspace Settings
                </button>
                <button
                  type="button"
                  className="dropdown-item mono text-xs"
                  onClick={() => setActiveNav('integrations')}
                >
                  Connected Sources
                </button>
                <div className="dropdown-divider" />
                <div className="dropdown-item mono text-xs text-muted">
                  Cluster: {selectedCluster} (v1.28.4)
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout: Left Sidebar + Dynamic Content */}
      <div className="dashboard-layout">
        {/* Desktop Sidebar Navigation matching reference image */}
        <aside className="dashboard-sidebar" aria-label="Dashboard desktop navigation">
          <div className="sidebar-section-title mono">WORKSPACE</div>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'overview' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('overview')}
          >
            <Sliders size={14} />
            <span>Investigate</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'changes' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('changes')}
          >
            <Layers size={14} />
            <span>Changes</span>
            <span className="sidebar-count mono">3</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'services' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('services')}
          >
            <Server size={14} />
            <span>Resources</span>
            <span className="sidebar-count mono sidebar-count-risk">
              {scenario.summary.affectedServices}
            </span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'graph' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('graph')}
          >
            <Network size={14} />
            <span>Dependencies</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'blast-radius' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('blast-radius')}
          >
            <Layers size={14} />
            <span>Blast Radius</span>
          </button>

          <div className="sidebar-divider" />
          <div className="sidebar-section-title mono">PLATFORM</div>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'reports' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('reports')}
          >
            <Terminal size={14} />
            <span>System Health</span>
            <span className="sidebar-count mono">4</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'integrations' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('integrations')}
          >
            <ExternalLink size={14} />
            <span>Integrations</span>
            <span className="sidebar-status-tag mono">v1</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeNav === 'settings' ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavigate('settings')}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>

          {/* Sidebar Footer with Workspace Cluster Dropdown & User profile */}
          <div className="sidebar-footer">
            <div className="sidebar-cluster-selector-wrap">
              <div className="sidebar-section-title mono" style={{ margin: '0 0 4px 0', padding: 0 }}>
                WORKSPACE
              </div>
              <button
                type="button"
                className="sidebar-cluster-btn mono text-xs"
                onClick={() => setClusterDropdownOpen(!clusterDropdownOpen)}
              >
                <span className="truncate">{selectedCluster}</span>
                <ChevronDown size={11} className="text-muted" />
              </button>

              {clusterDropdownOpen && (
                <div className="sidebar-cluster-dropdown panel">
                  {CLUSTERS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`cluster-dropdown-item mono text-xs ${c.id === selectedCluster ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCluster(c.id)
                        setClusterDropdownOpen(false)
                      }}
                    >
                      <div className="text-white font-medium">{c.name}</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>
                        {c.resources} resources · sync {c.syncTime}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="sidebar-sync-indicator mono text-xs mt-1">
                <span className="dot dot-healthy" />
                <span>184 resources · 2m ago</span>
              </div>
            </div>

            <div className="sidebar-user-card flex items-center gap-2 mt-3 pt-2 border-t border-border">
              <div className="sidebar-user-avatar mono font-bold">A</div>
              <div className="sidebar-user-meta">
                <div className="text-white mono text-xs font-semibold">aaradhy</div>
                <div className="text-muted mono text-xs">admin</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Interactive Workspace Area */}
        <main className="dashboard-main-view" role="region" aria-label="Dashboard view content">
          {activeNav === 'overview' && (
            <OverviewView
              onSelectScenario={handleSelectScenario}
              onNavigate={handleNavigate}
            />
          )}

          {activeNav === 'changes' && (
            <ChangesView
              selectedScenarioKey={selectedScenarioKey}
              onSelectScenario={handleSelectScenario}
              onNavigateToGraph={() => setActiveNav('graph')}
              onNavigateToServices={() => setActiveNav('services')}
            />
          )}

          {activeNav === 'graph' && (
            <ImpactGraphView
              selectedScenarioKey={selectedScenarioKey}
              onSelectScenario={handleSelectScenario}
              onInspectService={(serviceId) => {
                setInspectedServiceId(serviceId)
                setActiveNav('services')
              }}
            />
          )}

          {activeNav === 'blast-radius' && (
            <BlastRadiusView
              selectedScenarioKey={selectedScenarioKey}
              onSelectScenario={handleSelectScenario}
              onNavigateToServices={() => setActiveNav('services')}
              onNavigateToGraph={() => setActiveNav('graph')}
            />
          )}

          {activeNav === 'services' && (
            <AffectedServicesView
              selectedScenarioKey={selectedScenarioKey}
              onSelectScenario={handleSelectScenario}
              onNavigateToGraph={(svcId) => {
                if (svcId) setInspectedServiceId(svcId)
                setActiveNav('graph')
              }}
              onInvestigate={(_resourceName) => {
                setActiveNav('overview')
              }}
              initialSelectedServiceId={inspectedServiceId}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              onSelectScenario={handleSelectScenario}
              onNavigateToChanges={() => setActiveNav('changes')}
            />
          )}

          {activeNav === 'integrations' && (
            <IntegrationsView />
          )}

          {activeNav === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  )
}
