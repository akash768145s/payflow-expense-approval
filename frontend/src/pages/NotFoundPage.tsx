import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center transition-colors duration-300">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center animate-bounce">
          <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 p-4 text-indigo-600 dark:text-indigo-400">
            <Compass className="h-16 w-16" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Page Not Found
        </h1>

        <p className="text-base text-slate-500 dark:text-slate-400">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex justify-center pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition-all hover:scale-[1.01]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
