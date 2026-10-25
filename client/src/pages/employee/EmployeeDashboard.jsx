import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Alert, message, Modal } from 'antd';
import { useNavigate } from 'react-router';
import {
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiDownload,
  FiBell,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import dashboardApi from '../../api/dashboard.api';
import attendanceApi from '../../api/attendance.api';
import payrollApi from '../../api/payroll.api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getEmployeeDashboard();
      setData(res?.data || null);
    } catch (err) {
      message.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await attendanceApi.checkIn();
      message.success(res?.message || 'Checked in successfully!');
      fetchDashboard();
    } catch (err) {
      message.error(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await attendanceApi.checkOut();
      message.success(res?.message || 'Checked out successfully!');
      fetchDashboard();
    } catch (err) {
      message.error(err.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDownloadLatestPdf = async (payslipId) => {
    try {
      message.loading({ content: 'Downloading payslip...', key: 'pdf' });
      const blob = await payrollApi.downloadMyPayslipPdf(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success({ content: 'PDF downloaded successfully', key: 'pdf' });
    } catch (err) {
      message.error({ content: err.message || 'Failed to download PDF', key: 'pdf' });
    }
  };

  const today = data?.todayStatus || {};
  const balances = data?.leaveBalances || [];
  const latestPayslip = data?.latestPayslip || null;
  const announcements = data?.recentAnnouncements || [];

  return (
    <div className="space-y-6">
      {/* Welcome & Live Attendance Action Card */}
      <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-2 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Live Attendance • {today.date}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Daily Work Desk</h2>
            <div className="flex items-center gap-3 text-xs text-indigo-200">
              <span>
                Status:{' '}
                <strong className="text-white">
                  {today.isCheckedIn ? (today.isCheckedOut ? 'Completed Day' : 'Checked In (Active)') : 'Not Checked In'}
                </strong>
              </span>
              {today.lateMinutes > 0 && (
                <Tag color="warning" className="border-0">
                  Late by {today.lateMinutes} mins
                </Tag>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!today.isCheckedIn ? (
              <Button
                type="primary"
                onClick={handleCheckIn}
                loading={checkingIn}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20 text-sm flex items-center gap-2"
              >
                <FiCheckCircle className="w-5 h-5" /> Check In Now
              </Button>
            ) : !today.isCheckedOut ? (
              <Button
                type="primary"
                onClick={handleCheckOut}
                loading={checkingOut}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-12 px-6 rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center gap-2"
              >
                <FiClock className="w-5 h-5" /> Check Out
              </Button>
            ) : (
              <Tag color="success" className="text-xs py-1.5 px-3 rounded-lg font-bold">
                ✓ Day Completed
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Worked This Week"
            value={`${data?.hoursWorkedThisWeek ?? 0} hrs`}
            subtitle="Monday through today"
            icon={FiClock}
            color="#4338CA"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Late Count (Month)"
            value={data?.monthLateCount ?? 0}
            subtitle="Arrivals after grace period"
            icon={FiClock}
            color="#D97706"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Unread Notifications"
            value={data?.unreadNotificationsCount ?? 0}
            subtitle="Payroll, leaves, announcements"
            icon={FiBell}
            color="#7C3AED"
            loading={loading}
            onClick={() => navigate('/notifications')}
          />
        </Col>
      </Row>

      {/* Leave Balances Grid */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Remaining Leave Quotas</span>
            <Button
              type="link"
              onClick={() => navigate('/leaves/me')}
              className="text-indigo-600 font-semibold p-0 text-xs flex items-center gap-1"
            >
              Apply Leave <FiArrowRight />
            </Button>
          </div>
        }
        className="border border-slate-200 rounded-xl shadow-xs"
      >
        <Row gutter={[16, 16]}>
          {balances.map((b) => (
            <Col xs={12} sm={6} key={b.code}>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {b.name}
                </span>
                <span className="text-2xl font-black text-indigo-900 block">
                  {b.isUnlimited ? '∞' : b.remaining}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {b.isUnlimited ? 'Unlimited quota' : `${b.used} used of ${b.quota}`}
                </span>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Latest Payslip & Announcements */}
      <Row gutter={[16, 16]}>
        {/* Latest Payslip */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-sm font-bold text-slate-800">Latest Finalized Payslip</span>}
            className="border border-slate-200 rounded-xl shadow-xs h-full"
          >
            {latestPayslip ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Period</span>
                    <h4 className="text-base font-bold text-slate-900">
                      {latestPayslip.year} - Month {String(latestPayslip.month).padStart(2, '0')}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium">Net Disbursed</span>
                    <h4 className="text-xl font-black text-emerald-600">
                      {formatCurrency(latestPayslip.netSalary)}
                    </h4>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gross Salary</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(latestPayslip.grossSalary)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Attendance Deductions</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(latestPayslip.attendanceDeduction)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Income Tax</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(latestPayslip.monthlyTax)}</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  icon={<FiDownload className="w-4 h-4" />}
                  onClick={() => handleDownloadLatestPdf(latestPayslip._id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-xs h-10 flex items-center justify-center gap-1.5"
                >
                  Download PDF Payslip
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No finalized payslips available yet.
              </div>
            )}
          </Card>
        </Col>

        {/* Company Announcements */}
        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-sm font-bold text-slate-800">Company Announcements</span>}
            className="border border-slate-200 rounded-xl shadow-xs h-full"
            bodyStyle={{ padding: '12px 16px' }}
          >
            {announcements.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {announcements.map((a) => (
                  <div key={a._id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{a.title}</span>
                      <Tag color={a.priority === 'URGENT' ? 'red' : 'blue'} className="text-[10px]">
                        {a.priority}
                      </Tag>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{a.content}</p>
                    <span className="text-[10px] text-slate-400 block">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No current announcements.
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;
