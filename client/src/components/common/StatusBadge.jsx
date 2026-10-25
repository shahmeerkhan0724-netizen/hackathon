import React from 'react';
import { Tag } from 'antd';
import { getStatusColor } from '../../utils/formatters';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const color = getStatusColor(status);
  const formatted = status.replace(/_/g, ' ');

  return (
    <Tag color={color} className={`font-medium px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider ${className}`}>
      {formatted}
    </Tag>
  );
};

export default StatusBadge;
