import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const AuthLayout: React.FC = () => {
  const { user, initialized } = useSelector((state: RootState) => state.auth);

  if (initialized && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <img src="/favicon.png" alt="PayFlow Logo" className="h-14 w-14 object-contain shadow-lg shadow-indigo-500/10 rounded-2xl" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          PayFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Multi-tenant Expense Approval System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-100/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800 transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
