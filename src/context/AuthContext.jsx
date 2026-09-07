import React, { createContext, useState, useEffect } from 'react';

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
    setToken(data.token);
    setRole(data.role);
    setUsername(data.username);
    if (data.outletId) {
      setOutletId(data.outletId);
    }
    if (data.empId) {
      setEmpId(data.empId);
    }
    if (data.empName) {
      setEmpName(data.empName);
    }
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
