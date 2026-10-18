import React from 'react'
import { Battery, Wifi } from 'lucide-react'

interface PhoneFrameProps {
  children: React.ReactNode
  time?: string
  showBezel?: boolean
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  time = '9:41',
  showBezel = true
}) => {
  if (!showBezel) {
    return (
      <div className="phone-screen-borderless">
        {children}
      </div>
    )
  }

  return (
    <div className="phone-frame-wrapper">
      {/* Outer Titanium / Metallic Device Shell */}
      <div className="phone-device-body">
        {/* Left Side Buttons (Volume Up, Volume Down, Action Button) */}
        <div className="phone-button-action" />
        <div className="phone-button-vol-up" />
        <div className="phone-button-vol-down" />

        {/* Right Side Power Button */}
        <div className="phone-button-power" />

        {/* Screen Area with Overflow Hidden */}
        <div className="phone-screen-container">
          {/* iOS Status Bar */}
          <div className="phone-status-bar" aria-hidden="true">
            <span className="phone-status-time">{time}</span>

            {/* Dynamic Island */}
            <div className="phone-dynamic-island">
              <div className="phone-island-camera" />
              <div className="phone-island-sensor" />
            </div>

            {/* Status Icons: Signal, WiFi, Battery */}
            <div className="phone-status-icons">
              <div className="phone-signal-bars" title="Cellular 5G">
                <span className="signal-bar bar-1 active" />
                <span className="signal-bar bar-2 active" />
                <span className="signal-bar bar-3 active" />
                <span className="signal-bar bar-4 active" />
              </div>
              <Wifi size={13} className="phone-wifi-icon" />
              <div className="phone-battery-wrap" title="Battery 94%">
                <Battery size={17} className="phone-battery-icon" />
                <div className="phone-battery-fill" />
              </div>
            </div>
          </div>

          {/* Active Application Content */}
          <div className="phone-screen-content">
            {children}
          </div>

          {/* iOS Bottom Home Indicator */}
          <div className="phone-home-indicator-bar" aria-hidden="true">
            <div className="phone-home-indicator-pill" />
          </div>
        </div>
      </div>
    </div>
  )
}
