import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Alert, Spin } from 'antd';
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiBriefcase,
  FiCpu,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import dashboardApi from '../../api/dashboard.api';
import aiApi from '../../api/ai.api';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dashboardApi.getAdminDashboard();
      setData(res?.data || null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerateAISummary = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const res = await aiApi.getAIDashboardSummary(data.overview);
      setAiInsights(res?.data?.insights || []);
    } catch (err) {
      console.warn('AI summary error:', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const overview = data?.overview || {};
  const headcountByDept = data?.headcountByDepartment || [];
  const payrollByDept = data?.payrollByDepartment || [];
  const recentAudit = data?.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            Company-wide workforce analytics and executive operational metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboard}
            disabled={loading}
            className="text-xs font-semibold rounded-xl"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FiCpu className="w-3.5 h-3.5" />}
            onClick={handleGenerateAISummary}
            loading={aiLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
          >
            Generate AI Insights
          </Button>
        </div>
      </div>

      {errorMsg && <Alert type="error" showIcon message={errorMsg} className="rounded-xl" />}

      {/* AI Insights Card if generated */}
      {aiInsights && aiInsights.length > 0 && (
        <Card className="border border-indigo-200 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <FiCpu className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Executive AI Summary</h4>
                <Tag color="purple" className="text-[10px] font-semibold border-0">
                  Groq LLM
                </Tag>
              </div>
              <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                {aiInsights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Primary KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Headcount"
            value={overview.activeEmployees ?? 0}
            subtitle={`${overview.totalEmployees ?? 0} total registered`}
            icon={FiUsers}
            color="#4338CA"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Est. Monthly Payroll"
            value={formatCurrency(overview.monthlyPayrollEstimate)}
            subtitle="Based on salary structures"
            icon={FiDollarSign}
            color="#059669"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Average Salary"
            value={formatCurrency(overview.averageSalary)}
            subtitle="Across configured employees"
            icon={FiTrendingUp}
            color="#D97706"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Departments"
            value={headcountByDept.length}
            subtitle="Organizational units"
            icon={FiBriefcase}
            color="#7C3AED"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Middle Section: Breakdown Tables */}
      <Row gutter={[16, 16]}>
        {/* Headcount by Department */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="text-sm font-bold text-slate-800">Headcount by Department</span>
            }
            className="border border-slate-200 rounded-xl shadow-xs h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={headcountByDept}
              rowKey="departmentId"
              pagination={false}
              loading={loading}
              size="small"
              columns={[
                {
                  title: 'Department',
                  dataIndex: 'departmentName',
                  key: 'dept',
                  render: (text) => <span className="font-semibold text-slate-800">{text}</span>,
                },
                {
                  title: 'Active Employees',
                  dataIndex: 'count',
                  key: 'count',
                  align: 'right',
                  render: (c) => <Tag color="blue">{c} members</Tag>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Payroll Cost by Department */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="text-sm font-bold text-slate-800">Payroll Cost by Department</span>
            }
            className="border border-slate-200 rounded-xl shadow-xs h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={payrollByDept}
              rowKey="departmentId"
              pagination={false}
              loading={loading}
              size="small"
              columns={[
                {
                  title: 'Department',
                  dataIndex: 'departmentName',
                  key: 'dept',
                  render: (text) => <span className="font-semibold text-slate-800">{text}</span>,
                },
                {
                  title: 'Monthly Est.',
                  dataIndex: 'totalPayrollCost',
                  key: 'cost',
                  align: 'right',
                  render: (cost) => <span className="font-bold text-emerald-600">{formatCurrency(cost)}</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Audit Log Feed */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiShield className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-800">Recent Audit Activity</span>
          </div>
        }
        className="border border-slate-200 rounded-xl shadow-xs"
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={recentAudit}
          rowKey="_id"
          pagination={false}
          loading={loading}
          size="small"
          columns={[
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              render: (act) => <Tag color="indigo">{act}</Tag>,
            },
            {
              title: 'Actor',
              dataIndex: 'actor',
              key: 'actor',
              render: (actor) => (
                <span className="text-xs text-slate-600 font-medium">
                  {actor?.email || 'System'} ({actor?.role || 'AUTO'})
                </span>
              ),
            },
            {
              title: 'Target Entity',
              dataIndex: 'entityType',
              key: 'entity',
              render: (t) => <span className="text-xs text-slate-500">{t}</span>,
            },
            {
              title: 'Timestamp',
              dataIndex: 'timestamp',
              key: 'time',
              align: 'right',
              render: (time) => <span className="text-xs text-slate-400">{formatDateTime(time)}</span>,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
