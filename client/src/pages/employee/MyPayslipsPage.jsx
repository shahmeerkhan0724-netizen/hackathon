import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Tag, Descriptions, message, Space } from 'antd';
import { FiDollarSign, FiDownload, FiEye, FiFileText, FiRefreshCw } from 'react-icons/fi';
import payrollApi from '../../api/payroll.api';
import { formatCurrency } from '../../utils/formatters';

export const MyPayslipsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getMyPayslips();
      setPayslips(res?.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownloadPdf = async (id, year, month) => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      const blob = await payrollApi.downloadMyPayslipPdf(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${year}_${month}.pdf`);
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
      title: 'Period',
      key: 'period',
      render: (_, r) => (
        <span className="font-bold text-xs text-slate-800">
          {r.year} - Month {String(r.month).padStart(2, '0')}
        </span>
      ),
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'gross',
      render: (g) => formatCurrency(g),
    },
    {
      title: 'Attendance Deductions',
      dataIndex: 'attendanceDeduction',
      key: 'ded',
      render: (d) => <span className="text-xs text-rose-500 font-medium">-{formatCurrency(d)}</span>,
    },
    {
      title: 'Income Tax',
      dataIndex: 'monthlyTax',
      key: 'tax',
      render: (t) => <span className="text-xs text-rose-500 font-medium">-{formatCurrency(t)}</span>,
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'net',
      render: (n) => <span className="font-bold text-xs text-emerald-600">{formatCurrency(n)}</span>,
    },
    {
      title: 'Status',
      key: 'st',
      render: () => <Tag color="success">FINALIZED</Tag>,
    },
    {
      title: 'Actions',
      key: 'act',
      align: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<FiEye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedSlip(r);
              setDetailsModalOpen(true);
            }}
            className="text-xs font-semibold rounded-lg"
          >
            Details
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<FiDownload className="w-3.5 h-3.5" />}
            onClick={() => handleDownloadPdf(r._id, r.year, r.month)}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg"
          >
            PDF Slip
          </Button>
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Salary Payslips</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Access and download your verified monthly earnings, tax deductions, and salary slips
          </p>
        </div>

        <Button icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />} onClick={fetchPayslips} className="rounded-xl text-xs font-semibold">
          Refresh
        </Button>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: 0 }}>
        <Table dataSource={payslips} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Slip Breakdown Modal */}
      <Modal
        title={
          <span className="font-bold text-slate-900">
            Payslip Breakdown: {selectedSlip?.year} - Month {selectedSlip?.month}
          </span>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<FiDownload className="w-4 h-4" />}
            onClick={() => handleDownloadPdf(selectedSlip?._id, selectedSlip?.year, selectedSlip?.month)}
            className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            Download PDF
          </Button>,
        ]}
        width={600}
      >
        {selectedSlip && (
          <div className="py-2 space-y-4">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Basic Salary">{formatCurrency(selectedSlip.basicSalary)}</Descriptions.Item>
              <Descriptions.Item label="HRA (40%)">{formatCurrency(selectedSlip.hra)}</Descriptions.Item>
              <Descriptions.Item label="Medical Allowance">{formatCurrency(selectedSlip.medicalAllowance)}</Descriptions.Item>
              <Descriptions.Item label="Gross Salary"><span className="font-bold">{formatCurrency(selectedSlip.grossSalary)}</span></Descriptions.Item>
            </Descriptions>

            <Descriptions title="Working Days & Deductions" bordered size="small" column={2}>
              <Descriptions.Item label="Expected Days">{selectedSlip.expectedWorkingDays}</Descriptions.Item>
              <Descriptions.Item label="Actual Days">{selectedSlip.actualWorkingDays}</Descriptions.Item>
              <Descriptions.Item label="Absent Days">{selectedSlip.absentDays}</Descriptions.Item>
              <Descriptions.Item label="Half Days">{selectedSlip.halfDays}</Descriptions.Item>
              <Descriptions.Item label="Attendance Deduction"><span className="text-rose-600 font-medium">-{formatCurrency(selectedSlip.attendanceDeduction)}</span></Descriptions.Item>
              <Descriptions.Item label="Monthly Income Tax"><span className="text-rose-600 font-medium">-{formatCurrency(selectedSlip.monthlyTax)}</span></Descriptions.Item>
            </Descriptions>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-950">Net Disbursed Salary:</span>
              <span className="text-xl font-black text-emerald-700">{formatCurrency(selectedSlip.netSalary)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyPayslipsPage;
