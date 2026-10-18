import React, { useState, useEffect } from 'react'
import { ArrowRight, Menu, X, ExternalLink, Sun, Moon } from 'lucide-react'
import { useTheme } from '../themeContext'

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label="WhatBreaks Home">
          <span className="logo-glyph" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
              <rect x="11" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
              <rect x="6" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 7v3h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M14 7v3h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="logo-text">WHATBREAKS</span>
        </a>

        <nav className="navbar-links" aria-label="Main Navigation">
          <button type="button" className="nav-link" onClick={() => scrollToSection('product')}>Product</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('change')}>The Change</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('blast-radius')}>Blast Radius</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('dashboard')}>Dashboard</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('how-it-works')}>How it works</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('cli')}>CLI</button>
          <button type="button" className="nav-link" onClick={() => scrollToSection('kubernetes')}>
            <span>Kubernetes</span>
            <span className="badge badge-healthy mono" style={{ fontSize: '9px', padding: '1px 5px', marginLeft: '4px' }}>V1</span>
          </button>
          <a href="https://github.com/aaradhychinche-alt/WhatBreaks" target="_blank" rel="noopener noreferrer" className="nav-link nav-link-external">
            GitHub
            <ExternalLink size={12} className="external-icon" />
          </a>
        </nav>

        <div className="navbar-cta-group">
          {/* Subtle Theme Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => scrollToSection('kubernetes')}
          >
            <span>Try WhatBreaks</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile controls: Theme toggle + Hamburger */}
        <div className="navbar-mobile-actions">
          <button
            type="button"
            className="theme-toggle-btn mobile-header-theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay for click-outside dismissal */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="mobile-menu-links">
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('product')}>Product</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('change')}>The Change</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('blast-radius')}>Blast Radius</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('dashboard')}>Dashboard</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('how-it-works')}>How it works</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('cli')}>CLI</button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('kubernetes')}>Kubernetes (V1 Available Now)</button>
            <a
              href="https://github.com/aaradhychinche-alt/WhatBreaks"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>GitHub</span>
              <ExternalLink size={14} className="external-icon" style={{ marginLeft: 6 }} />
            </a>
          </div>
          <div className="mobile-menu-footer">
            <button
              type="button"
              className="btn btn-secondary mobile-menu-theme-btn"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px' }}
              onClick={() => scrollToSection('dashboard')}
            >
              <span>Try WhatBreaks</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
