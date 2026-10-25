import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Row,
  Col,
  message,
  Popconfirm,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import {
  FiCalendar,
  FiPlus,
  FiCpu,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
} from 'react-icons/fi';
import leavesApi from '../../api/leaves.api';
import aiApi from '../../api/ai.api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

export const MyLeavesPage = () => {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // AI Smart Leave Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const [balRes, leavesRes] = await Promise.all([
        leavesApi.getMyLeaveBalances(),
        leavesApi.getMyLeaves(),
      ]);
      setBalances(balRes?.data || []);
      setLeaves(leavesRes?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApplySubmit = async (values) => {
    setSubmitting(true);
    try {
      const [startDate, endDate] = values.dateRange;
      await leavesApi.applyLeave({
        leaveTypeCode: values.leaveTypeCode,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        reason: values.reason,
      });

      message.success('Leave application submitted successfully');
      setApplyModalOpen(false);
      applyForm.resetFields();
      fetchLeaveData();
    } catch (err) {
      message.error(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmartLeaveParse = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiApi.parseSmartLeave(aiQuery);
      const parsed = res?.data;

      if (parsed) {
        applyForm.setFieldsValue({
          leaveTypeCode: parsed.type || 'CASUAL',
          dateRange: parsed.startDate && parsed.endDate ? [dayjs(parsed.startDate), dayjs(parsed.endDate)] : undefined,
          reason: parsed.reason || aiQuery,
        });
        message.success('Leave form pre-filled by AI. Please review and submit.');
        setAiModalOpen(false);
        setAiQuery('');
        setApplyModalOpen(true);
      }
    } catch (err) {
      message.error(err.message || 'AI parsing failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await leavesApi.cancelLeave(leaveId);
      message.success('Leave request cancelled');
      fetchLeaveData();
    } catch (err) {
      message.error(err.message || 'Failed to cancel leave request');
    }
  };

  const columns = [
    {
      title: 'Leave Type',
      dataIndex: 'leaveTypeCode',
      key: 'type',
      render: (t) => <Tag color="purple" className="font-semibold text-xs">{t}</Tag>,
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, r) => (
        <span className="font-mono text-xs text-slate-800">
          {formatDate(r.startDate)} <span className="text-slate-400">to</span> {formatDate(r.endDate)}
        </span>
      ),
    },
    {
      title: 'Working Days',
      dataIndex: 'daysCount',
      key: 'days',
      align: 'center',
      render: (d) => <Tag color="blue">{d} days</Tag>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (r) => <span className="text-xs text-slate-600 max-w-xs truncate block" title={r}>{r}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'st',
      render: (s) => <StatusBadge status={s} />,
    },
    {
      title: 'HR Decision / Note',
      dataIndex: 'decisionNote',
      key: 'note',
      render: (n) => <span className="text-xs text-slate-500">{n || '-'}</span>,
    },
    {
      title: 'Action',
      key: 'act',
      align: 'right',
      render: (_, r) => (
        r.status === 'PENDING' ? (
          <Popconfirm
            title="Cancel Leave Request"
            description="Are you sure you want to cancel this pending request?"
            onConfirm={() => handleCancelLeave(r._id)}
          >
            <Button size="small" type="text" danger icon={<FiTrash2 />}>
              Cancel
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Leave Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor annual quotas, apply for scheduled absences, and review decision status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<FiCpu className="text-indigo-600" />}
            onClick={() => setAiModalOpen(true)}
            className="text-xs font-semibold rounded-xl border-indigo-200 hover:border-indigo-400"
          >
            AI Smart Leave
          </Button>

          <Button
            type="primary"
            icon={<FiPlus className="w-3.5 h-3.5" />}
            onClick={() => {
              applyForm.resetFields();
              setApplyModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Quotas Grid */}
      <Row gutter={[16, 16]}>
        {balances.map((b) => (
          <Col xs={12} sm={6} key={b.code}>
            <Card className="border border-slate-200 rounded-xl shadow-xs text-center" bodyStyle={{ padding: '16px' }}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {b.name}
              </span>
              <span className="text-3xl font-black text-indigo-900 block my-1">
                {b.isUnlimited ? '∞' : b.remaining}
              </span>
              <span className="text-xs text-slate-400 block font-medium">
                {b.isUnlimited ? 'Unlimited (Subject to HR Approval)' : `${b.used} used of ${b.quota} working days`}
              </span>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Leave History Table */}
      <Card
        title={<span className="text-sm font-bold text-slate-800">My Leave Applications ({leaves.length})</span>}
        className="border border-slate-200 rounded-xl shadow-xs"
        bodyStyle={{ padding: 0 }}
      >
        <Table dataSource={leaves} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Submit Leave Application</span>}
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        footer={null}
      >
        <Form form={applyForm} layout="vertical" onFinish={handleApplySubmit} className="pt-2">
          <Form.Item name="leaveTypeCode" label="Leave Policy Type" rules={[{ required: true, message: 'Select policy' }]}>
            <Select
              placeholder="Select leave type"
              options={balances.map((b) => ({
                label: `${b.name} (${b.isUnlimited ? 'Unlimited' : `${b.remaining} remaining`})`,
                value: b.code,
              }))}
            />
          </Form.Item>

          <Form.Item name="dateRange" label="Leave Period (Inclusive)" rules={[{ required: true, message: 'Select dates' }]}>
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Absence"
            rules={[
              { required: true, message: 'Please provide reason' },
              { min: 5, message: 'Minimum 5 characters' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="e.g. Attending family wedding / Medical recovery" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setApplyModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              Submit Leave Request
            </Button>
          </div>
        </Form>
      </Modal>

      {/* AI Smart Leave Assistant Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-700">
            <FiCpu className="w-5 h-5" />
            <span className="font-bold">AI Smart Leave Assistant</span>
          </div>
        }
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-600">
            Describe your leave in plain English. AI will extract dates, classify the policy type, and pre-fill the application form for your confirmation.
          </p>

          <Input.TextArea
            rows={3}
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="e.g. I need 2 days casual leave next Monday and Tuesday for my brother's wedding ceremony."
          />

          <div className="flex justify-end gap-2">
            <Button onClick={() => setAiModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSmartLeaveParse}
              loading={aiLoading}
              disabled={!aiQuery.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              Parse & Pre-fill Form
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyLeavesPage;
