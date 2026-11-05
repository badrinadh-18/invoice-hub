import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size] || 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-slate-500">
      <Loader2 className={`${sizeClasses} animate-spin text-brand-700 mb-2`} />
      {text && <span className="text-sm font-medium text-slate-600">{text}</span>}
    </div>
  );
}
