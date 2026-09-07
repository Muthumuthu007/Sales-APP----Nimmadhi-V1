import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, CalendarDays, Truck, PackageX, Users, Clock, CreditCard, Store, UserPlus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useContext(AuthContext);

  const managerLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { to: '/load-plans', icon: <CalendarDays size={20} />, label: 'Load Plans' },
    { to: '/dispatch', icon: <Truck size={20} />, label: 'Dispatch' },
    { to: '/salary', icon: <CreditCard size={20} />, label: 'Salary' },
    { to: '/create-user', icon: <UserPlus size={20} />, label: 'Create User' },
  ];

  const outletLinks = [
    { to: '/outlet', icon: <Store size={20} />, label: 'Outlet View' },
  ];

  const employeeLinks = [
    { to: '/employee/attendance', icon: <Clock size={20} />, label: 'Mark Attendance' },
  ];

  const links = role === 'MANAGER' ? managerLinks : (role === 'EMPLOYEE' ? employeeLinks : outletLinks);

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">✨</div>
        <div className="logo-text-group">
          <h2>NIMMADHI</h2>
          <span className="logo-sub">MATTRESS</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={link.to === '/'}
            onClick={onClose}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
