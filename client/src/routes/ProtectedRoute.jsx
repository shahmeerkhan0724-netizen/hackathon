import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';
import { UnauthorizedPage } from '../pages/shared/ErrorPages';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, isSetupCompleted, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // If first-run setup is incomplete, force setup page
  if (!isSetupCompleted) {
    return <Navigate to="/setup" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is not allowed for this route, show 403 Forbidden screen
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
