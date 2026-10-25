import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Descriptions, Tag, message, Spin } from 'antd';
import { FiUser, FiSave, FiLock, FiPhone, FiHome, FiShield } from 'react-icons/fi';
import employeesApi from '../../api/employees.api';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const MyProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getMyProfile();
      const p = res?.data?.profile;
      setProfileData(res?.data);

      form.setFieldsValue({
        phone: p?.phone,
        address: p?.address,
        bankAccountTitle: p?.bankDetails?.accountTitle,
        bankAccountNumber: p?.bankDetails?.accountNumber,
        bankName: p?.bankDetails?.bankName,
        bankIban: p?.bankDetails?.iban,
        emergencyName: p?.emergencyContact?.name,
        emergencyRelationship: p?.emergencyContact?.relationship,
        emergencyPhone: p?.emergencyContact?.phone,
      });
    } catch (err) {
      message.error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        phone: values.phone,
        address: values.address,
        bankDetails: {
          accountTitle: values.bankAccountTitle,
          accountNumber: values.bankAccountNumber,
          bankName: values.bankName,
          iban: values.bankIban,
        },
        emergencyContact: {
          name: values.emergencyName,
          relationship: values.emergencyRelationship,
          phone: values.emergencyPhone,
        },
      };

      await employeesApi.updateSelfProfile(payload);
      message.success('Contact and personal profile updated successfully');
      fetchProfile();
    } catch (err) {
      message.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Spin size="large" />
      </div>
    );
  }

  const p = profileData?.profile || {};
  const salary = profileData?.salaryStructure || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile 360</h1>
        <p className="text-xs text-slate-500 font-medium">
          View official employment information and keep your contact and bank details updated
        </p>
      </div>

      {/* Official Employment Records (Read-Only) */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiShield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Official Employment Snapshot</span>
          </div>
        }
        className="border border-slate-200 rounded-xl shadow-xs"
      >
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Full Name"><span className="font-semibold">{p.fullName}</span></Descriptions.Item>
          <Descriptions.Item label="Employee Code"><Tag color="blue">{p.employeeCode}</Tag></Descriptions.Item>
          <Descriptions.Item label="Email Address">{p.email}</Descriptions.Item>
          <Descriptions.Item label="Department">{p.department?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Designation">{p.designation?.title || '-'}</Descriptions.Item>
          <Descriptions.Item label="Joining Date">{formatDate(p.joiningDate)}</Descriptions.Item>
          <Descriptions.Item label="Employment Status"><Tag color="green">{p.employmentStatus}</Tag></Descriptions.Item>
          <Descriptions.Item label="Account Status"><Tag color="success">ACTIVE</Tag></Descriptions.Item>
        </Descriptions>

        {salary && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">My Base Salary Structure</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Basic Salary</span>
                <span className="font-bold text-xs text-slate-800">{formatCurrency(salary.basicSalary)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">HRA (40%)</span>
                <span className="font-bold text-xs text-slate-800">{formatCurrency(salary.hra)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Medical (10%)</span>
                <span className="font-bold text-xs text-slate-800">{formatCurrency(salary.medicalAllowance)}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-600 block font-medium">Gross Salary</span>
                <span className="font-black text-xs text-emerald-800">{formatCurrency(salary.grossSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Editable Contact & Personal Info Form */}
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiPhone className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Contact & Banking Details (Self-Service)</span>
            </div>
          }
          className="border border-slate-200 rounded-xl shadow-xs mb-6"
        >
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Contact & Address</h4>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Mobile Phone">
                <Input placeholder="+92 300 1234567" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="address" label="Residential Address">
                <Input placeholder="Street, City, Postal Code" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-4 mb-3">2. Salary Disbursement Bank Account</h4>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="bankName" label="Bank Name">
                <Input placeholder="e.g. Meezan Bank / HBL" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bankAccountTitle" label="Account Title">
                <Input placeholder="e.g. John Doe" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bankAccountNumber" label="Account Number">
                <Input placeholder="Account number" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bankIban" label="IBAN">
                <Input placeholder="PK00MEZN000..." size="large" />
              </Form.Item>
            </Col>
          </Row>

          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-4 mb-3">3. Emergency Contact</h4>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="emergencyName" label="Contact Name">
                <Input placeholder="e.g. Jane Doe" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="emergencyRelationship" label="Relationship">
                <Input placeholder="e.g. Spouse / Sibling" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="emergencyPhone" label="Emergency Phone">
                <Input placeholder="+92 300 7654321" size="large" />
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
            <FiSave className="w-4 h-4" /> Save Profile Details
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default MyProfilePage;
