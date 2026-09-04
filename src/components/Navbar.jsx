import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Ticket,
  Bell,
  BookOpen,
  Bot,
  RotateCcw,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onResetData, isResetting, theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
    { id: 'schedules', label: 'Schedules', shortLabel: 'Schedules', icon: Calendar },
    { id: 'rooms', label: 'Rooms & Booking', shortLabel: 'Rooms', icon: Building2 },
    { id: 'events', label: 'Events', shortLabel: 'Events', icon: Ticket },
    { id: 'announcements', label: 'Announcements', shortLabel: 'Notices', icon: Bell },
    { id: 'assignments', label: 'Assignments', shortLabel: 'Tasks', icon: BookOpen },
    { id: 'agent', label: 'AI Assistant', shortLabel: 'AI Senior', icon: Bot, isAgent: true }
  ];

  // Close mobile menu on tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 860) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand Logo & Name */}
        <div
          className="brand-section"
          onClick={() => handleTabClick('overview')}
          role="button"
          tabIndex={0}
          title="Return to Overview"
        >
          <div className="brand-logo">
            <Sparkles size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-title">CampusOS</div>
            <div className="brand-subtitle">AUST CSE · AI Build Hackathon</div>
          </div>
        </div>

        {/* Desktop Tabs Navigation */}
        <nav className="tabs-list" aria-label="Campus navigation">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${isActive ? 'active' : ''} ${tab.isAgent ? 'tab-agent' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                title={tab.label}
                type="button"
              >
                <Icon size={15} />
                <span className="tab-label-full">{tab.label}</span>
                <span className="tab-label-short">{tab.shortLabel}</span>
                {tab.isAgent && (
                  <span className={`live-badge ${isActive ? 'active' : ''}`}>
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Nav Controls & Status */}
        <div className="nav-status">
          {/* Theme Switcher Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === 'light' ? (
              <>
                <Moon size={15} color="var(--accent-indigo)" />
                <span className="theme-toggle-text">Dark</span>
              </>
            ) : (
              <>
                <Sun size={15} color="var(--accent-amber)" />
                <span className="theme-toggle-text">Light</span>
              </>
            )}
          </button>

          {/* Academic Clock with live pulsing dot */}
          <div className="status-badge" title="Live academic clock: Fall 2026 simulated semester">
            <span className="status-dot"></span>
            <Clock size={13} />
            <span className="clock-full">Fri Sep 4 · 15:48</span>
            <span className="clock-short">15:48</span>
          </div>

          {/* Reset Seed Database */}
          <button
            className="btn-secondary-sm"
            onClick={onResetData}
            disabled={isResetting}
            title="Reset database to original seed data"
            type="button"
          >
            <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
            <span className="btn-label-full">{isResetting ? 'Resetting...' : 'Reset Seed'}</span>
            <span className="btn-label-short">{isResetting ? '...' : 'Reset'}</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer open">
          <div className="mobile-tabs-grid">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`mobile-tab-btn ${isActive ? 'active' : ''} ${tab.isAgent ? 'tab-agent' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                  type="button"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.isAgent && (
                    <span className={`live-badge ${isActive ? 'active' : ''}`}>
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mobile-nav-footer">
            <div className="status-badge" style={{ display: 'inline-flex' }}>
              <span className="status-dot"></span>
              <Clock size={13} />
              <span>Fri Sep 4, 2026 · 15:48</span>
            </div>
            <button
              className="btn-secondary-sm"
              onClick={() => {
                onResetData();
                setMobileMenuOpen(false);
              }}
              disabled={isResetting}
              type="button"
            >
              <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
              <span>{isResetting ? 'Resetting...' : 'Reset Seed'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
