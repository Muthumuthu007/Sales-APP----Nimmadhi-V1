import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import CreateUser from './pages/auth/CreateUser';

// Role Pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import LoadPlans from './pages/LoadPlans';
import Dispatch from './pages/Dispatch';
import OutletView from './pages/OutletView';
import Salary from './pages/Salary';
import Employees from './pages/Employees';
import Outlets from './pages/Outlets';
import Offers from './pages/Offers';

// Root Redirect component
const RootRedirect = () => {
  const { token, role } = useContext(AuthContext);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (role === 'MANAGER') {
    return <Navigate to="/dashboard" replace />;
  } else if (['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR'].includes(role)) {
    return <Navigate to="/employee" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/employee/login" element={<Navigate to="/login" replace />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<RootRedirect />} />
            
            {/* MANAGER ROUTES */}
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="orders" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="orders/:id" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="load-plans" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <LoadPlans />
              </ProtectedRoute>
            } />
            <Route path="dispatch" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Dispatch />
              </ProtectedRoute>
            } />
            <Route path="salary" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Salary />
              </ProtectedRoute>
            } />
            <Route path="create-user" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <CreateUser />
              </ProtectedRoute>
            } />
            <Route path="employees" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="outlets" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Outlets />
              </ProtectedRoute>
            } />
            <Route path="complimentary-products" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Offers ruleType="COMPLIMENTARY" />
              </ProtectedRoute>
            } />
            <Route path="discounts" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Offers ruleType="DISCOUNT" />
              </ProtectedRoute>
            } />

            {/* OUTLET ROUTES */}
            <Route path="outlet" element={
              <ProtectedRoute allowedRoles={['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR']}>
                <OutletView />
              </ProtectedRoute>
            } />

            {/* EMPLOYEE ROUTES */}
            <Route path="employee" element={
              <ProtectedRoute allowedRoles={['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR']}>
                <OutletView />
              </ProtectedRoute>
            } />

            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
