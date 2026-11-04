import React from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="final-cta-box panel">
          <div className="section-eyebrow mono" style={{ justifyContent: 'center' }}>
            PREDICTIVE INFRASTRUCTURE RESILIENCE
          </div>
          <h2 className="final-cta-title">
            Change infrastructure<br /><span className="serif-accent">with confidence.</span>
          </h2>
          <p className="final-cta-desc text-muted">
            Start with Kubernetes. Understand the impact before the change reaches production.
          </p>

          <div className="final-cta-actions">
            <a
              href="https://github.com/aaradhychinche-alt/WhatBreaks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <span>Try WhatBreaks</span>
              <ArrowRight size={15} />
            </a>

            <a
              href="https://github.com/aaradhychinche-alt/WhatBreaks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <span>View on GitHub</span>
              <ExternalLink size={14} className="text-muted" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
