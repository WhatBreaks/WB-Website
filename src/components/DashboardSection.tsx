import React from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { MacBookFrame } from './desktop/MacBookFrame'
import { DesktopDashboard } from './desktop/DesktopDashboard'
import { MobileApp } from './mobile/MobileApp'

export const DashboardSection: React.FC = () => {
  return (
    <section className="dashboard-section" id="dashboard">
      <div className="container">
        {/* Section Heading with Adaptive Architecture Message */}
        <div className="section-header">
          <div className="section-eyebrow mono">PRODUCT PLATFORM · ADAPTIVE ARCHITECTURE</div>
          <h2 className="section-title">From change to clarity.</h2>
          <p className="section-subtitle mono text-center">
            SAME PRODUCT. DIFFERENT SCREENS. NO TOGGLE NEEDED.<br />
            <span className="text-muted" style={{ fontSize: '12px' }}>
              AUTOMATICALLY ADAPTS TO YOUR DEVICE.
            </span>
          </p>
        </div>

        {/* 1. DESKTOP SHOWCASE (Visible on desktop and laptop >= 1024px) */}
        <div className="desktop-showcase-container">
          <div className="showcase-device-badge-wrap">
            <div className="showcase-device-badge mono">
              <Monitor size={15} className="badge-icon" />
              <div className="badge-texts">
                <span className="badge-title">DESKTOP VIEW (Automatically)</span>
                <span className="badge-sub">When opened on a PC or larger screen</span>
              </div>
            </div>
          </div>

          <MacBookFrame>
            <DesktopDashboard />
          </MacBookFrame>
        </div>

        {/* 2. NATIVE MOBILE DASHBOARD (Automatically active on phones / screens < 1024px) */}
        <div className="mobile-dashboard-container">
          <div className="showcase-device-badge-wrap">
            <div className="showcase-device-badge mono mobile-badge">
              <Smartphone size={15} className="badge-icon" />
              <div className="badge-texts">
                <span className="badge-title">MOBILE VIEW (Automatically)</span>
                <span className="badge-sub">When opened on a phone or small screen</span>
              </div>
            </div>
          </div>

          {/* Direct Native Mobile Dashboard - No fake device frame on phone */}
          <div className="mobile-dashboard-standalone panel">
            <MobileApp />
          </div>
        </div>
      </div>
    </section>
  )
}
