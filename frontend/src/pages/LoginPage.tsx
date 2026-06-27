import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

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
    { label: 'Acme - Employee (John)', email: 'john@acme.com' },
    { label: 'Acme - Manager (Bob)', email: 'bob@acme.com' },
    { label: 'Acme - Finance (David)', email: 'david@acme.com' },
    { label: 'Globex - Employee (Jane)', email: 'jane@globex.com' },
    { label: 'Globex - Manager (Frank)', email: 'frank@globex.com' },
    { label: 'Globex - Finance (Henry)', email: 'henry@globex.com' },
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
            {seedAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleAutofill(account.email)}
                className="text-left text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355 transition-all font-semibold"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
