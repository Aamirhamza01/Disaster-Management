import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  BookOpen,
  FileText,
  LogOut,
  PlusCircle,
  BrainCircuit,
  Radio,
  Home,
  Package,
  ClipboardList,
  ShieldAlert,
  FlaskConical,
  Brain,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top-accent" aria-hidden="true" />

        <div className="sidebar-brand">
          <img
            src="/RakṣāSetu.png"
            alt="Platform logo"
            className="sidebar-logo-mark"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/raksasetu-mark.svg';
            }}
          />
          <div className="sidebar-brand-copy">
            <div className="sidebar-logo-text" style={{ fontSize: '13px', lineHeight: 1.2 }}>AI Disaster Intelligence</div>
            <div className="sidebar-logo-sub" style={{ fontSize: '10px' }}>Community Response Platform</div>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Overview</div>
            <NavLink to="/dashboard" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/situational-awareness" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Radio size={16} />
              Citizen Awareness
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">AI &amp; Early Warning</div>
            <NavLink to="/ai-hub" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <BrainCircuit size={16} />
              AI Anomaly Hub
            </NavLink>
            <NavLink to="/simulation-lab" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <FlaskConical size={16} />
              Simulation Lab
            </NavLink>
            <NavLink to="/impact-intelligence" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Brain size={16} />
              Impact Intelligence
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Alert Management</div>
            <NavLink to="/events" end onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <AlertTriangle size={16} />
              Disaster Events
            </NavLink>
            <NavLink to="/events/new" end onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <PlusCircle size={16} />
              <span>New Event</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Community Response</div>
            <NavLink to="/incidents" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <ShieldAlert size={16} />
              <span>Incident Reports</span>
            </NavLink>
            <NavLink to="/shelters" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Home size={16} />
              <span>Shelters</span>
            </NavLink>
            <NavLink to="/resources" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Package size={16} />
              <span>Emergency Resources</span>
            </NavLink>
            <NavLink to="/tasks" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <ClipboardList size={16} />
              <span>Response Operations</span>
            </NavLink>
            <NavLink to="/recovery" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <TrendingUp size={16} />
              <span>Recovery Tracking</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Content &amp; Audit</div>
            <NavLink to="/guides" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <BookOpen size={16} />
              <span>Safety Guides</span>
            </NavLink>
            <NavLink to="/logs" onClick={closeMobileMenu} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <FileText size={16} />
              <span>Alert Logs</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-admin-meta">
            <div className="sidebar-admin-name">{admin?.name || 'System Admin'}</div>
            <div className="sidebar-admin-email">{admin?.email}</div>
          </div>
          <button type="button" className="sidebar-signout" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Mobile Header Bar */}
        <div className="mobile-header-bar">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-header-title">
            AI Disaster Intelligence
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
