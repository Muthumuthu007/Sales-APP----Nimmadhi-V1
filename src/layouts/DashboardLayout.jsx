import {AuthContext} from '../context/AuthContext';
import {isReadOnlyAdmin} from '../auth/adminAccess';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {LocationProvider} from '../context/LocationContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const {pathname}=useLocation();
  const {adminAccess}=useContext(AuthContext);
  const viewOnly=isReadOnlyAdmin(adminAccess);
  const [menuMode,setMenuMode]=useState('');
  const sidebarOpen=Boolean(menuMode),menuPinned=menuMode==='pinned';
  const closeTimer=useRef(null),hoverSuppressed=useRef(false);
  const cancelHoverClose=()=>{clearTimeout(closeTimer.current);};
  const closeMenu=()=>{cancelHoverClose();hoverSuppressed.current=true;setMenuMode('');};
  const openOnHover=event=>{if(hoverSuppressed.current || event.pointerType!=='mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;cancelHoverClose();setMenuMode(current=>current || 'hover');};
  const leaveHover=()=>{cancelHoverClose();closeTimer.current=setTimeout(()=>setMenuMode(current=>current==='hover'?'':current),200);};
  const toggleMenu=()=>{cancelHoverClose();setMenuMode(current=>{if(current==='pinned'){hoverSuppressed.current=true;return '';}return 'pinned';});};
  useEffect(()=>{const resetHover=event=>{if(!event.target.closest?.('.hamburger-btn'))hoverSuppressed.current=false;};document.addEventListener('pointermove',resetHover);return()=>{clearTimeout(closeTimer.current);document.removeEventListener('pointermove',resetHover);};},[]);

  const mainRef = useRef(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    const sidebar = document.getElementById('main-navigation');
    const previousFocus = document.activeElement;
    const main = mainRef.current;
    if(menuPinned){main?.setAttribute('inert','');sidebar?.querySelector('button, a')?.focus();}
    const handleKey = event => {
      if (event.key === 'Escape') {clearTimeout(closeTimer.current);hoverSuppressed.current=true;setMenuMode('');}
      if (!menuPinned || event.key !== 'Tab') return;
      const controls = sidebar?.querySelectorAll('button, a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      main?.removeAttribute('inert');
      document.removeEventListener('keydown', handleKey);
      if(menuPinned)previousFocus?.focus();
    };
  }, [sidebarOpen,menuPinned]);

  return (
    <div className="layout-container">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className={`sidebar-backdrop${menuPinned?'':' sidebar-backdrop--hover'}`}
          onClick={closeMenu}
        />
      )}
      <Sidebar isOpen={sidebarOpen} modal={menuPinned} onClose={closeMenu} onPointerEnter={cancelHoverClose} onPointerLeave={leaveHover} />
      <div className="layout-main" ref={mainRef}>
        <TopBar menuOpen={sidebarOpen} onMenuClick={toggleMenu} onMenuPointerEnter={openOnHover} onMenuPointerLeave={leaveHover} />
        <main className="layout-content">
          {viewOnly && <p role="status" style={{padding:'0.75rem 1rem',border:'1px solid var(--color-primary)',borderRadius:'0.75rem'}}>View-only access — you can view your selected modules and reports. Changes, approvals and dispatches are disabled.</p>}
          {pathname==='/admin-management' ? <Outlet /> : <LocationProvider><Outlet /></LocationProvider>}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
