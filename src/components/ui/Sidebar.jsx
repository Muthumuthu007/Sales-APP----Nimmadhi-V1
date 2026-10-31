import api from '../../api/axios';
import {canAccessAdminPath} from '../../auth/adminAccess';
import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, CalendarDays, X, Truck, CreditCard, Store, UserPlus, UsersRound, Gift, BadgeIndianRupee, ClipboardCheck, QrCode, Factory } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { role, adminAccess, outletId } = useContext(AuthContext);
  const location=useLocation();
  const [godownWorkspace,setGodownWorkspace]=useState(false);
  useEffect(()=>{if(role==='MANAGER' || role==='GODOWN')return;let alive=true;api.get('/outlet/workspace').then(data=>{if(alive)setGodownWorkspace(data.locationType==='GODOWN');}).catch(()=>{});return()=>{alive=false;};},[role]);

  const managerLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/factory-management', icon: <Factory size={20} />, label: 'Factory Management' },
    { to: '/pending-payments', icon: <CreditCard size={20} />, label: 'Pending Payments' },
    { to: '/after-sales', icon: <ClipboardCheck size={20} />, label: 'After-sales' },
    { to: '/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { to: '/load-plans', icon: <CalendarDays size={20} />, label: 'Load Plans' },
    { to: '/dispatch-plans', icon: <QrCode size={20} />, label: 'Dispatch Plans' },
    { to: '/dispatch', icon: <Truck size={20} />, label: 'Dispatch' },
    { to: '/salary', icon: <CreditCard size={20} />, label: 'Salary' },
    { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
    { to: '/outlets/overview', icon: <LayoutDashboard size={20} />, label: 'Outlet Dashboard' },
    { to: '/outlets', icon: <Store size={20} />, label: 'Outlets' },
    { to: '/combos', icon: <Gift size={20} />, label: 'Combos' },
    { to: '/complimentary-products', icon: <Gift size={20} />, label: 'Complimentary Products' },
    { to: '/discounts', icon: <BadgeIndianRupee size={20} />, label: 'Discounts' },
    { to: '/employees', icon: <UsersRound size={20} />, label: 'Employees' },
    { to: '/admin-management', icon: <UsersRound size={20} />, label: 'Admin Management' },
    { to: '/create-user', icon: <UserPlus size={20} />, label: 'Create User' },
  ];

  const modules=role==='STALL'?[['STOCK_IN','Stock In / Return',<Truck size={20}/>],['SALES','Sales Entry',<CreditCard size={20}/>],['CUSTOMER_DISPATCH','Dispatch',<Truck size={20}/>],['STOCK','Stock View',<Store size={20}/>],['REPORTS','Reports',<LayoutDashboard size={20}/>]]:[['ATTENDANCE','Attendance',<ClipboardCheck size={20}/>],['CREATE_ORDER','Create Order',<ShoppingCart size={20}/>],['MY_ORDERS','My Orders',<ShoppingCart size={20}/>],['STOCK','Stock View',<Store size={20}/>],['RECEIVE_STOCK','Receive Stock',<Truck size={20}/>],...(!godownWorkspace?[['SALES','Sales Entry',<CreditCard size={20}/>],...(String(outletId).toUpperCase().startsWith('NIM')?[['SALES_RECORDS','Sales Records',<ClipboardCheck size={20}/>],['CUSTOMER_DISPATCH','Dispatch',<Truck size={20}/>]]:[])]:[]),['REPORTS','Reports',<LayoutDashboard size={20}/>],...(godownWorkspace?[['ASSIGNED_DISPATCH','Dispatch Assigned Orders',<Truck size={20}/>],['PRODUCT_IN','Temporary Stocks',<Store size={20}/>],['SALES_OUT','Sales Out',<ShoppingCart size={20}/>]]:[]),...(!godownWorkspace?[['COMBOS','Combos',<Gift size={20}/>]]:[]),['AFTER_SALES','After-sales',<ClipboardCheck size={20}/>]];
  const employeeLinks=role==='GODOWN'?[{to:'/godown',icon:<Store size={20}/>,label:'Godown Operations'}]:modules.map(([module,label,icon])=>({to:`/employee?module=${module}`,module,label,icon}));


  const links = role === 'MANAGER' ? managerLinks.filter(link=>canAccessAdminPath(adminAccess,link.to)) : employeeLinks;

  return (
    <aside id="main-navigation" role={isOpen ? 'dialog' : undefined} aria-modal={isOpen ? true : undefined} aria-label="Main navigation" className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
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
            className={({ isActive }) => `nav-item ${(link.module ? location.pathname==='/employee' && (new URLSearchParams(location.search).get('module') || (role==='STALL'?'STOCK_IN':'ATTENDANCE'))===link.module : isActive) ? 'active' : ''}`}
            end={link.to === '/' || link.to === '/outlets'}
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
