import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Alert, Space } from 'antd';
import { useNavigate } from 'react-router';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiRefreshCw,
  FiArrowRight,
} from 'react-icons/fi';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import dashboardApi from '../../api/dashboard.api';

export const HRDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchHRDashboard = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dashboardApi.getHRDashboard();
      setData(res?.data || null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRDashboard();
  }, []);

  const today = data?.today || {};
  const pending = data?.pendingApprovals || {};
  const topLate = data?.topLateComers || [];
  const leaveUsage = data?.leaveUsageByType || [];
  const trend = data?.attendanceTrend || [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Operations Board</h1>
          <p className="text-xs text-slate-500 font-medium">
            Live attendance tracking, pending approval queues, and staff movement
          </p>
        </div>
        <Button
          icon={<FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchHRDashboard}
          disabled={loading}
          className="text-xs font-semibold rounded-xl"
        >
          Refresh Data
        </Button>
      </div>

      {errorMsg && <Alert type="error" showIcon message={errorMsg} className="rounded-xl" />}

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Present Today"
            value={today.present ?? 0}
            subtitle={`Out of ${today.totalActiveEmployees ?? 0} active`}
            icon={FiCheckCircle}
            color="#16A34A"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Late Today"
            value={today.late ?? 0}
            subtitle="After office start + grace"
            icon={FiClock}
            color="#D97706"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="On Approved Leave"
            value={today.onLeave ?? 0}
            subtitle="Scheduled absence"
            icon={FiCalendar}
            color="#3B82F6"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Approvals"
            value={pending.total ?? 0}
            subtitle={`${pending.leaveRequests ?? 0} leaves, ${pending.attendanceCorrections ?? 0} corrections`}
            icon={FiAlertCircle}
            color="#DC2626"
            loading={loading}
            onClick={() => navigate('/hr/leaves')}
          />
        </Col>
      </Row>

      {/* Quick Action Alerts */}
      {(pending.total ?? 0) > 0 && (
        <Alert
          type="info"
          showIcon
          className="rounded-xl border border-indigo-200 bg-indigo-50/60"
          message={
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs">
                You have {pending.leaveRequests || 0} pending leave request(s) and {pending.attendanceCorrections || 0} attendance correction(s) awaiting your decision.
              </span>
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/hr/leaves')}
                className="text-indigo-600 font-bold p-0 flex items-center gap-1"
              >
                Review Inbox <FiArrowRight />
              </Button>
            </div>
          }
        />
      )}

      {/* Middle Grid */}
      <Row gutter={[16, 16]}>
        {/* Top 5 Late Comers this Month */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-sm font-bold text-slate-800">Top Late Arrivals (Current Month)</span>}
            className="border border-slate-200 rounded-xl shadow-xs h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={topLate}
              rowKey="employeeId"
              pagination={false}
              loading={loading}
              size="small"
              columns={[
                {
                  title: 'Employee',
                  dataIndex: 'fullName',
                  key: 'name',
                  render: (name, r) => (
                    <div>
                      <span className="font-semibold text-slate-800 text-xs">{name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{r.employeeCode}</span>
                    </div>
                  ),
                },
                {
                  title: 'Late Count',
                  dataIndex: 'lateCount',
                  key: 'cnt',
                  align: 'center',
                  render: (cnt) => <Tag color="warning">{cnt} times</Tag>,
                },
                {
                  title: 'Total Delay',
                  dataIndex: 'totalLateMinutes',
                  key: 'delay',
                  align: 'right',
                  render: (m) => <span className="font-mono text-xs text-slate-600 font-medium">{m} mins</span>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Leave Usage by Type */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-sm font-bold text-slate-800">Leave Consumption (Yearly Total)</span>}
            className="border border-slate-200 rounded-xl shadow-xs h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={leaveUsage}
              rowKey="_id"
              pagination={false}
              loading={loading}
              size="small"
              columns={[
                {
                  title: 'Leave Policy',
                  dataIndex: '_id',
                  key: 'type',
                  render: (type) => <Tag color="indigo">{type}</Tag>,
                },
                {
                  title: 'Approved Requests',
                  dataIndex: 'requestCount',
                  key: 'rcnt',
                  align: 'center',
                  render: (c) => <span className="text-xs text-slate-600">{c}</span>,
                },
                {
                  title: 'Total Days Utilized',
                  dataIndex: 'totalDays',
                  key: 'days',
                  align: 'right',
                  render: (d) => <span className="font-bold text-slate-900">{d} working days</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 7-Day Attendance Trend */}
      <Card
        title={<span className="text-sm font-bold text-slate-800">7-Day Attendance Activity Trend</span>}
        className="border border-slate-200 rounded-xl shadow-xs"
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={trend}
          rowKey="date"
          pagination={false}
          loading={loading}
          size="small"
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'd', render: (d) => <span className="font-mono text-xs font-semibold">{d}</span> },
            { title: 'Total Checked In', dataIndex: 'totalCheckedIn', key: 't', render: (t) => <span className="font-bold">{t}</span> },
            { title: 'On Time', dataIndex: 'present', key: 'p', render: (p) => <Tag color="success">{p}</Tag> },
            { title: 'Late Arrival', dataIndex: 'late', key: 'l', render: (l) => <Tag color="warning">{l}</Tag> },
            { title: 'Half Day', dataIndex: 'halfDay', key: 'h', render: (h) => <Tag color="orange">{h}</Tag> },
          ]}
        />
      </Card>
    </div>
  );
};

export default HRDashboard;
