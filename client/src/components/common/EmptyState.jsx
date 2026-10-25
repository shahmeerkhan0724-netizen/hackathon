import React from 'react';
import { Empty, Button } from 'antd';

export const EmptyState = ({
  title = 'No records found',
  description = 'There is currently no data available for this view.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-white rounded-xl border border-slate-100 my-4 ${className}`}>
      <Empty
        description={
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">{title}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{description}</p>
          </div>
        }
      >
        {actionLabel && onAction && (
          <Button type="primary" onClick={onAction} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
