import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role not allowed. Fallback based on their role
    if (role === 'MANAGER') {
      return <Navigate to="/dashboard" replace />;
    } else if (role === 'EMPLOYEE') {
      return <Navigate to="/employee/attendance" replace />;
    } else {
      return <Navigate to="/outlet" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
