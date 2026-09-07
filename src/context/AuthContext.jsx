import React, { createContext, useState, useEffect } from 'react';
import { persistSession } from '../auth/session';

// The context and provider intentionally share this module for the small app shell.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [outletId, setOutletId] = useState(localStorage.getItem('outletId') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);
  const [empId, setEmpId] = useState(localStorage.getItem('empId') || null);
  const [empName, setEmpName] = useState(localStorage.getItem('empName') || null);

  useEffect(() => {
    // Keep localStorage in sync with state
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (username) localStorage.setItem('username', username);
      if (outletId) {
        localStorage.setItem('outletId', outletId);
      } else {
        localStorage.removeItem('outletId');
      }
      if (empId) localStorage.setItem('empId', empId);
      if (empName) localStorage.setItem('empName', empName);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('outletId');
      localStorage.removeItem('empId');
      localStorage.removeItem('empName');
    }
  }, [token, role, outletId, username, empId, empName]);

  const loginContext = (data) => {
    // Persist the session before navigation. Dashboard requests run immediately
    // after login and must be able to attach this token on their first request.
    persistSession(localStorage, data);

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
