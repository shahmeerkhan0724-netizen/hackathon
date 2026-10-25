import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { useNavigate, Link } from 'react-router';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import authApi from '../../api/auth.api';

export const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to role dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'ADMIN') navigate('/dashboard/admin', { replace: true });
      else if (role === 'HR') navigate('/dashboard/hr', { replace: true });
      else navigate('/dashboard/me', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const loggedUser = await login(values.email, values.password);
      message.success('Welcome back!');

      if (loggedUser.role === 'ADMIN') {
        navigate('/dashboard/admin');
      } else if (loggedUser.role === 'HR') {
        navigate('/dashboard/hr');
      } else {
        navigate('/dashboard/me');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur backdrop */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 mb-3">
            H
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to HCM Lite</h1>
          <p className="text-xs text-slate-400 mt-1">Human Capital Management & AI Work Assistant</p>
        </div>

        <Card className="border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90 backdrop-blur-md p-2 sm:p-6">
          {errorMsg && (
            <Alert
              type="error"
              showIcon
              message={errorMsg}
              className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/40 text-rose-200 text-xs"
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
            <Form.Item
              name="email"
              label={<span className="text-xs font-semibold text-slate-300">Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input
                prefix={<FiMail className="text-slate-400 w-4 h-4 mr-1" />}
                placeholder="name@company.com"
                size="large"
                className="rounded-xl bg-slate-950 border-slate-800 text-white placeholder-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-xs font-semibold text-slate-300">Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<FiLock className="text-slate-400 w-4 h-4 mr-1" />}
                placeholder="Enter password"
                size="large"
                className="rounded-xl bg-slate-950 border-slate-800 text-white placeholder-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm font-semibold rounded-xl mt-2 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Sign In <FiArrowRight className="w-4 h-4" />
            </Button>
          </Form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FiShield className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 256-bit Encrypted</span>
            </div>
            <Link to="/setup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              System Setup
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
