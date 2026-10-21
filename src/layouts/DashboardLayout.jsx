import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {LocationProvider} from '../context/LocationContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const {pathname}=useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainRef = useRef(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    const sidebar = document.getElementById('main-navigation');
    const previousFocus = document.activeElement;
    const main = mainRef.current;
    main?.setAttribute('inert', '');
    sidebar?.querySelector('button, a')?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') setSidebarOpen(false);
      if (event.key !== 'Tab') return;
      const controls = sidebar?.querySelectorAll('button, a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const media = window.matchMedia('(min-width: 1025px)');
    const closeOnDesktop = () => { if (media.matches) setSidebarOpen(false); };
    document.addEventListener('keydown', handleKey);
    media.addEventListener('change', closeOnDesktop);
    return () => {
      main?.removeAttribute('inert');
      document.removeEventListener('keydown', handleKey);
      media.removeEventListener('change', closeOnDesktop);
      previousFocus?.focus();
    };
  }, [sidebarOpen]);

  return (
    <div className="layout-container">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout-main" ref={mainRef}>
        <TopBar menuOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="layout-content">
          {pathname==='/admin-management' ? <Outlet /> : <LocationProvider><Outlet /></LocationProvider>}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
