export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-PK', {
    maximumFractionDigits: 0,
  })}`;
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PRESENT':
    case 'APPROVED':
    case 'FINALIZED':
    case 'ACTIVE':
      return 'success';
    case 'LATE':
    case 'HALF_DAY':
    case 'PENDING':
    case 'PROBATION':
      return 'warning';
    case 'ABSENT':
    case 'REJECTED':
    case 'CANCELLED':
    case 'INACTIVE':
      return 'error';
    case 'ON_LEAVE':
    case 'DRAFT':
      return 'processing';
    default:
      return 'default';
  }
};
