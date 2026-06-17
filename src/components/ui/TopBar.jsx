import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './TopBar.css';
import { User, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { role, logout, username, outletId, empId, empName } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h3 className="page-title">Management Dashboard</h3>
      </div>
      <div className="topbar-right">
        <button className="role-switch" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
        <button className="icon-btn">
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
                ? 'Factory Manager' 
                : (role === 'EMPLOYEE' 
                    ? `Employee ID: ${empId || ''}` 
                    : (outletId ? `Outlet ID: ${outletId}` : 'Outlet User'))}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
