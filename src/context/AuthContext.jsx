import React, { createContext, useState, useEffect } from 'react';
import { persistSession } from '../auth/session';

// The context and provider intentionally share this module for the small app shell.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // sessionStorage belongs to one browser tab. A manager and employee can
  // therefore work in separate tabs without replacing one another's login.
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [role, setRole] = useState(sessionStorage.getItem('role') || null);
  const [outletId, setOutletId] = useState(sessionStorage.getItem('outletId') || null);
  const [username, setUsername] = useState(sessionStorage.getItem('username') || null);
  const [empId, setEmpId] = useState(sessionStorage.getItem('empId') || null);
  const [empName, setEmpName] = useState(sessionStorage.getItem('empName') || null);

  useEffect(() => {
    // Keep the current tab's session in sync with state.
    if (token) {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      if (username) sessionStorage.setItem('username', username);
      if (outletId) {
        sessionStorage.setItem('outletId', outletId);
      } else {
        sessionStorage.removeItem('outletId');
      }
      if (empId) sessionStorage.setItem('empId', empId);
      if (empName) sessionStorage.setItem('empName', empName);
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('outletId');
      sessionStorage.removeItem('empId');
      sessionStorage.removeItem('empName');
    }
  }, [token, role, outletId, username, empId, empName]);

  const loginContext = (data) => {
    // Persist the session before navigation. Dashboard requests run immediately
    // after login and must be able to attach this tab's token on their first request.
    persistSession(sessionStorage, data);

    setToken(data.token);
    setRole(data.role);
    setUsername(data.username);
    setOutletId(data.outletId || null);
    setEmpId(data.empId || null);
    setEmpName(data.empName || null);
  };

  const logoutContext = () => {
    setToken(null);
    setRole(null);
    setUsername(null);
    setOutletId(null);
    setEmpId(null);
    setEmpName(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, outletId, username, empId, empName, login: loginContext, logout: logoutContext }}>
      {children}
    </AuthContext.Provider>
  );
};
