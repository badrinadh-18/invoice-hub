import React from 'react';

export default function Card({ children, title, subtitle, action, className = '', noPadding = false }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-150 ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}
