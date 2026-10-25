import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Select, Button, Space, message } from 'antd';
import { FiShield, FiSearch, FiRefreshCw } from 'react-icons/fi';
import auditApi from '../../api/audit.api';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entityType: entityFilter }),
      };
      const res = await auditApi.getAuditLogs(params);
      setLogs(res?.data?.items || []);
      setTotalItems(res?.data?.pagination?.totalItems || 0);
    } catch (err) {
      message.error(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, pageSize);
  }, [actionFilter, entityFilter]);

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color="indigo" className="font-semibold text-xs py-0.5 px-2">
          {action}
        </Tag>
      ),
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
      render: (actor) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">
            {actor?.email || 'System'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Role: {actor?.role || 'SYSTEM'}
          </span>
        </div>
      ),
    },
    {
      title: 'Entity',
      key: 'entity',
      render: (_, r) => (
        <span className="text-xs text-slate-600">
          <span className="font-semibold">{r.entityType}</span>
          {r.entityId ? <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">#{r.entityId}</span> : null}
        </span>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ip',
      render: (ip) => <span className="font-mono text-[11px] text-slate-500">{ip || 'internal'}</span>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'time',
      align: 'right',
      render: (t) => <span className="text-xs text-slate-500">{formatDateTime(t)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiShield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Append-only security log recording critical administrative and payroll transactions
          </p>
        </div>
        <Button
          icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
          onClick={() => fetchLogs()}
          disabled={loading}
          className="text-xs font-semibold rounded-xl"
        >
          Refresh Feed
        </Button>
      </div>

      <Card className="border border-slate-200 rounded-xl shadow-xs" bodyStyle={{ padding: 0 }}>
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50">
          <Input
            placeholder="Filter by Action (e.g. LOGIN, PAYROLL)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-64 text-xs rounded-lg"
            allowClear
          />
          <Select
            placeholder="Entity Type"
            value={entityFilter || undefined}
            onChange={(v) => setEntityFilter(v || '')}
            allowClear
            className="w-48 text-xs"
            options={[
              { label: 'All Entities', value: '' },
              { label: 'Company', value: 'Company' },
              { label: 'User', value: 'User' },
              { label: 'Employee', value: 'Employee' },
              { label: 'Attendance', value: 'Attendance' },
              { label: 'LeaveRequest', value: 'LeaveRequest' },
              { label: 'PayrollRun', value: 'PayrollRun' },
              { label: 'SalaryStructure', value: 'SalaryStructure' },
            ]}
          />
        </div>

        <Table
          dataSource={logs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          size="middle"
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto shadow-inner">
                <p className="text-slate-400 mb-1 text-[10px] uppercase font-bold tracking-wider">// Audit Snapshot Payload</p>
                <pre>{JSON.stringify(record.details || {}, null, 2)}</pre>
              </div>
            ),
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalItems,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setCurrentPage(p);
              setPageSize(ps);
              fetchLogs(p, ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default AuditLogPage;
