import React from 'react';
import { getStatusBadgeConfig } from '../../utils/formatters';

export default function StatusBadge({ status, className = '' }) {
  const config = getStatusBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      {config.label}
    </span>
  );
}
