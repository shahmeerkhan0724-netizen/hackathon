import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleBack = () => {
    if (role === 'ADMIN') navigate('/dashboard/admin');
    else if (role === 'HR') navigate('/dashboard/hr');
    else if (role === 'EMPLOYEE') navigate('/dashboard/me');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Result
        status="403"
        title="403 - Access Forbidden"
        subTitle="Sorry, you do not possess the required role permissions to access this screen."
        extra={
          <Button type="primary" onClick={handleBack} className="bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl">
            Return to Dashboard
          </Button>
        }
      />
    </div>
  );
};

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleBack = () => {
    if (role === 'ADMIN') navigate('/dashboard/admin');
    else if (role === 'HR') navigate('/dashboard/hr');
    else if (role === 'EMPLOYEE') navigate('/dashboard/me');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Result
        status="404"
        title="404 - Page Not Found"
        subTitle="The requested page does not exist or has been moved."
        extra={
          <Button type="primary" onClick={handleBack} className="bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl">
            Return to Dashboard
          </Button>
        }
      />
    </div>
  );
};

export default { UnauthorizedPage, NotFoundPage };
