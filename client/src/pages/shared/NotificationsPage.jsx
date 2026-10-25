import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Space, Empty } from 'antd';
import { FiBell, FiCheckCircle, FiCheck, FiRefreshCw } from 'react-icons/fi';
import communicationsApi from '../../api/communications.api';
import { formatDateTime } from '../../utils/formatters';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await communicationsApi.getNotifications({ limit: 50 });
      setNotifications(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await communicationsApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await communicationsApi.markAllNotificationsRead();
      message.success('All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      message.error(err.message || 'Failed to update notifications');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PAYROLL': return 'green';
      case 'LEAVE': return 'purple';
      case 'ATTENDANCE': return 'orange';
      case 'ANNOUNCEMENT': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiBell className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications Center</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time workflow alerts, leave decisions, and payslip availability notices
          </p>
        </div>

        <Space>
          <Button icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />} onClick={fetchNotifications} className="rounded-xl text-xs font-semibold">
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FiCheckCircle className="w-3.5 h-3.5" />}
            onClick={handleMarkAllRead}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
          >
            Mark All as Read
          </Button>
        </Space>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs divide-y divide-slate-100" bodyStyle={{ padding: 0 }}>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-indigo-50/30' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tag color={getTypeColor(n.type)} className="text-[10px] font-bold py-0 px-1.5 m-0">
                      {n.type}
                    </Tag>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{n.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">{formatDateTime(n.createdAt)}</span>
                </div>
              </div>

              {!n.isRead && (
                <Button
                  size="small"
                  type="text"
                  icon={<FiCheck className="w-3.5 h-3.5 text-indigo-600" />}
                  onClick={() => handleMarkRead(n._id)}
                  className="text-xs text-indigo-600 shrink-0 font-medium hover:bg-indigo-50 rounded-lg"
                >
                  Mark read
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Empty description="No notifications received yet." />
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
