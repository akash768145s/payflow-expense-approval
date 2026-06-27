import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { removeToast } from '../features/ui/uiSlice';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useSelector((state: RootState) => state.ui.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: { id: string; type: string; message: string } }> = ({
  toast,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-300',
  };

  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-right-5 ${
        bgColors[toast.type as keyof typeof bgColors] || bgColors.info
      }`}
    >
      <div className="flex items-center space-x-3">
        {icons[toast.type as keyof typeof icons] || icons.info}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="ml-4 shrink-0 rounded-lg p-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-4 w-4 opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
};
