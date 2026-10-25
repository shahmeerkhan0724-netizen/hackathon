import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Pages
import SetupPage from '../pages/setup/SetupPage';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CompanySettingsPage from '../pages/admin/CompanySettingsPage';
import OrganizationPage from '../pages/admin/OrganizationPage';
import AuditLogPage from '../pages/admin/AuditLogPage';

import HRDashboard from '../pages/hr/HRDashboard';
import EmployeesPage from '../pages/hr/EmployeesPage';
import AttendanceBoardPage from '../pages/hr/AttendanceBoardPage';
import LeaveApprovalsPage from '../pages/hr/LeaveApprovalsPage';
import PayrollPage from '../pages/hr/PayrollPage';

import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import MyAttendancePage from '../pages/employee/MyAttendancePage';
import MyLeavesPage from '../pages/employee/MyLeavesPage';
import MyPayslipsPage from '../pages/employee/MyPayslipsPage';
import MyProfilePage from '../pages/employee/MyProfilePage';

import AnnouncementsPage from '../pages/shared/AnnouncementsPage';
import NotificationsPage from '../pages/shared/NotificationsPage';
import { NotFoundPage } from '../pages/shared/ErrorPages';

// Dynamic Index Redirector based on role
const RoleIndexRedirect = () => {
  const { role, isAuthenticated, isSetupCompleted } = useAuth();

  if (!isSetupCompleted) return <Navigate to="/setup" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'HR') return <Navigate to="/dashboard/hr" replace />;
  return <Navigate to="/dashboard/me" replace />;
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleIndexRedirect />} />

      {/* Authenticated Dashboard Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Shared Routes */}
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/admin/company" element={<CompanySettingsPage />} />
            <Route path="/admin/organization" element={<OrganizationPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </Route>

          {/* Admin & HR Shared Management Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />}>
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/hr/employees" element={<EmployeesPage />} />
            <Route path="/admin/attendance" element={<AttendanceBoardPage />} />
            <Route path="/hr/attendance" element={<AttendanceBoardPage />} />
            <Route path="/admin/payroll" element={<PayrollPage />} />
            <Route path="/hr/payroll" element={<PayrollPage />} />
          </Route>

          {/* HR Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/dashboard/hr" element={<HRDashboard />} />
            <Route path="/admin/leaves" element={<LeaveApprovalsPage />} />
            <Route path="/hr/leaves" element={<LeaveApprovalsPage />} />
          </Route>

          {/* Employee Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/dashboard/me" element={<EmployeeDashboard />} />
            <Route path="/attendance/me" element={<MyAttendancePage />} />
            <Route path="/leaves/me" element={<MyLeavesPage />} />
            <Route path="/payroll/me" element={<MyPayslipsPage />} />
            <Route path="/profile/me" element={<MyProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
