import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, Select, Alert, message, Steps } from 'antd';
import { useNavigate, Link } from 'react-router';
import { FiBriefcase, FiUser, FiSettings, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import authApi from '../../api/auth.api';
import { useAuth } from '../../contexts/AuthContext';

export const SetupPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { checkAuthAndSetup } = useAuth();

  useEffect(() => {
    const verifyStatus = async () => {
      try {
        const res = await authApi.getSetupStatus();
        if (res?.data?.isInitialized) {
          setAlreadySetup(true);
        }
      } catch (err) {
        console.warn('Status check failed:', err.message);
      } finally {
        setCheckingStatus(false);
      }
    };
    verifyStatus();
  }, []);

  const handleFinish = async (values) => {
    if (values.adminPassword !== values.confirmPassword) {
      setErrorMsg('Admin password and confirmation do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        companyName: values.companyName,
        legalName: values.legalName || values.companyName,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
        officeStartTime: values.officeStartTime || '09:00',
        gracePeriodMinutes: Number(values.gracePeriodMinutes) || 15,
        halfDayHours: Number(values.halfDayHours) || 5,
        weekendDays: values.weekendDays || [0, 6],
      };

      const res = await authApi.initializeSetup(payload);

      if (res?.data?.token) {
        localStorage.setItem('hcm_token', res.data.token);
        message.success('Company & Administrator account initialized successfully!');
        await checkAuthAndSetup();
        navigate('/dashboard/admin');
      } else {
        message.success('Setup completed! Please log in with your Admin credentials.');
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize setup. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Checking system initialization status...</p>
        </div>
      </div>
    );
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-slate-200 shadow-md rounded-2xl p-4 text-center">
          <FiCheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">System Already Initialized</h2>
          <p className="text-sm text-slate-500 mb-6">
            HCM Lite has already been configured with a company profile and administrator account.
          </p>
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm font-semibold rounded-xl"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/20 mb-3">
            H
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">HCM Lite First-Run Setup</h1>
          <p className="text-sm text-indigo-200 mt-2">
            Configure your enterprise profile, working hours, and initial Administrator credentials
          </p>
        </div>

        <Card className="border-0 shadow-2xl rounded-2xl bg-white overflow-hidden p-2 sm:p-6">
          <Steps
            current={currentStep}
            className="mb-8"
            items={[
              { title: 'Company Profile', icon: <FiBriefcase /> },
              { title: 'Admin Account', icon: <FiUser /> },
              { title: 'Work Settings', icon: <FiSettings /> },
            ]}
          />

          {errorMsg && <Alert type="error" showIcon message={errorMsg} className="mb-6 rounded-xl" />}

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              companyName: 'Acme Enterprise',
              officeStartTime: '09:00',
              gracePeriodMinutes: 15,
              halfDayHours: 5,
              weekendDays: [0, 6],
            }}
            onFinish={handleFinish}
          >
            {/* Step 0: Company Info */}
            <div className={currentStep === 0 ? 'block' : 'hidden'}>
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                1. Company Information
              </h3>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[{ required: true, message: 'Company name is required' }]}
                  >
                    <Input placeholder="e.g. Acme Technologies Ltd" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="legalName" label="Legal / Registered Name">
                    <Input placeholder="e.g. Acme Technologies Global Inc." size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end pt-4">
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      await form.validateFields(['companyName']);
                      setCurrentStep(1);
                    } catch {}
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-semibold flex items-center gap-2"
                >
                  Continue to Admin Account <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Step 1: Admin Account */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                2. Master Administrator Credentials
              </h3>
              <Form.Item
                name="adminEmail"
                label="Admin Email Address"
                rules={[
                  { required: true, message: 'Admin email is required' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input placeholder="admin@company.com" size="large" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="adminPassword"
                    label="Admin Password"
                    rules={[
                      { required: true, message: 'Password is required' },
                      { min: 8, message: 'Minimum 8 characters' },
                    ]}
                  >
                    <Input.Password placeholder="At least 8 characters" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    rules={[{ required: true, message: 'Please confirm password' }]}
                  >
                    <Input.Password placeholder="Re-enter password" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setCurrentStep(0)} className="h-11 px-6 rounded-xl">
                  Back
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      await form.validateFields(['adminEmail', 'adminPassword', 'confirmPassword']);
                      setCurrentStep(2);
                    } catch {}
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-semibold flex items-center gap-2"
                >
                  Continue to Settings <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Step 2: Working Hours & Settings */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                3. Working Hours & Defaults
              </h3>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="officeStartTime"
                    label="Office Start Time (HH:MM)"
                    rules={[{ required: true, message: 'Start time required' }]}
                  >
                    <Input placeholder="09:00" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="gracePeriodMinutes"
                    label="Grace Period (Minutes)"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" min={0} max={120} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="halfDayHours"
                    label="Half-Day Duration (Hours)"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" min={1} max={12} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="weekendDays" label="Weekend Days">
                <Select
                  mode="multiple"
                  size="large"
                  options={[
                    { label: 'Sunday', value: 0 },
                    { label: 'Monday', value: 1 },
                    { label: 'Tuesday', value: 2 },
                    { label: 'Wednesday', value: 3 },
                    { label: 'Thursday', value: 4 },
                    { label: 'Friday', value: 5 },
                    { label: 'Saturday', value: 6 },
                  ]}
                />
              </Form.Item>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setCurrentStep(1)} className="h-11 px-6 rounded-xl">
                  Back
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Complete Setup & Initialize
                </Button>
              </div>
            </div>
          </Form>
        </Card>

        <p className="text-center text-xs text-indigo-300 mt-6">
          Already configured?{' '}
          <Link to="/login" className="text-white font-semibold underline hover:text-indigo-200">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
