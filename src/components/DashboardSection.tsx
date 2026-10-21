import React from 'react'
import { MacBookFrame } from './desktop/MacBookFrame'
import { MacBookVideoPlayer } from './desktop/MacBookVideoPlayer'
import { DesktopDashboard } from './desktop/DesktopDashboard'

export const DashboardSection: React.FC = () => {
  return (
    <section className="dashboard-section" id="dashboard">
      <div className="container">
        {/* Section Heading with Adaptive Architecture Message */}
        <div className="section-header">
          <div className="section-eyebrow mono">PRODUCT PLATFORM · LIVE DEMO</div>
          <h2 className="section-title">From change to clarity.</h2>
          <p className="section-subtitle mono text-center">
            SAME PRODUCT. DIFFERENT SCREENS. NO TOGGLE NEEDED.<br />
            <span className="text-muted" style={{ fontSize: '12px' }}>
              AUTOMATICALLY ADAPTS TO YOUR DEVICE.
            </span>
          </p>
        </div>

        {/* MacBook Pro Device Showcase with Live Video & Mute Control */}
        <div className="macbook-showcase-container">
          <MacBookFrame>
            <MacBookVideoPlayer fallback={<DesktopDashboard />} />
          </MacBookFrame>
        </div>
      </div>
    </section>
  )
}

