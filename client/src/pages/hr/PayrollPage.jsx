import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Drawer,
  Form,
  Select,
  Input,
  Popconfirm,
  message,
  Space,
  Descriptions,
} from 'antd';
import {
  FiDollarSign,
  FiPlus,
  FiEye,
  FiDownload,
  FiCheckCircle,
  FiLock,
  FiRefreshCw,
} from 'react-icons/fi';
import payrollApi from '../../api/payroll.api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export const PayrollPage = () => {
  const { role } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Draft Modal
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftForm] = Form.useForm();
  const [creatingDraft, setCreatingDraft] = useState(false);

  // Run Details Drawer
  const [selectedRun, setSelectedRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Finalization state
  const [finalizing, setFinalizing] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getPayrollRuns();
      setRuns(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch payroll runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleCreateDraft = async (values) => {
    setCreatingDraft(true);
    try {
      await payrollApi.createPayrollRun({
        year: Number(values.year),
        month: Number(values.month),
        notes: values.notes || '',
      });
      message.success('Monthly payroll draft generated successfully');
      setDraftModalOpen(false);
      draftForm.resetFields();
      fetchRuns();
    } catch (err) {
      message.error(err.message || 'Failed to generate payroll draft');
    } finally {
      setCreatingDraft(false);
    }
  };

  const handleOpenDetails = async (run) => {
    setSelectedRun(run);
    setDetailsDrawerOpen(true);
    setLoadingDetails(true);
    try {
      const res = await payrollApi.getPayrollRunById(run._id);
      setSelectedRun(res?.data?.payrollRun || run);
      setPayslips(res?.data?.payslips || []);
    } catch (err) {
      message.error(err.message || 'Failed to load payroll run line items');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFinalize = async (runId) => {
    setFinalizing(true);
    try {
      await payrollApi.finalizePayrollRun(runId);
      message.success('Payroll cycle finalized and payslips officially issued!');
      fetchRuns();
      if (selectedRun?._id === runId) {
        handleOpenDetails({ ...selectedRun, status: 'FINALIZED' });
      }
    } catch (err) {
      message.error(err.message || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownloadPdf = async (payslipId, empCode) => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      const blob = await payrollApi.downloadPayslipPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${empCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success({ content: 'PDF downloaded successfully', key: 'pdf' });
    } catch (err) {
      message.error({ content: err.message || 'Failed to download PDF', key: 'pdf' });
    }
  };

  const columns = [
    {
      title: 'Payroll Cycle',
      key: 'cycle',
      render: (_, r) => (
        <span className="font-bold text-slate-900 text-xs">
          {r.year} - Month {String(r.month).padStart(2, '0')}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'st',
      render: (s) => <StatusBadge status={s} />,
    },
    {
      title: 'Staff Count',
      dataIndex: 'employeeCount',
      key: 'count',
      align: 'center',
      render: (c) => <span className="font-semibold text-xs">{c} employees</span>,
    },
    {
      title: 'Gross Total',
      dataIndex: 'totalGrossSalary',
      key: 'gross',
      render: (g) => <span className="text-xs font-medium text-slate-700">{formatCurrency(g)}</span>,
    },
    {
      title: 'Income Tax',
      dataIndex: 'totalTax',
      key: 'tax',
      render: (t) => <span className="text-xs font-medium text-rose-600">{formatCurrency(t)}</span>,
    },
    {
      title: 'Net Salary Total',
      dataIndex: 'totalNetSalary',
      key: 'net',
      render: (n) => <span className="font-bold text-xs text-emerald-600">{formatCurrency(n)}</span>,
    },
    {
      title: 'Actions',
      key: 'act',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<FiEye className="w-3.5 h-3.5" />}
            onClick={() => handleOpenDetails(record)}
            className="text-xs font-semibold rounded-lg"
          >
            Review Lines
          </Button>

          {record.status === 'DRAFT' && role === 'ADMIN' && (
            <Popconfirm
              title="Finalize Payroll Run"
              description="Finalized runs are permanent and immutable. Employees will be notified immediately."
              onConfirm={() => handleFinalize(record._id)}
              okText="Finalize Cycle"
              okButtonProps={{ danger: true, loading: finalizing }}
            >
              <Button size="small" type="primary" className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded-lg">
                Finalize
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Prepare monthly drafts, calculate progressive income tax, and execute cycle finalization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />} onClick={fetchRuns} className="rounded-xl text-xs font-semibold">
            Refresh
          </Button>

          {role === 'HR' && (
            <Button
              type="primary"
              icon={<FiPlus className="w-3.5 h-3.5" />}
              onClick={() => {
                draftForm.resetFields();
                setDraftModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
            >
              Generate Draft Cycle
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: 0 }}>
        <Table dataSource={runs} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Draft Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Generate Monthly Payroll Draft</span>}
        open={draftModalOpen}
        onCancel={() => setDraftModalOpen(false)}
        footer={null}
      >
        <Form form={draftForm} layout="vertical" onFinish={handleCreateDraft} className="pt-2">
          <Form.Item name="year" label="Cycle Year" initialValue={new Date().getFullYear()} rules={[{ required: true }]}>
            <Select
              options={[
                { label: '2025', value: 2025 },
                { label: '2026', value: 2026 },
                { label: '2027', value: 2027 },
              ]}
            />
          </Form.Item>

          <Form.Item name="month" label="Cycle Month" initialValue={new Date().getMonth() + 1} rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'January (01)', value: 1 },
                { label: 'February (02)', value: 2 },
                { label: 'March (03)', value: 3 },
                { label: 'April (04)', value: 4 },
                { label: 'May (05)', value: 5 },
                { label: 'June (06)', value: 6 },
                { label: 'July (07)', value: 7 },
                { label: 'August (08)', value: 8 },
                { label: 'September (09)', value: 9 },
                { label: 'October (10)', value: 10 },
                { label: 'November (11)', value: 11 },
                { label: 'December (12)', value: 12 },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Memo (Optional)">
            <Input.TextArea rows={2} placeholder="e.g. Standard monthly cycle" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setDraftModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creatingDraft} className="bg-indigo-600 hover:bg-indigo-700">
              Prepare Payroll Draft
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details & Payslips Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-4">
            <span className="font-bold text-slate-900">
              Payroll Cycle: {selectedRun?.year} - Month {selectedRun?.month}
            </span>
            {selectedRun && <StatusBadge status={selectedRun.status} />}
          </div>
        }
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        width={850}
      >
        <div className="space-y-6">
          {selectedRun && (
            <Descriptions bordered size="small" column={3} className="bg-slate-50 rounded-xl">
              <Descriptions.Item label="Gross Payroll">{formatCurrency(selectedRun.totalGrossSalary)}</Descriptions.Item>
              <Descriptions.Item label="Total Deductions">{formatCurrency(selectedRun.totalDeductions)}</Descriptions.Item>
              <Descriptions.Item label="Total Tax">{formatCurrency(selectedRun.totalTax)}</Descriptions.Item>
              <Descriptions.Item label="Net Disbursal"><span className="font-bold text-emerald-600">{formatCurrency(selectedRun.totalNetSalary)}</span></Descriptions.Item>
              <Descriptions.Item label="Staff Count">{selectedRun.employeeCount} employees</Descriptions.Item>
              <Descriptions.Item label="Finalized Status">
                {selectedRun.status === 'FINALIZED' ? `Finalized at ${formatDateTime(selectedRun.finalizedAt)}` : 'Draft Stage'}
              </Descriptions.Item>
            </Descriptions>
          )}

          {selectedRun?.status === 'DRAFT' && role === 'ADMIN' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Finalization Authorization</p>
                <p className="text-xs text-amber-700">As Administrator, you can officially commit and issue payslips.</p>
              </div>
              <Popconfirm
                title="Finalize Payroll"
                description="This will lock all calculations permanently and create employee notifications."
                onConfirm={() => handleFinalize(selectedRun._id)}
              >
                <Button type="primary" className="bg-amber-600 hover:bg-amber-700 font-semibold text-xs">
                  Finalize Cycle
                </Button>
              </Popconfirm>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Staff Payslip Line Items</h4>
            <Table
              dataSource={payslips}
              rowKey="_id"
              loading={loadingDetails}
              size="small"
              columns={[
                {
                  title: 'Employee',
                  key: 'emp',
                  render: (_, r) => (
                    <div>
                      <span className="font-semibold text-xs block">{r.employee?.firstName} {r.employee?.lastName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{r.employee?.employeeCode}</span>
                    </div>
                  ),
                },
                { title: 'Gross Pay', dataIndex: 'grossSalary', key: 'g', render: (v) => formatCurrency(v) },
                { title: 'Absent / Unpaid', dataIndex: 'attendanceDeduction', key: 'd', render: (v) => <span className="text-rose-500">-{formatCurrency(v)}</span> },
                { title: 'Tax Deducted', dataIndex: 'monthlyTax', key: 't', render: (v) => <span className="text-rose-500">-{formatCurrency(v)}</span> },
                { title: 'Net Pay', dataIndex: 'netSalary', key: 'n', render: (v) => <span className="font-bold text-emerald-600">{formatCurrency(v)}</span> },
                {
                  title: 'PDF Slip',
                  key: 'pdf',
                  align: 'right',
                  render: (_, r) => (
                    <Button
                      size="small"
                      type="text"
                      icon={<FiDownload className="text-indigo-600" />}
                      onClick={() => handleDownloadPdf(r._id, r.employee?.employeeCode)}
                    >
                      PDF
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default PayrollPage;
