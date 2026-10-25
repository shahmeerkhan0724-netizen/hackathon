import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Drawer,
  Form,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Alert,
  message,
  Space,
  Descriptions,
  Divider,
} from 'antd';
import {
  FiUsers,
  FiPlus,
  FiDownload,
  FiUpload,
  FiEdit2,
  FiEye,
  FiSearch,
  FiKey,
  FiCheck,
  FiFileText,
} from 'react-icons/fi';
import employeesApi from '../../api/employees.api';
import orgApi from '../../api/organization.api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export const EmployeesPage = () => {
  const { role } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // Selected Employee & Data
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employee360, setEmployee360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  // Temp Password Alert Modal
  const [tempPasswordModal, setTempPasswordModal] = useState({ open: false, password: '', email: '' });

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvReport, setCsvReport] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(statusFilter && { employmentStatus: statusFilter }),
      };
      const res = await employeesApi.getEmployees(params);
      setEmployees(res?.data?.items || []);
      setTotalItems(res?.data?.pagination?.totalItems || 0);
    } catch (err) {
      message.error(err.message || 'Failed to fetch employee directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgLookups = async () => {
    try {
      const [deptRes, desgRes] = await Promise.all([
        orgApi.getDepartments({ isActive: true }),
        orgApi.getDesignations({ isActive: true }),
      ]);
      setDepartments(deptRes?.data || []);
      setDesignations(desgRes?.data || []);
    } catch (e) {
      console.warn('Error fetching lookup data', e.message);
    }
  };

  useEffect(() => {
    fetchOrgLookups();
  }, []);

  useEffect(() => {
    fetchEmployees(1, pageSize);
  }, [search, departmentFilter, statusFilter]);

  const handleCreateFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : undefined,
      };

      const res = await employeesApi.createEmployee(payload);
      message.success('Employee created successfully');
      setCreateModalOpen(false);
      createForm.resetFields();

      // Show temporary password modal for HR
      if (res?.data?.temporaryPassword) {
        setTempPasswordModal({
          open: true,
          password: res.data.temporaryPassword,
          email: values.email,
        });
      }

      fetchEmployees();
    } catch (err) {
      message.error(err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (record) => {
    setSelectedEmployee(record);
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      address: record.address,
      department: record.department?._id || record.department,
      designation: record.designation?._id || record.designation,
      employmentStatus: record.employmentStatus,
      isActive: record.isActive,
    });
    setEditModalOpen(true);
  };

  const handleEditFinish = async (values) => {
    setSubmitting(true);
    try {
      await employeesApi.updateEmployee(selectedEmployee._id, values);
      message.success('Employee details updated');
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      message.error(err.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView360 = async (record) => {
    setSelectedEmployee(record);
    setProfileDrawerOpen(true);
    setLoading360(true);
    try {
      const res = await employeesApi.getEmployeeById(record._id);
      setEmployee360(res?.data || null);
    } catch (err) {
      message.error(err.message || 'Failed to load employee 360 profile');
    } finally {
      setLoading360(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      message.loading({ content: 'Generating CSV...', key: 'csv' });
      const blob = await employeesApi.exportEmployees();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_directory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success({ content: 'CSV downloaded successfully', key: 'csv' });
    } catch (err) {
      message.error({ content: err.message || 'Export failed', key: 'csv' });
    }
  };

  const handleRunCsvImport = async (dryRun = true) => {
    if (!csvText.trim()) {
      message.warning('Please paste or load CSV text content');
      return;
    }
    setCsvLoading(true);
    try {
      const res = await employeesApi.importEmployees(csvText, dryRun);
      setCsvReport(res?.data || null);
      if (!dryRun && res?.data?.errorCount === 0) {
        message.success(`Import complete: ${res.data.importedCount} employees imported`);
        setCsvModalOpen(false);
        fetchEmployees();
      }
    } catch (err) {
      message.error(err.message || 'CSV Import failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'employeeCode',
      key: 'code',
      render: (c) => <Tag color="blue" className="font-mono">{c}</Tag>,
    },
    {
      title: 'Employee Name',
      key: 'name',
      render: (_, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{r.fullName || `${r.firstName} ${r.lastName}`}</span>
          <span className="text-[11px] text-slate-500 block">{r.email}</span>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'dept',
      render: (d) => <span className="text-xs text-slate-700 font-medium">{d || '-'}</span>,
    },
    {
      title: 'Designation',
      dataIndex: ['designation', 'title'],
      key: 'desg',
      render: (d) => <span className="text-xs text-slate-600">{d || '-'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'employmentStatus',
      key: 'status',
      render: (s) => <Tag color={s === 'FULL_TIME' ? 'green' : 'orange'}>{s}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'act',
      render: (a) => <Tag color={a ? 'success' : 'default'}>{a ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="text"
            icon={<FiEye className="w-3.5 h-3.5" />}
            onClick={() => handleView360(record)}
            title="View 360 Profile"
          />
          <Button
            size="small"
            type="text"
            icon={<FiEdit2 className="w-3.5 h-3.5" />}
            onClick={() => handleEditClick(record)}
            title="Edit Employee"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage organization members, onboard talent, and review 360 profile snapshots
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            icon={<FiDownload className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
            className="text-xs font-semibold rounded-xl"
          >
            Export CSV
          </Button>

          {role === 'HR' && (
            <>
              <Button
                icon={<FiUpload className="w-3.5 h-3.5" />}
                onClick={() => {
                  setCsvText('');
                  setCsvReport(null);
                  setCsvModalOpen(true);
                }}
                className="text-xs font-semibold rounded-xl"
              >
                Import CSV
              </Button>
              <Button
                type="primary"
                icon={<FiPlus className="w-3.5 h-3.5" />}
                onClick={() => {
                  createForm.resetFields();
                  setCreateModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
              >
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Directory Table with Search & Filter */}
      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: 0 }}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50">
          <Input
            prefix={<FiSearch className="text-slate-400" />}
            placeholder="Search by name, email, or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 text-xs rounded-lg"
            allowClear
          />
          <Select
            placeholder="Filter Department"
            value={departmentFilter || undefined}
            onChange={(v) => setDepartmentFilter(v || '')}
            allowClear
            className="w-48 text-xs"
            options={departments.map((d) => ({ label: d.name, value: d._id }))}
          />
          <Select
            placeholder="Employment Status"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            className="w-44 text-xs"
            options={[
              { label: 'Full Time', value: 'FULL_TIME' },
              { label: 'Part Time', value: 'PART_TIME' },
              { label: 'Probation', value: 'PROBATION' },
              { label: 'Contract', value: 'CONTRACT' },
              { label: 'Intern', value: 'INTERN' },
            ]}
          />
        </div>

        <Table
          dataSource={employees}
          columns={columns}
          rowKey="_id"
          loading={loading}
          size="middle"
          pagination={{
            current: currentPage,
            pageSize,
            total: totalItems,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setCurrentPage(p);
              setPageSize(ps);
              fetchEmployees(p, ps);
            },
          }}
        />
      </Card>

      {/* Create Employee Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Register New Employee</span>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} className="pt-2">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Doe" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Work Email Address" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="john.doe@company.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="+92 300 1234567" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select placeholder="Select department" options={departments.map((d) => ({ label: d.name, value: d._id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                <Select placeholder="Select designation" options={designations.map((d) => ({ label: d.title, value: d._id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="basicSalary" label="Monthly Basic Salary (PKR)" rules={[{ required: true }]}>
                <InputNumber min={1000} className="w-full" placeholder="e.g. 100000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="employmentStatus" label="Employment Status" initialValue="FULL_TIME">
                <Select
                  options={[
                    { label: 'Full Time', value: 'FULL_TIME' },
                    { label: 'Part Time', value: 'PART_TIME' },
                    { label: 'Probation', value: 'PROBATION' },
                    { label: 'Contract', value: 'CONTRACT' },
                    { label: 'Intern', value: 'INTERN' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="employeeCode" label="Employee Code (Optional)">
                <Input placeholder="Leave blank to auto-generate (e.g. EMP0001)" />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            type="info"
            showIcon
            className="mb-4 text-xs"
            message="Temporary Login Account"
            description="A secure temporary password will be created automatically. You will be provided the temporary credential once to convey to the employee."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700 font-semibold">
              Create Employee & Account
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Temporary Password Announcement Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-700">
            <FiKey className="w-5 h-5" />
            <span className="font-bold">Temporary Account Password</span>
          </div>
        }
        open={tempPasswordModal.open}
        onOk={() => setTempPasswordModal({ open: false, password: '', email: '' })}
        onCancel={() => setTempPasswordModal({ open: false, password: '', email: '' })}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setTempPasswordModal({ open: false, password: '', email: '' })}
            className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            I have securely copied the password
          </Button>,
        ]}
      >
        <div className="py-3 space-y-3">
          <Alert
            type="warning"
            showIcon
            message="Share Credential Safely"
            description="This temporary password will NOT be displayed again. Please convey it to the employee. They will be forced to set their own password upon first login."
          />
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Employee Account:</span>
              <span className="text-sm font-semibold text-slate-800">{tempPasswordModal.email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Temporary Password:</span>
              <span className="text-base font-mono font-bold text-indigo-700 bg-white px-3 py-1 rounded border border-slate-300 inline-block mt-0.5 select-all">
                {tempPasswordModal.password}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Edit Employee Profile</span>}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditFinish} className="pt-2">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select options={departments.map((d) => ({ label: d.name, value: d._id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                <Select options={designations.map((d) => ({ label: d.title, value: d._id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="employmentStatus" label="Employment Status">
                <Select
                  options={[
                    { label: 'Full Time', value: 'FULL_TIME' },
                    { label: 'Part Time', value: 'PART_TIME' },
                    { label: 'Probation', value: 'PROBATION' },
                    { label: 'Contract', value: 'CONTRACT' },
                    { label: 'Intern', value: 'INTERN' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              Update Employee
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Employee 360 Drawer */}
      <Drawer
        title={<span className="font-bold text-slate-900 text-base">Employee 360 View</span>}
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        width={650}
      >
        {loading360 ? (
          <div className="p-8 text-center"><span className="text-slate-500">Loading profile data...</span></div>
        ) : employee360 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{employee360.profile?.fullName}</h3>
              <p className="text-xs text-slate-500">{employee360.profile?.email} • {employee360.profile?.employeeCode}</p>
            </div>

            <Descriptions title="Profile Details" bordered size="small" column={2}>
              <Descriptions.Item label="Department">{employee360.profile?.department?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Designation">{employee360.profile?.designation?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="Joining Date">{formatDate(employee360.profile?.joiningDate)}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color="blue">{employee360.profile?.employmentStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="Phone">{employee360.profile?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address">{employee360.profile?.address || '-'}</Descriptions.Item>
            </Descriptions>

            {employee360.salaryStructure && (
              <Descriptions title="Salary Structure (Monthly)" bordered size="small" column={2}>
                <Descriptions.Item label="Basic Salary">{formatCurrency(employee360.salaryStructure.basicSalary)}</Descriptions.Item>
                <Descriptions.Item label="HRA (40%)">{formatCurrency(employee360.salaryStructure.hra)}</Descriptions.Item>
                <Descriptions.Item label="Medical (10%)">{formatCurrency(employee360.salaryStructure.medicalAllowance)}</Descriptions.Item>
                <Descriptions.Item label="Gross Salary"><span className="font-bold text-emerald-600">{formatCurrency(employee360.salaryStructure.grossSalary)}</span></Descriptions.Item>
              </Descriptions>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Recent Attendance (Last 5 days)</h4>
              <Table
                dataSource={employee360.recentAttendance || []}
                rowKey="_id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'd' },
                  { title: 'Status', dataIndex: 'status', key: 's', render: (st) => <Tag color={st === 'PRESENT' ? 'success' : 'warning'}>{st}</Tag> },
                  { title: 'Hours', dataIndex: 'totalWorkMinutes', key: 'h', render: (m) => `${(m / 60).toFixed(1)} hrs` },
                ]}
              />
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* CSV Import Modal with Dry Run */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Bulk Import Employees (CSV)</span>}
        open={csvModalOpen}
        onCancel={() => setCsvModalOpen(false)}
        footer={null}
        width={720}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600">
            Paste CSV data with columns: <code className="bg-slate-100 p-1 rounded font-mono text-[11px]">employeeCode,firstName,lastName,email,phone,departmentCode,designationTitle,joiningDate,basicSalary</code>
          </p>

          <Input.TextArea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="employeeCode,firstName,lastName,email,phone,departmentCode,designationTitle,joiningDate,basicSalary&#10;EMP1001,John,Doe,johndoe@company.com,03001234567,ENG,Software Engineer,2026-01-15,120000"
            className="font-mono text-xs"
          />

          {csvReport && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span>Validation Result: {csvReport.validCount} valid rows, {csvReport.errorCount} error(s)</span>
                <Tag color={csvReport.errorCount === 0 ? 'success' : 'error'}>
                  {csvReport.errorCount === 0 ? 'READY FOR COMMIT' : 'VALIDATION FAILED'}
                </Tag>
              </div>

              {csvReport.errors && csvReport.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] text-rose-600 font-mono">
                  {csvReport.errors.map((err, idx) => (
                    <div key={idx} className="p-1 bg-rose-50 rounded">
                      Row {err.row} ({err.email || err.employeeCode}): {err.issues?.map((i) => i.reason).join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button onClick={() => handleRunCsvImport(true)} loading={csvLoading} className="font-semibold text-xs">
              Validate (Dry Run)
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setCsvModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => handleRunCsvImport(false)}
                disabled={!csvReport || csvReport.errorCount > 0}
                loading={csvLoading}
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs"
              >
                Commit Import
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
