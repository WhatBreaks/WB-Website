import React from 'react'

interface MacBookFrameProps {
  children: React.ReactNode
}

export const MacBookFrame: React.FC<MacBookFrameProps> = ({ children }) => {
  return (
    <div className="macbook-showcase-wrapper">
      {/* Outer MacBook Pro Device Shell */}
      <div className="macbook-device-shell">
        {/* Top Display Lid */}
        <div className="macbook-display-lid">
          {/* Top Bezel with Camera Notch */}
          <div className="macbook-top-bezel" aria-hidden="true">
            <div className="macbook-camera-notch">
              <div className="macbook-camera-lens" />
              <div className="macbook-sensor-dot" />
            </div>
          </div>

          {/* Screen Display Area - LIVE APPLICATION CLIPPED INSIDE */}
          <div className="macbook-screen-area">
            {children}
          </div>

          {/* Display Lower Chin with MacBook Pro branding */}
          <div className="macbook-chin-bar" aria-hidden="true">
            <span className="macbook-chin-text">MacBook Pro</span>
          </div>
        </div>

        {/* Laptop Base Chassis with Hinge and Thumb Notch */}
        <div className="macbook-base-chassis" aria-hidden="true">
          <div className="macbook-hinge" />
          <div className="macbook-front-lip">
            <div className="macbook-thumb-notch" />
          </div>
        </div>
      </div>
    </div>
  )
}
