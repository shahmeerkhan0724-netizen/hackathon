import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Tag,
  Popconfirm,
  message,
  Space,
} from 'antd';
import { FiPlus, FiEdit2, FiTrash2, FiSliders, FiCalendar, FiBriefcase, FiLayers } from 'react-icons/fi';
import orgApi from '../../api/organization.api';
import { formatDate } from '../../utils/formatters';

export const OrganizationPage = () => {
  const [activeTab, setActiveTab] = useState('departments');

  // State
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('dept'); // dept, desg, leave, holiday
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [deptRes, desgRes, ltRes, holRes] = await Promise.all([
        orgApi.getDepartments(),
        orgApi.getDesignations(),
        orgApi.getLeaveTypes(),
        orgApi.getHolidays(),
      ]);
      setDepartments(deptRes?.data || []);
      setDesignations(desgRes?.data || []);
      setLeaveTypes(ltRes?.data || []);
      setHolidays(holRes?.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    form.resetFields();
    if (type === 'leave') {
      form.setFieldsValue({ daysPerYear: 10, isPaid: true, isUnlimited: false });
    }
    setModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    form.resetFields();
    if (type === 'dept') {
      form.setFieldsValue({ name: item.name, code: item.code, description: item.description, isActive: item.isActive });
    } else if (type === 'desg') {
      form.setFieldsValue({ title: item.title, department: item.department?._id || item.department, description: item.description, isActive: item.isActive });
    } else if (type === 'leave') {
      form.setFieldsValue({ name: item.name, code: item.code, daysPerYear: item.daysPerYear, isPaid: item.isPaid, isUnlimited: item.isUnlimited, description: item.description });
    } else if (type === 'holiday') {
      form.setFieldsValue({ title: item.title, date: item.date, description: item.description, isRecurring: item.isRecurring });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (modalType === 'dept') {
        if (editingItem) await orgApi.updateDepartment(editingItem._id, values);
        else await orgApi.createDepartment(values);
      } else if (modalType === 'desg') {
        if (editingItem) await orgApi.updateDesignation(editingItem._id, values);
        else await orgApi.createDesignation(values);
      } else if (modalType === 'leave') {
        if (editingItem) await orgApi.updateLeaveType(editingItem._id, values);
        else await orgApi.createLeaveType(values);
      } else if (modalType === 'holiday') {
        if (editingItem) await orgApi.updateHoliday(editingItem._id, values);
        else await orgApi.createHoliday(values);
      }
      message.success('Record saved successfully');
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      message.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'dept') await orgApi.deleteDepartment(id);
      else if (type === 'desg') await orgApi.deleteDesignation(id);
      else if (type === 'leave') await orgApi.deleteLeaveType(id);
      else if (type === 'holiday') await orgApi.deleteHoliday(id);
      message.success('Record deleted successfully');
      fetchAll();
    } catch (err) {
      message.error(err.message || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Structure</h1>
        <p className="text-xs text-slate-500 font-medium">
          Configure departments, designations, leave policies, and company calendar
        </p>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'departments',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs">
                  <FiLayers /> Departments ({departments.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Business units and organizational branches</span>
                    <Button
                      type="primary"
                      icon={<FiPlus className="w-3.5 h-3.5" />}
                      onClick={() => openCreateModal('dept')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg"
                    >
                      Add Department
                    </Button>
                  </div>
                  <Table
                    dataSource={departments}
                    rowKey="_id"
                    loading={loading}
                    size="small"
                    columns={[
                      { title: 'Code', dataIndex: 'code', key: 'code', render: (c) => <Tag color="blue">{c || '-'}</Tag> },
                      { title: 'Department Name', dataIndex: 'name', key: 'name', render: (n) => <span className="font-semibold text-slate-800">{n}</span> },
                      { title: 'Description', dataIndex: 'description', key: 'desc', render: (d) => <span className="text-xs text-slate-500">{d || '-'}</span> },
                      { title: 'Status', dataIndex: 'isActive', key: 'active', render: (a) => <Tag color={a ? 'success' : 'default'}>{a ? 'ACTIVE' : 'INACTIVE'}</Tag> },
                      {
                        title: 'Actions',
                        key: 'act',
                        align: 'right',
                        render: (_, record) => (
                          <Space>
                            <Button size="small" type="text" icon={<FiEdit2 />} onClick={() => openEditModal('dept', record)} />
                            <Popconfirm title="Delete Department" description="Ensure no employees are assigned first." onConfirm={() => handleDelete('dept', record._id)}>
                              <Button size="small" type="text" danger icon={<FiTrash2 />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'designations',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs">
                  <FiBriefcase /> Designations ({designations.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Job titles and roles across departments</span>
                    <Button
                      type="primary"
                      icon={<FiPlus className="w-3.5 h-3.5" />}
                      onClick={() => openCreateModal('desg')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg"
                    >
                      Add Designation
                    </Button>
                  </div>
                  <Table
                    dataSource={designations}
                    rowKey="_id"
                    loading={loading}
                    size="small"
                    columns={[
                      { title: 'Title', dataIndex: 'title', key: 'title', render: (t) => <span className="font-semibold text-slate-800">{t}</span> },
                      { title: 'Department', dataIndex: ['department', 'name'], key: 'dept', render: (d) => <span className="text-xs text-slate-600 font-medium">{d || 'All Departments'}</span> },
                      { title: 'Description', dataIndex: 'description', key: 'desc', render: (d) => <span className="text-xs text-slate-500">{d || '-'}</span> },
                      {
                        title: 'Actions',
                        key: 'act',
                        align: 'right',
                        render: (_, record) => (
                          <Space>
                            <Button size="small" type="text" icon={<FiEdit2 />} onClick={() => openEditModal('desg', record)} />
                            <Popconfirm title="Delete Designation" description="Are you sure you want to delete this designation?" onConfirm={() => handleDelete('desg', record._id)}>
                              <Button size="small" type="text" danger icon={<FiTrash2 />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'leaveTypes',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs">
                  <FiSliders /> Leave Policies ({leaveTypes.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Annual quotas and paid/unpaid leave definitions</span>
                    <Button
                      type="primary"
                      icon={<FiPlus className="w-3.5 h-3.5" />}
                      onClick={() => openCreateModal('leave')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg"
                    >
                      Add Leave Type
                    </Button>
                  </div>
                  <Table
                    dataSource={leaveTypes}
                    rowKey="_id"
                    loading={loading}
                    size="small"
                    columns={[
                      { title: 'Code', dataIndex: 'code', key: 'code', render: (c) => <Tag color="purple">{c}</Tag> },
                      { title: 'Name', dataIndex: 'name', key: 'name', render: (n) => <span className="font-semibold text-slate-800">{n}</span> },
                      {
                        title: 'Days / Year',
                        dataIndex: 'daysPerYear',
                        key: 'quota',
                        render: (q, r) => (
                          <span className="font-bold text-slate-800">{r.isUnlimited ? 'Unlimited' : `${q} working days`}</span>
                        ),
                      },
                      { title: 'Paid Status', dataIndex: 'isPaid', key: 'paid', render: (p) => <Tag color={p ? 'green' : 'orange'}>{p ? 'PAID' : 'UNPAID'}</Tag> },
                      {
                        title: 'Actions',
                        key: 'act',
                        align: 'right',
                        render: (_, record) => (
                          <Space>
                            <Button size="small" type="text" icon={<FiEdit2 />} onClick={() => openEditModal('leave', record)} />
                            <Popconfirm title="Delete Leave Type" description="Existing leave requests will block deletion." onConfirm={() => handleDelete('leave', record._id)}>
                              <Button size="small" type="text" danger icon={<FiTrash2 />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'holidays',
              label: (
                <span className="flex items-center gap-1.5 font-semibold text-xs">
                  <FiCalendar /> Public Holidays ({holidays.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Official company holidays excluded from working days</span>
                    <Button
                      type="primary"
                      icon={<FiPlus className="w-3.5 h-3.5" />}
                      onClick={() => openCreateModal('holiday')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg"
                    >
                      Add Holiday
                    </Button>
                  </div>
                  <Table
                    dataSource={holidays}
                    rowKey="_id"
                    loading={loading}
                    size="small"
                    columns={[
                      { title: 'Date', dataIndex: 'date', key: 'date', render: (d) => <span className="font-mono text-xs font-semibold text-indigo-700">{formatDate(d)} ({d})</span> },
                      { title: 'Holiday Title', dataIndex: 'title', key: 'title', render: (t) => <span className="font-semibold text-slate-800">{t}</span> },
                      { title: 'Description', dataIndex: 'description', key: 'desc', render: (d) => <span className="text-xs text-slate-500">{d || '-'}</span> },
                      {
                        title: 'Actions',
                        key: 'act',
                        align: 'right',
                        render: (_, record) => (
                          <Space>
                            <Button size="small" type="text" icon={<FiEdit2 />} onClick={() => openEditModal('holiday', record)} />
                            <Popconfirm title="Delete Holiday" onConfirm={() => handleDelete('holiday', record._id)}>
                              <Button size="small" type="text" danger icon={<FiTrash2 />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Dynamic Creation / Editing Modal */}
      <Modal
        title={
          <span className="font-bold text-slate-900 text-sm">
            {editingItem ? 'Edit Record' : 'Create New Record'}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-2">
          {modalType === 'dept' && (
            <>
              <Form.Item name="name" label="Department Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Finance" />
              </Form.Item>
              <Form.Item name="code" label="Department Code">
                <Input placeholder="e.g. FIN" />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}

          {modalType === 'desg' && (
            <>
              <Form.Item name="title" label="Designation Title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Senior Software Architect" />
              </Form.Item>
              <Form.Item name="department" label="Department">
                <Select
                  placeholder="Select department (optional)"
                  allowClear
                  options={departments.map((d) => ({ label: d.name, value: d._id }))}
                />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}

          {modalType === 'leave' && (
            <>
              <Form.Item name="name" label="Leave Type Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Paternity Leave" />
              </Form.Item>
              <Form.Item name="code" label="Code (Unique Uppercase)" rules={[{ required: true }]}>
                <Input placeholder="e.g. PATERNITY" disabled={Boolean(editingItem)} />
              </Form.Item>
              <Form.Item name="daysPerYear" label="Annual Working Days Quota">
                <InputNumber min={0} max={365} className="w-full" />
              </Form.Item>
              <Form.Item name="isPaid" label="Paid Leave" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isUnlimited" label="Unlimited Quota" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="description" label="Policy Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}

          {modalType === 'holiday' && (
            <>
              <Form.Item name="title" label="Holiday Title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Independence Day" />
              </Form.Item>
              <Form.Item name="date" label="Date (YYYY-MM-DD)" rules={[{ required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Format YYYY-MM-DD required' }]}>
                <Input placeholder="2026-08-14" />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              Save Record
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationPage;
