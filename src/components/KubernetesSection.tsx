import { useState } from 'react'
import { ArrowRight, CheckCircle2, Box } from 'lucide-react'

export const KubernetesSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<'change' | 'deps' | 'impact'>('change')

  const k8sComponents = [
    { name: 'Ingress', type: 'networking.k8s.io/v1', desc: 'TLS termination & host routing rules' },
    { name: 'Service', type: 'v1/Service (ClusterIP)', desc: 'Internal endpoint abstraction' },
    { name: 'Deployment', type: 'apps/v1/Deployment', desc: 'ReplicaSet controller (3 replicas)' },
    { name: 'Pods', type: 'v1/Pod (Workloads)', desc: 'Container instances running workloads' },
    { name: 'ConfigMap', type: 'v1/ConfigMap', desc: 'Environment & connection strings' },
    { name: 'Secret', type: 'v1/Secret', desc: 'Database credentials & TLS certs' },
    { name: 'StatefulSet', type: 'apps/v1/StatefulSet', desc: 'Persistent volume PostgreSQL state' }
  ]

  return (
    <section className="kubernetes-section" id="kubernetes">
      <div className="container">
        {/* Availability Banner */}
        <div className="k8s-available-banner">
          <div className="k8s-status-tag">
            <span className="dot dot-healthy" />
            <span className="mono">V1 AVAILABLE NOW</span>
          </div>
          <span className="k8s-platform-pill mono">KUBERNETES CLUSTER IMPACT ENGINE</span>
        </div>

        <div className="k8s-grid">
          {/* Left Column: Authentic Product Positioning */}
          <div className="k8s-content">
            <h2 className="k8s-headline">Start with Kubernetes.</h2>
            <p className="k8s-subhead">
              WhatBreaks V1 is currently available for Kubernetes. Analyze Kubernetes
              infrastructure changes, understand resource dependencies, and identify potential
              blast radius before manifests reach production.
            </p>

            <div className="k8s-value-points">
              <div className="k8s-point">
                <CheckCircle2 size={16} className="text-healthy" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Pre-apply Helm and Kustomize diff analysis</strong>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    Catch missing ConfigMap keys and secret mount drifts at PR time.
                  </p>
                </div>
              </div>

              <div className="k8s-point">
                <CheckCircle2 size={16} className="text-healthy" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Cross-resource cascading blast radius</strong>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    See which Ingress controllers, Services, and Pods depend on the modified manifest.
                  </p>
                </div>
              </div>

              <div className="k8s-point">
                <CheckCircle2 size={16} className="text-healthy" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Zero-overhead admission validation</strong>
                  <p className="text-muted" style={{ fontSize: '13px' }}>
                    Runs natively in CI/CD pipelines without installing intrusive cluster agents.
                  </p>
                </div>
              </div>
            </div>

            <div className="k8s-cta-row">
              <a
                href="https://github.com/aaradhychinche-alt/WhatBreaks"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <span>Try WhatBreaks on Kubernetes</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Right Column: Real Kubernetes Architecture Cascade */}
          <div className="k8s-visual panel">
            <div className="panel-header">
              <div className="k8s-vis-header-left mono">
                <Box size={14} className="text-secondary" />
                <span>KUBERNETES MANIFEST DEPENDENCY GRAPH</span>
              </div>
              <span className="badge badge-healthy mono">V1 STABLE</span>
            </div>

            <div className="k8s-vis-body">
              {/* Architecture Steps Switcher */}
              <div className="k8s-tabs mono">
                <button
                  type="button"
                  className={`k8s-tab ${activeStep === 'change' ? 'k8s-tab-active' : ''}`}
                  onClick={() => setActiveStep('change')}
                >
                  01 CHANGE
                </button>
                <button
                  type="button"
                  className={`k8s-tab ${activeStep === 'deps' ? 'k8s-tab-active' : ''}`}
                  onClick={() => setActiveStep('deps')}
                >
                  02 DEPENDENCIES
                </button>
                <button
                  type="button"
                  className={`k8s-tab ${activeStep === 'impact' ? 'k8s-tab-active' : ''}`}
                  onClick={() => setActiveStep('impact')}
                >
                  03 IMPACT
                </button>
              </div>

              {/* Dynamic Demonstration Output */}
              <div className="k8s-vis-content">
                {activeStep === 'change' && (
                  <div className="k8s-stage-box">
                    <span className="mono text-muted" style={{ fontSize: '11px' }}>
                      PULL REQUEST: k8s/deployments/auth-service.yaml
                    </span>
                    <pre className="mono k8s-code-block">
{`~ spec:
    template:
      spec:
        containers:
        - name: auth-service
-         image: auth:v2.14.0
+         image: auth:v2.15.0
          envFrom:
-         - configMapRef: { name: auth-config-v1 }
+         - configMapRef: { name: auth-config-v2 }`}
                    </pre>
                    <p className="k8s-stage-explanation">
                      Developer proposes updating Auth Service image and migrating to ConfigMap v2.
                    </p>
                  </div>
                )}

                {activeStep === 'deps' && (
                  <div className="k8s-stage-box">
                    <span className="mono text-muted" style={{ fontSize: '11px' }}>
                      WHATBREAKS KUBERNETES TOPOLOGY TRAVERSAL
                    </span>
                    <pre className="mono k8s-code-block">
{`[Resolved Kubernetes Dependencies]
  Ingress:    api-ingress (hosts: api.production.io)
  Service:    auth-service:8080 (ClusterIP)
  Pods:       auth-service-79bc6d9-x4k9 (3 replicas)
  ConfigMap:  auth-config-v2 (keys: DB_HOST, DB_NAME, DB_PORT)
  Secret:     auth-db-secret (referenced key: PGPASSWORD)
  Database:   postgres-cluster (StatefulSet)`}
                    </pre>
                    <p className="k8s-stage-explanation">
                      Engine traverses cluster objects and correlates secret mounts and config references.
                    </p>
                  </div>
                )}

                {activeStep === 'impact' && (
                  <div className="k8s-stage-box">
                    <span className="mono text-muted" style={{ fontSize: '11px' }}>
                      BLAST RADIUS & VIOLATION REPORT
                    </span>
                    <pre className="mono k8s-code-block">
{`CRITICAL: Missing key in ConfigMap auth-config-v2
  Key: 'DB_MAX_CONNECTIONS' missing; expected by auth:v2.15.0
  Outcome: Container will crash-loop during rolling update
  Blast Radius:
    - 3 auth pods CrashLoopBackOff
    - Ingress /auth/* returns 502 Bad Gateway
    - API Gateway upstream pool degraded`}
                    </pre>
                    <p className="k8s-stage-explanation text-warning">
                      Caught prior to apply: prevented production crash-loop outage across 3 replicas.
                    </p>
                  </div>
                )}
              </div>

              {/* Cluster Resource Chips */}
              <div className="k8s-chips-row">
                {k8sComponents.map((comp) => (
                  <div key={comp.name} className="k8s-chip">
                    <span className="k8s-chip-name">{comp.name}</span>
                    <span className="mono k8s-chip-type text-dim">{comp.type.split('/')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
