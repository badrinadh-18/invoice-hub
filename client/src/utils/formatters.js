export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  const curr = currency || 'INR';
  try {
    const locale = curr.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    return `${curr} ${num.toFixed(2)}`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getStatusBadgeConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'partially_paid':
      return {
        label: 'Partially Paid',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'unpaid':
      return {
        label: 'Unpaid',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'overdue':
      return {
        label: 'Overdue',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    case 'draft':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
    case 'void':
      return {
        label: 'Void',
        bg: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
        dot: 'bg-gray-400'
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
  }
};
