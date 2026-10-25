import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Modal,
  Form,
  Input,
  Tag,
  Tabs,
  Row,
  Col,
  TimePicker,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import attendanceApi from '../../api/attendance.api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatTime, formatDate } from '../../utils/formatters';

export const MyAttendancePage = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Correction Request Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionForm] = Form.useForm();
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMyAttendance({
        month: selectedMonth.month() + 1,
        year: selectedMonth.year(),
      });
      setRecords(res?.data || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrections = async () => {
    try {
      const res = await attendanceApi.getCorrections();
      setCorrections(res?.data?.items || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchCorrections();
  }, [selectedMonth]);

  const handleCorrectionSubmit = async (values) => {
    setSubmittingCorrection(true);
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      const inStr = `${dateStr}T${values.checkIn.format('HH:mm:ss')}`;
      const outStr = values.checkOut ? `${dateStr}T${values.checkOut.format('HH:mm:ss')}` : null;

      await attendanceApi.requestCorrection({
        date: dateStr,
        requestedCheckIn: inStr,
        requestedCheckOut: outStr,
        reason: values.reason,
      });

      message.success('Correction request submitted to HR for review');
      setCorrectionModalOpen(false);
      correctionForm.resetFields();
      fetchCorrections();
    } catch (err) {
      message.error(err.message || 'Failed to submit correction request');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d) => <span className="font-mono text-xs font-semibold text-slate-800">{d}</span>,
    },
    {
      title: 'Check-In',
      dataIndex: 'checkIn',
      key: 'in',
      render: (t) => <span className="font-mono text-xs text-indigo-700">{formatTime(t)}</span>,
    },
    {
      title: 'Check-Out',
      dataIndex: 'checkOut',
      key: 'out',
      render: (t) => <span className="font-mono text-xs">{formatTime(t)}</span>,
    },
    {
      title: 'Worked Hours',
      dataIndex: 'totalWorkMinutes',
      key: 'hrs',
      render: (m) => (m ? <span className="font-semibold text-xs">{(m / 60).toFixed(1)} hrs</span> : '-'),
    },
    {
      title: 'Late Delay',
      dataIndex: 'lateMinutes',
      key: 'late',
      render: (l) => (l > 0 ? <Tag color="warning">{l} mins</Tag> : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st) => <StatusBadge status={st} />,
    },
    {
      title: 'Notes',
      dataIndex: 'checkInNote',
      key: 'note',
      render: (n, r) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {n || r.checkOutNote || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiClock className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance Log</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review monthly check-in times, worked hours, and submit attendance correction adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DatePicker.MonthPicker
            value={selectedMonth}
            onChange={(m) => m && setSelectedMonth(m)}
            allowClear={false}
            className="rounded-xl"
          />
          <Button
            type="primary"
            icon={<FiPlus className="w-3.5 h-3.5" />}
            onClick={() => setCorrectionModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
          >
            Request Correction
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'history',
              label: <span className="font-semibold text-xs">Attendance History ({records.length} days)</span>,
              children: (
                <Table
                  dataSource={records}
                  columns={columns}
                  rowKey="_id"
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 15 }}
                />
              ),
            },
            {
              key: 'corrections',
              label: (
                <span className="font-semibold text-xs">
                  My Correction Requests ({corrections.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={corrections}
                  rowKey="_id"
                  size="small"
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'd', render: (d) => <span className="font-mono text-xs">{d}</span> },
                    { title: 'Req. In', dataIndex: 'requestedCheckIn', key: 'in', render: (t) => <span className="font-mono text-xs">{formatTime(t)}</span> },
                    { title: 'Req. Out', dataIndex: 'requestedCheckOut', key: 'out', render: (t) => <span className="font-mono text-xs">{formatTime(t)}</span> },
                    { title: 'Reason', dataIndex: 'reason', key: 'r', render: (r) => <span className="text-xs text-slate-600">{r}</span> },
                    { title: 'Status', dataIndex: 'status', key: 's', render: (st) => <StatusBadge status={st} /> },
                    { title: 'HR Decision Note', dataIndex: 'decisionNote', key: 'dn', render: (dn) => <span className="text-xs text-slate-500">{dn || '-'}</span> },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Request Correction Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Submit Attendance Correction</span>}
        open={correctionModalOpen}
        onCancel={() => setCorrectionModalOpen(false)}
        footer={null}
      >
        <Form form={correctionForm} layout="vertical" onFinish={handleCorrectionSubmit} className="pt-2">
          <Form.Item name="date" label="Attendance Date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker className="w-full" maxDate={dayjs()} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="checkIn" label="Actual Check-In Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkOut" label="Actual Check-Out Time">
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Reason for Adjustment"
            rules={[
              { required: true, message: 'Please explain reason' },
              { min: 5, message: 'Minimum 5 characters' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="e.g. Card scanner malfunction / Site visit" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setCorrectionModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submittingCorrection} className="bg-indigo-600 hover:bg-indigo-700">
              Submit to HR
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MyAttendancePage;
