import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, User, Briefcase, CreditCard } from 'lucide-react';

const getButtonStyles = (role: string) => {
  switch (role) {
    case 'EMPLOYEE':
      return 'border-blue-200/60 dark:border-blue-900/20 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300';
    case 'MANAGER':
      return 'border-amber-200/60 dark:border-amber-900/20 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300';
    case 'FINANCE':
      return 'border-purple-200/60 dark:border-purple-900/20 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-purple-750 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300';
    default:
      return 'border-slate-200 dark:border-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300';
  }
};

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAutofill = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ type: 'error', message: 'Please enter email and password' }));
      return;
    }

    try {
      await dispatch(login({ email, passwordPlain: password })).unwrap();
      dispatch(addToast({ type: 'success', message: 'Logged in successfully' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Invalid credentials' }));
    }
  };

  const seedAccounts = [
    { label: 'Acme - Employee (John)', email: 'john@acme.com', role: 'EMPLOYEE' },
    { label: 'Acme - Manager (Bob)', email: 'bob@acme.com', role: 'MANAGER' },
    { label: 'Acme - Finance (David)', email: 'david@acme.com', role: 'FINANCE' },
    { label: 'Globex - Employee (Jane)', email: 'jane@globex.com', role: 'EMPLOYEE' },
    { label: 'Globex - Manager (Frank)', email: 'frank@globex.com', role: 'MANAGER' },
    { label: 'Globex - Finance (Henry)', email: 'henry@globex.com', role: 'FINANCE' },
  ];

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="space-y-1 p-0 pb-6 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription>
          Enter your email and password to access the PayFlow sandbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30 text-sm font-semibold text-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="john@acme.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick fill buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>Autofill Sandbox Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {seedAccounts.map((account) => {
              const Icon = account.role === 'EMPLOYEE' ? User : account.role === 'MANAGER' ? Briefcase : CreditCard;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleAutofill(account.email)}
                  className={`text-left text-[11px] p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all font-bold shadow-none active:scale-[0.97] duration-100 ${getButtonStyles(account.role)}`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{account.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
