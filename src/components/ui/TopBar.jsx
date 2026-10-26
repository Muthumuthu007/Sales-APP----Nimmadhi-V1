import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './TopBar.css';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onMenuClick, menuOpen = false }) => {
  const { adminAccess, role, logout, username, outletId, outletName, empId, empName } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Modules remain available without reserving workspace for a sidebar. */}
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          <Menu size={22} /><span className="modules-menu-label">Modules</span>
        </button>
        <h3 className="page-title">Management Dashboard</h3>
      </div>
      <div className="topbar-right">
        <button className="role-switch" aria-label="Logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} />
          <span className="logout-label">Logout</span>
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge-dot"></span>
        </button>
        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{empName || username || 'System User'}</span>
            <span className="user-role">
              {role === 'MANAGER'
                ? (adminAccess?.restricted ? 'Restricted Admin' : 'Main Admin')
                : (role === 'EMPLOYEE'
                    ? `Employee ID: ${empId || ''}`
                    : (outletId ? `${outletName || 'Outlet'} (${outletId})` : 'Outlet User'))}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
