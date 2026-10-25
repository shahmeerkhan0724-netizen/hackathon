import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, message, Alert, Spin } from 'antd';
import { FiSave, FiSettings, FiClock, FiMapPin } from 'react-icons/fi';
import companyApi from '../../api/company.api';

export const CompanySettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await companyApi.getCompany();
      const comp = res?.data;
      setCompany(comp);
      form.setFieldsValue({
        name: comp?.name,
        legalName: comp?.legalName,
        email: comp?.email,
        phone: comp?.phone,
        address: comp?.address,
        officeStartTime: comp?.settings?.officeStartTime || '09:00',
        gracePeriodMinutes: comp?.settings?.gracePeriodMinutes ?? 15,
        halfDayHours: comp?.settings?.halfDayHours ?? 5,
        weekendDays: comp?.settings?.weekendDays || [0, 6],
        geofenceRadius: comp?.settings?.geofence?.radiusMeters || 500,
      });
    } catch (err) {
      message.error(err.message || 'Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        legalName: values.legalName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        settings: {
          officeStartTime: values.officeStartTime,
          gracePeriodMinutes: Number(values.gracePeriodMinutes),
          halfDayHours: Number(values.halfDayHours),
          weekendDays: values.weekendDays,
          geofence: {
            radiusMeters: Number(values.geofenceRadius),
          },
        },
      };

      await companyApi.updateCompanySettings(payload);
      message.success('Company settings updated successfully');
      fetchSettings();
    } catch (err) {
      message.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Configuration</h1>
        <p className="text-xs text-slate-500 font-medium">
          Manage enterprise details, working hours, grace periods, and attendance rules
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        {/* Profile Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiSettings className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Organization Profile</span>
            </div>
          }
          className="border border-slate-200 rounded-xl shadow-xs mb-6"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true, message: 'Company name is required' }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="legalName" label="Legal / Registered Name">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Official Contact Email">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="Official Phone">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Headquarters Address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Working Hours & Attendance Rules */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiClock className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Working Hours & Attendance Policy</span>
            </div>
          }
          className="border border-slate-200 rounded-xl shadow-xs mb-6"
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="officeStartTime"
                label="Official Start Time (HH:MM)"
                rules={[{ required: true }]}
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
                label="Half-Day Threshold (Hours)"
                rules={[{ required: true }]}
              >
                <Input type="number" min={1} max={12} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name="weekendDays" label="Configured Weekend Days">
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
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="geofenceRadius" label="Geofence Radius (Meters)">
                <Input type="number" min={50} max={10000} size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-semibold shadow-sm flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" /> Save Configuration
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CompanySettingsPage;
