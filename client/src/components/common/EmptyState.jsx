import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      {description && <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={actionIcon} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
