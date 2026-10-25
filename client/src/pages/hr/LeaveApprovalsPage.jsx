import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Tabs, Modal, Input, message, Space, Select } from 'antd';
import { FiCalendar, FiCheck, FiX, FiRefreshCw, FiClock } from 'react-icons/fi';
import leavesApi from '../../api/leaves.api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export const LeaveApprovalsPage = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState({ open: false, item: null, action: 'APPROVED' });
  const [decisionNote, setDecisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await leavesApi.getAllLeaves({ status: 'PENDING' });
      setPendingLeaves(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch pending leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await leavesApi.getAllLeaves();
      setAllLeaves(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch leave history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    else fetchAll();
  }, [activeTab]);

  const handleDecisionSubmit = async () => {
    if (!decisionModal.item) return;
    setSubmitting(true);
    try {
      await leavesApi.decideLeave(decisionModal.item._id, {
        status: decisionModal.action,
        decisionNote,
      });
      message.success(`Leave request ${decisionModal.action.toLowerCase()}`);
      setDecisionModal({ open: false, item: null, action: 'APPROVED' });
      setDecisionNote('');
      fetchPending();
    } catch (err) {
      message.error(err.message || 'Failed to process leave decision');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'emp',
      render: (_, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{r.employee?.firstName} {r.employee?.lastName}</span>
          <span className="font-mono text-[10px] text-slate-400">{r.employee?.employeeCode}</span>
        </div>
      ),
    },
    {
      title: 'Policy Type',
      dataIndex: 'leaveTypeCode',
      key: 'type',
      render: (t) => <Tag color="purple" className="font-semibold text-xs">{t}</Tag>,
    },
    {
      title: 'Date Range',
      key: 'range',
      render: (_, r) => (
        <span className="text-xs font-mono text-slate-700">
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
    ...(activeTab === 'pending' && role === 'HR'
      ? [
          {
            title: 'Action',
            key: 'act',
            align: 'right',
            render: (_, item) => (
              <Space>
                <Button
                  size="small"
                  type="primary"
                  icon={<FiCheck className="w-3 h-3" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                  onClick={() => setDecisionModal({ open: true, item, action: 'APPROVED' })}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<FiX className="w-3 h-3" />}
                  className="text-xs font-semibold"
                  onClick={() => setDecisionModal({ open: true, item, action: 'REJECTED' })}
                >
                  Reject
                </Button>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals & Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review employee time-off requests, check quota impacts, and approve or reject submissions
          </p>
        </div>

        <Button
          icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
          onClick={() => (activeTab === 'pending' ? fetchPending() : fetchAll())}
          className="text-xs font-semibold rounded-xl"
        >
          Refresh
        </Button>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <FiClock /> Pending Requests ({pendingLeaves.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={pendingLeaves}
                  columns={columns}
                  rowKey="_id"
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'all',
              label: <span className="font-semibold text-xs">All Company Requests ({allLeaves.length})</span>,
              children: (
                <Table
                  dataSource={allLeaves}
                  columns={columns}
                  rowKey="_id"
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 15 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Decision Modal */}
      <Modal
        title={
          <span className="font-bold text-slate-900">
            {decisionModal.action === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
          </span>
        }
        open={decisionModal.open}
        onCancel={() => setDecisionModal({ open: false, item: null, action: 'APPROVED' })}
        footer={null}
      >
        <div className="py-2 space-y-4">
          <p className="text-xs text-slate-600">
            You are deciding the <strong>{decisionModal.item?.leaveTypeCode}</strong> leave request for{' '}
            <strong>{decisionModal.item?.employee?.firstName} {decisionModal.item?.employee?.lastName}</strong> ({decisionModal.item?.daysCount} working days).
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Decision Comment:</label>
            <Input.TextArea
              rows={3}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="e.g. Approved. Ensure task handover before leave begins."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setDecisionModal({ open: false, item: null, action: 'APPROVED' })}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleDecisionSubmit}
              loading={submitting}
              className={decisionModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
            >
              Confirm {decisionModal.action}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveApprovalsPage;
