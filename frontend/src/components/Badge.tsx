import React from 'react';
import { Status } from '../types';

interface BadgeProps {
  status: Status;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Record<Status, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-500/20',
    SUBMITTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-blue-600/20',
    APPROVED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-amber-600/20',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-red-600/20',
    PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-emerald-600/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-300 transform hover:scale-[1.02] ${styles[status]}`}
    >
      {status}
    </span>
  );
};
