import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {LocationProvider} from '../context/LocationContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="layout-main">
        <TopBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="layout-content">
          <LocationProvider><Outlet /></LocationProvider>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
