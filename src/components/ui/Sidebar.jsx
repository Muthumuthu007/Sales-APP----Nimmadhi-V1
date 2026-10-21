import {canAccessAdminPath} from '../../auth/adminAccess';
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, CalendarDays, X, Truck, CreditCard, Store, UserPlus, UsersRound, Gift, BadgeIndianRupee, ClipboardCheck, QrCode, Factory } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { role, adminAccess } = useContext(AuthContext);

  const managerLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/factory-management', icon: <Factory size={20} />, label: 'Factory Management' },
    { to: '/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { to: '/load-plans', icon: <CalendarDays size={20} />, label: 'Load Plans' },
    { to: '/dispatch-plans', icon: <QrCode size={20} />, label: 'Dispatch Plans' },
    { to: '/dispatch', icon: <Truck size={20} />, label: 'Dispatch' },
    { to: '/salary', icon: <CreditCard size={20} />, label: 'Salary' },
    { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
    { to: '/outlets', icon: <Store size={20} />, label: 'Outlets' },
    { to: '/complimentary-products', icon: <Gift size={20} />, label: 'Complimentary Products' },
    { to: '/discounts', icon: <BadgeIndianRupee size={20} />, label: 'Discounts' },
    { to: '/employees', icon: <UsersRound size={20} />, label: 'Employees' },
    { to: '/admin-management', icon: <UsersRound size={20} />, label: 'Admin Management' },
    { to: '/create-user', icon: <UserPlus size={20} />, label: 'Create User' },
  ];

  const employeeLinks = [
    { to: '/employee', icon: <Store size={20} />, label: 'Outlet Operations' },
  ];

  const links = role === 'MANAGER' ? managerLinks.filter(link=>canAccessAdminPath(adminAccess,link.to)) : employeeLinks;

  return (
    <aside id="main-navigation" aria-label="Main navigation" className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close navigation menu"><X size={22}/></button>
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
