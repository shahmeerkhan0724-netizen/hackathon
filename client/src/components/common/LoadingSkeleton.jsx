import React from 'react';
import { Skeleton, Card } from 'antd';

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'table') {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <Skeleton active title paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="rounded-xl border border-slate-200">
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
