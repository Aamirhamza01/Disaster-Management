/**
 * CitizenLayout.tsx
 *
 * Dedicated layout for the Public Citizen Web Portal.
 * Clean, mobile-first, emergency-optimized navigation bar with no admin sidebar.
 */

import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Home,
  BookOpen,
  User,
  Menu,
  X,
  Compass,
} from 'lucide-react';

export const CitizenLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          background: '#050814',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand */}
          <Link to="/citizen" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(239,68,68,0.4)',
              }}
            >
              <ShieldAlert size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                RakṣāSetu
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.5px' }}>
                COMMUNITY SAFETY PORTAL
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="citizen-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NavLink to="/citizen" end className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <Compass size={15} /> Home
            </NavLink>
            <NavLink to="/citizen/alerts" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <AlertTriangle size={15} /> Alerts
            </NavLink>
            <NavLink to="/citizen/report" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <PlusCircle size={15} /> Report Incident
            </NavLink>
            <NavLink to="/citizen/check-in" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <CheckCircle2 size={15} /> Safety Check-In
            </NavLink>
            <NavLink to="/citizen/shelters" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <Home size={15} /> Find Shelter
            </NavLink>
            <NavLink to="/citizen/guides" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <BookOpen size={15} /> Safety Guides
            </NavLink>
            <NavLink to="/citizen/profile" className={({ isActive }) => `citizen-nav-link${isActive ? ' active' : ''}`}>
              <User size={15} /> Profile
            </NavLink>

            <Link
              to="/login"
              style={{
                marginLeft: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Operator Console →
            </Link>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            className="citizen-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#f8fafc',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div
            style={{
              background: '#0a0f1d',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <NavLink to="/citizen" end onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <Compass size={18} /> Community Home
            </NavLink>
            <NavLink to="/citizen/alerts" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <AlertTriangle size={18} /> Active Disaster Alerts
            </NavLink>
            <NavLink to="/citizen/report" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <PlusCircle size={18} /> Report an Emergency Incident
            </NavLink>
            <NavLink to="/citizen/check-in" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <CheckCircle2 size={18} /> Safety Check-In (I am Safe / Need Help)
            </NavLink>
            <NavLink to="/citizen/shelters" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <Home size={18} /> Find Emergency Shelters
            </NavLink>
            <NavLink to="/citizen/guides" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <BookOpen size={18} /> Disaster Preparedness Guides
            </NavLink>
            <NavLink to="/citizen/profile" onClick={closeMenu} className={({ isActive }) => `citizen-mobile-link${isActive ? ' active' : ''}`}>
              <User size={18} /> My Citizen Profile
            </NavLink>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link
                to="/login"
                onClick={closeMenu}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Go to Operator Console →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          background: '#050814',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px 16px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <strong>AI Disaster Intelligence Platform</strong> — Public Community Portal
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
            Integrated with SDMA Command Center &amp; Emergency Operations Units
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CitizenLayout;
