import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Tag,
  Row,
  Col,
  Tabs,
  Modal,
  Input,
  message,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import attendanceApi from '../../api/attendance.api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatTime, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export const AttendanceBoardPage = () => {
  const { role } = useAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Corrections Tab
  const [corrections, setCorrections] = useState([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [decisionModal, setDecisionModal] = useState({ open: false, item: null, action: 'APPROVED' });
  const [decisionNote, setDecisionNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchBoard = async (dateStr = selectedDate) => {
    setLoading(true);
    try {
      const res = await attendanceApi.getDailyBoard(dateStr);
      setBoardData(res?.data || null);
    } catch (err) {
      message.error(err.message || 'Failed to load attendance board');
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrections = async () => {
    setLoadingCorrections(true);
    try {
      const res = await attendanceApi.getCorrections({ status: 'PENDING' });
      setCorrections(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to load correction requests');
    } finally {
      setLoadingCorrections(false);
    }
  };

  useEffect(() => {
    fetchBoard(selectedDate);
    fetchCorrections();
  }, [selectedDate]);

  const handleDecisionSubmit = async () => {
    if (!decisionModal.item) return;
    setSubmittingDecision(true);
    try {
      await attendanceApi.decideCorrection(decisionModal.item._id, {
        status: decisionModal.action,
        decisionNote,
      });
      message.success(`Correction request ${decisionModal.action.toLowerCase()}`);
      setDecisionModal({ open: false, item: null, action: 'APPROVED' });
      setDecisionNote('');
      fetchCorrections();
      fetchBoard();
    } catch (err) {
      message.error(err.message || 'Failed to process decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const summary = boardData?.summary || {};
  const roster = boardData?.roster || [];

  const columns = [
    {
      title: 'Employee',
      key: 'emp',
      render: (_, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{r.employee?.fullName}</span>
          <span className="text-[10px] text-slate-400 block font-mono">{r.employee?.employeeCode}</span>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department', 'name'],
      key: 'dept',
      render: (d) => <span className="text-xs text-slate-600 font-medium">{d || '-'}</span>,
    },
    {
      title: 'Check-In',
      key: 'in',
      render: (_, r) => (
        <span className="font-mono text-xs">
          {r.attendance?.checkIn ? formatTime(r.attendance.checkIn) : '-'}
        </span>
      ),
    },
    {
      title: 'Check-Out',
      key: 'out',
      render: (_, r) => (
        <span className="font-mono text-xs">
          {r.attendance?.checkOut ? formatTime(r.attendance.checkOut) : '-'}
        </span>
      ),
    },
    {
      title: 'Worked Hours',
      key: 'hrs',
      render: (_, r) => {
        if (!r.attendance?.totalWorkMinutes) return '-';
        return <span className="font-semibold text-slate-700">{(r.attendance.totalWorkMinutes / 60).toFixed(1)} hrs</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'st',
      render: (s) => <StatusBadge status={s} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiClock className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Attendance Board</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor real-time employee attendance status and process correction submissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(d) => d && setSelectedDate(d.format('YYYY-MM-DD'))}
            allowClear={false}
            className="rounded-xl"
          />
          <Button
            icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchBoard()}
            className="rounded-xl text-xs font-semibold"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Present" value={summary.present ?? 0} subtitle="On time arrivals" icon={FiCheckCircle} color="#16A34A" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Late Arrivals" value={summary.late ?? 0} subtitle="After grace period" icon={FiClock} color="#D97706" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Half Day" value={summary.halfDay ?? 0} subtitle="Under 5 hours" icon={FiAlertCircle} color="#EA580C" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="On Leave" value={summary.onLeave ?? 0} subtitle="Approved leave" icon={FiCalendar} color="#3B82F6" />
        </Col>
      </Row>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          items={[
            {
              key: 'roster',
              label: <span className="font-semibold text-xs">Daily Roster ({roster.length})</span>,
              children: (
                <Table
                  dataSource={roster}
                  columns={columns}
                  rowKey={(r) => r.employee?.id}
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 15 }}
                />
              ),
            },
            {
              key: 'corrections',
              label: (
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  Pending Corrections ({corrections.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={corrections}
                  rowKey="_id"
                  loading={loadingCorrections}
                  size="middle"
                  columns={[
                    {
                      title: 'Employee',
                      dataIndex: ['employee', 'firstName'],
                      key: 'emp',
                      render: (_, r) => (
                        <div>
                          <span className="font-semibold text-xs block">{r.employee?.firstName} {r.employee?.lastName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{r.employee?.employeeCode}</span>
                        </div>
                      ),
                    },
                    { title: 'Date', dataIndex: 'date', key: 'd', render: (d) => <span className="font-mono text-xs">{d}</span> },
                    {
                      title: 'Requested Check-In',
                      dataIndex: 'requestedCheckIn',
                      key: 'in',
                      render: (t) => <span className="font-mono text-xs text-indigo-700">{formatTime(t)}</span>,
                    },
                    {
                      title: 'Requested Check-Out',
                      dataIndex: 'requestedCheckOut',
                      key: 'out',
                      render: (t) => <span className="font-mono text-xs">{formatTime(t)}</span>,
                    },
                    { title: 'Reason', dataIndex: 'reason', key: 'r', render: (r) => <span className="text-xs text-slate-600">{r}</span> },
                    {
                      title: 'Action',
                      key: 'act',
                      align: 'right',
                      render: (_, item) => (
                        <Space>
                          {role === 'HR' && (
                            <>
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
                            </>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Decision Modal with comment */}
      <Modal
        title={<span className="font-bold text-slate-900">{decisionModal.action === 'APPROVED' ? 'Approve Correction Request' : 'Reject Correction Request'}</span>}
        open={decisionModal.open}
        onCancel={() => setDecisionModal({ open: false, item: null, action: 'APPROVED' })}
        footer={null}
      >
        <div className="py-2 space-y-4">
          <p className="text-xs text-slate-600">
            You are about to {decisionModal.action.toLowerCase()} the attendance correction for{' '}
            <strong>{decisionModal.item?.employee?.firstName} {decisionModal.item?.employee?.lastName}</strong> on <strong>{decisionModal.item?.date}</strong>.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Decision Note (Optional):</label>
            <Input.TextArea
              rows={3}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Provide a comment or rationale for the record..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setDecisionModal({ open: false, item: null, action: 'APPROVED' })}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleDecisionSubmit}
              loading={submittingDecision}
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

export default AttendanceBoardPage;
