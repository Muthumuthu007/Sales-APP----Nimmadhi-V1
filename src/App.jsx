import Combos from './pages/Combos';
import FactoryPendingPayments from './pages/FactoryPendingPayments';
import OutletDashboard from './pages/OutletDashboard';
import AfterSales from './pages/AfterSales';
import {ProductMrpProvider} from './context/ProductMrpContext';
import {firstAdminPath} from './auth/adminAccess';
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import CreateUser from './pages/auth/CreateUser';
import ScopedAdminManagement from './pages/auth/ScopedAdminManagement';

// Role Pages
import Dashboard from './pages/Dashboard';
import FactoryManagement from './pages/FactoryManagement';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import LoadPlans from './pages/LoadPlans';
import Dispatch from './pages/Dispatch';
import DispatchPlans from './pages/DispatchPlans';
import OutletView from './pages/OutletView';
import GodownView from './pages/GodownView';
import Salary from './pages/Salary';
import Employees from './pages/Employees';
import Outlets from './pages/Outlets';
import Offers from './pages/Offers';
import ManagerAttendance from './pages/ManagerAttendance';

// Root Redirect component
const RootRedirect = () => {
  const { token, role, adminAccess } = useContext(AuthContext);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (role === 'MANAGER') {
    return <Navigate to={firstAdminPath(adminAccess)} replace />;
  } else if (role === 'GODOWN') {
    return <Navigate to="/godown" replace />;
  } else if (['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR','STALL'].includes(role)) {
    return <Navigate to="/employee" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ProductMrpProvider><BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/employee/login" element={<Navigate to="/login" replace />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<RootRedirect />} />
            
            {/* MANAGER ROUTES */}
            <Route path="pending-payments" element={<ProtectedRoute allowedRoles={['MANAGER']}><FactoryPendingPayments /></ProtectedRoute>} />
            <Route path="admin-management" element={<ProtectedRoute allowedRoles={['MANAGER']}><ScopedAdminManagement /></ProtectedRoute>} />
            <Route path="after-sales" element={<ProtectedRoute allowedRoles={['MANAGER']}><AfterSales /></ProtectedRoute>} />
            <Route path="factory-management" element={<ProtectedRoute allowedRoles={['MANAGER']}><FactoryManagement /></ProtectedRoute>} />
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="outlets/overview" element={<ProtectedRoute allowedRoles={['MANAGER']}><OutletDashboard/></ProtectedRoute>}/>
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
            <Route path="dispatch-plans" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <DispatchPlans />
              </ProtectedRoute>
            } />
            <Route path="salary" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Salary />
              </ProtectedRoute>
            } />
            <Route path="attendance" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerAttendance />
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
            <Route path="combos" element={<ProtectedRoute allowedRoles={['MANAGER']}><Combos/></ProtectedRoute>} />
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
              <ProtectedRoute allowedRoles={['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR','STALL']}>
                <OutletView />
              </ProtectedRoute>
            } />

            {/* EMPLOYEE ROUTES */}
            <Route path="employee" element={
              <ProtectedRoute allowedRoles={['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR','STALL']}>
                <OutletView />
              </ProtectedRoute>
            } />
            <Route path="godown" element={<ProtectedRoute allowedRoles={['GODOWN']}><GodownView /></ProtectedRoute>} />

            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter></ProductMrpProvider>
    </AuthProvider>
  );
}

export default App;
