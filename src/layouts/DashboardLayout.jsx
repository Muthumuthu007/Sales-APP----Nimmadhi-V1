import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-main">
        <TopBar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
