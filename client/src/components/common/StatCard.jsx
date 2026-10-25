import React from 'react';
import { Card } from 'antd';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = '#4338CA',
  subtitle = '',
  loading = false,
  onClick,
}) => {
  return (
    <Card
      loading={loading}
      onClick={onClick}
      className={`border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200 ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      }`}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
