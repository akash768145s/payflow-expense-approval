import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import {
  fetchClaims,
  createClaim,
  updateClaim,
  deleteClaim,
  submitClaim,
  approveClaim,
  rejectClaim,
  markPaidClaim,
  fetchClaimDetails,
  clearCurrentClaim,
} from '../features/claims/claimsSlice';
import { addToast } from '../features/ui/uiSlice';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExpenseClaim } from '../types';
import type { Status } from '../types';
import {
  Plus,
  DollarSign,
  Eye,
  History,
  TrendingUp,
  Inbox,
  Clock,
  Search,
  SendHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const { claims, currentClaim, loading } = useSelector((state: RootState) => state.claims);

  const activeView = searchParams.get('view') || 'dashboard';
  const setView = (viewName: string) => setSearchParams({ view: viewName });

  const handleViewAll = () => {
    if (user?.role === 'EMPLOYEE') {
      setView('my-claims');
    } else if (user?.role === 'MANAGER') {
      setSearchParams({ view: 'approvals', tab: 'all' });
    } else if (user?.role === 'FINANCE') {
      setSearchParams({ view: 'payments', tab: 'all' });
    }
  };

  const getCategoryColor = (name: string) => {
    switch (name) {
      case 'Travel':
        return 'bg-blue-500';
      case 'Meals':
        return 'bg-amber-500';
      case 'Equipment':
        return 'bg-emerald-500';
      case 'Software':
        return 'bg-purple-500';
      case 'Office':
        return 'bg-pink-500';
      default:
        return 'bg-slate-400';
    }
  };

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Form modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ExpenseClaim | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Travel');
  const [description, setDescription] = useState('');

  // Note dialog state (for transition comments)
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteClaimId, setNoteClaimId] = useState('');
  const [noteAction, setNoteAction] = useState<'submit' | 'approve' | 'reject' | 'pay' | null>(null);
  const [noteText, setNoteText] = useState('');

  // AlertDialog states (replaces window.confirm)
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [alertAction, setAlertAction] = useState<(() => void) | null>(null);

  // Detail Modal state
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchClaims());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingClaim(null);
    setAmount('');
    setCategory('Travel');
    setDescription('');
    setFormOpen(true);
  };

  const handleOpenEdit = (claim: ExpenseClaim) => {
    setEditingClaim(claim);
    setAmount(claim.amount);
    setCategory(claim.category);
    setDescription(claim.description);
    setFormOpen(true);
  };

  const handleSaveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      dispatch(addToast({ type: 'error', message: 'Amount must be greater than 0' }));
      return;
    }
    if (!category.trim()) {
      dispatch(addToast({ type: 'error', message: 'Category is required' }));
      return;
    }

    try {
      if (editingClaim) {
        await dispatch(
          updateClaim({
            id: editingClaim.id,
            amount: amtNum,
            category,
            description,
          })
        ).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim updated successfully' }));
      } else {
        await dispatch(
          createClaim({
            amount: amtNum,
            category,
            description,
          })
        ).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim created successfully' }));
      }
      setFormOpen(false);
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to save claim' }));
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setAlertTitle('Delete Draft Expense Claim?');
    setAlertDescription('This action cannot be undone. This claim will be permanently deleted from the database.');
    setAlertAction(() => async () => {
      try {
        await dispatch(deleteClaim(id)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim deleted successfully' }));
        setAlertOpen(false);
      } catch (err: any) {
        dispatch(addToast({ type: 'error', message: err || 'Failed to delete claim' }));
      }
    });
    setAlertOpen(true);
  };

  const handleOpenNoteModal = (id: string, action: 'submit' | 'approve' | 'reject' | 'pay') => {
    setNoteClaimId(id);
    setNoteAction(action);
    setNoteText('');
    setNoteOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!noteClaimId || !noteAction) return;

    try {
      const payload = { id: noteClaimId, note: noteText };
      if (noteAction === 'submit') {
        await dispatch(submitClaim(payload)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim submitted successfully' }));
      } else if (noteAction === 'approve') {
        await dispatch(approveClaim(payload)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim approved successfully' }));
      } else if (noteAction === 'reject') {
        await dispatch(rejectClaim(payload)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim rejected successfully' }));
      } else if (noteAction === 'pay') {
        await dispatch(markPaidClaim(payload)).unwrap();
        dispatch(addToast({ type: 'success', message: 'Claim marked as PAID' }));
      }
      setNoteOpen(false);
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Action failed' }));
    }
  };

  const handleOpenDetails = (id: string) => {
    dispatch(fetchClaimDetails(id));
    setDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    dispatch(clearCurrentClaim());
  };

  const formatCurrency = (amt: string | number) => {
    const value = typeof amt === 'string' ? parseFloat(amt) : amt;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status: Status) => {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'SUBMITTED':
        return 'submitted';
      case 'APPROVED':
        return 'approved';
      case 'REJECTED':
        return 'rejected';
      case 'PAID':
        return 'paid';
      default:
        return 'default';
    }
  };

  // Filtered claims based on search input
  const filteredClaims = useMemo(() => {
    if (!searchTerm.trim()) return claims;
    const term = searchTerm.toLowerCase();
    return claims.filter(
      (c) =>
        c.category.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term)) ||
        (c.createdBy?.name && c.createdBy.name.toLowerCase().includes(term))
    );
  }, [claims, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = claims.length;
    const sum = claims.reduce((acc, c) => acc + parseFloat(c.amount), 0);
    const drafts = claims.filter((c) => c.status === 'DRAFT').length;
    const submitted = claims.filter((c) => c.status === 'SUBMITTED').length;
    const approved = claims.filter((c) => c.status === 'APPROVED').length;
    const paid = claims.filter((c) => c.status === 'PAID').length;
    const paidSum = claims.filter((c) => c.status === 'PAID').reduce((acc, c) => acc + parseFloat(c.amount), 0);

    return { total, sum, drafts, submitted, approved, paid, paidSum };
  }, [claims]);

  // Spending category allocations calculation
  const categorySpending = useMemo(() => {
    const sums: Record<string, number> = {
      Travel: 0,
      Meals: 0,
      Equipment: 0,
      Software: 0,
      Office: 0,
      Other: 0,
    };
    
    const confirmedClaims = claims.filter(c => c.status === 'APPROVED' || c.status === 'PAID');
    let totalConfirmedSum = 0;
    confirmedClaims.forEach(c => {
      const amt = parseFloat(c.amount);
      if (sums[c.category] !== undefined) {
        sums[c.category] += amt;
      } else {
        sums.Other += amt;
      }
      totalConfirmedSum += amt;
    });

    return Object.entries(sums).map(([name, amount]) => {
      const percentage = totalConfirmedSum > 0 ? Math.round((amount / totalConfirmedSum) * 100) : 0;
      return { name, amount, percentage };
    }).sort((a, b) => b.amount - a.amount);
  }, [claims]);



  // Renders the statistics cards
  const renderStatsGrid = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Total Volume
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold">{formatCurrency(stats.sum)}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.total} total submitted claims
          </p>
        </CardContent>
      </Card>

      {user?.role === 'EMPLOYEE' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Draft Claims
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.drafts}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Claims awaiting submission
            </p>
          </CardContent>
        </Card>
      )}

      {(user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approval
            </CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.submitted}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Awaiting manager review
            </p>
          </CardContent>
        </Card>
      )}

      {user?.role === 'FINANCE' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Awaiting Payment
            </CardTitle>
            <Inbox className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.approved}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Approved claims to disburse
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Reimbursed Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.paidSum)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.paid} claims successfully paid
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Renders standard header controls for tables
  const renderTableToolbar = () => (
    <div className="flex items-center space-x-2 shrink-0">
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>
    </div>
  );

  // Render empty state template
  const renderEmptyState = (title: string, desc: string, action?: { label: string; onClick: () => void }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
      <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{desc}</p>
      {action && (
        <Button onClick={action.onClick} className="rounded-xl shadow-md">
          {action.label}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Dashboard Page Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {activeView === 'dashboard'
              ? 'Overview'
              : activeView === 'my-claims'
              ? 'My Claims'
              : activeView === 'approvals'
              ? 'Approvals Queue'
              : activeView === 'payments'
              ? 'Disbursement Queue'
              : activeView === 'audit-logs'
              ? 'Security Audits'
              : activeView === 'settings'
              ? 'System Configuration'
              : 'User Account'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeView === 'dashboard' && 'Core financial statistics and recent activities.'}
            {activeView === 'my-claims' && 'Manage, submit, and track your individual expense reimbursement claims.'}
            {activeView === 'approvals' && 'Review expense reports submitted by employee organization members.'}
            {activeView === 'payments' && 'Disburse funds for manager-approved business expenditures.'}
            {activeView === 'audit-logs' && 'Security log of all state machine transitions and audit comments.'}
            {activeView === 'settings' && 'Overview of SaaS tenant boundaries, sandbox security, and RBAC rules.'}
            {activeView === 'profile' && 'Authenticated user attributes and authorization roles.'}
          </p>
        </div>

        {user?.role === 'EMPLOYEE' && (activeView === 'dashboard' || activeView === 'my-claims') && (
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-indigo-500/10 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> File New Expense
          </Button>
        )}
      </div>

      {/* 2. Stats Summary Banner */}
      {(activeView === 'dashboard' || activeView === 'my-claims' || activeView === 'approvals' || activeView === 'payments') &&
        renderStatsGrid()}

      {/* 3. CONDITIONAL VIEWS RENDERING */}

      {/* VIEW A: Main Dashboard Overview */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Claims List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Recent claims filed in organization.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewAll}>
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user?.role !== 'EMPLOYEE' && <TableHead className="w-1/3">Creator</TableHead>}
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[140px]">Amount</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && claims.length === 0 ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : claims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          No claims filed yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      claims.slice(0, 5).map((claim) => (
                        <TableRow key={claim.id}>
                          {user?.role !== 'EMPLOYEE' && (
                            <TableCell className="w-1/3 font-semibold text-slate-900 dark:text-slate-100">
                              {claim.createdBy?.name}
                            </TableCell>
                          )}
                          <TableCell>{claim.category}</TableCell>
                          <TableCell className="w-[140px] font-bold">{formatCurrency(claim.amount)}</TableCell>
                          <TableCell className="w-[140px]">
                            <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                          </TableCell>
                          <TableCell className="w-[100px] text-right">
                            <Button onClick={() => handleOpenDetails(claim.id)} className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="View Detail">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Spending Allocation Card */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle>Spending Allocation</CardTitle>
                <CardDescription>
                  {user?.role === 'EMPLOYEE' ? 'Your approved & paid expenses.' : 'Organization approved & paid expenses.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {categorySpending.filter(c => c.amount > 0).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic space-y-1">
                    <p>No confirmed spending yet.</p>
                    <p className="text-[10px]">Approved and paid claims will allocate here.</p>
                  </div>
                ) : (
                  categorySpending.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                        <span className="font-bold">
                          {formatCurrency(cat.amount)}{' '}
                          <span className="text-slate-400 dark:text-slate-500 font-normal">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getCategoryColor(cat.name)}`} style={{ width: `${cat.percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW B: My Claims list (Employee only) */}
      {activeView === 'my-claims' && user?.role === 'EMPLOYEE' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <CardTitle>Claims Archive</CardTitle>
              <CardDescription>All expense reports submitted by you.</CardDescription>
            </div>
            {renderTableToolbar()}
          </CardHeader>
          <CardContent className="p-0">
            {filteredClaims.length === 0 ? (
              renderEmptyState('No claims found', 'Create a new expense claim to get started.', {
                label: 'Create Expense Claim',
                onClick: handleOpenCreate,
              })
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px]">Amount</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[180px]">Date Filed</TableHead>
                    <TableHead className="w-[180px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="w-[180px] font-bold">{claim.category}</TableCell>
                      <TableCell className="max-w-xs truncate">{claim.description}</TableCell>
                      <TableCell className="w-[140px] font-bold text-slate-900 dark:text-white">
                        {formatCurrency(claim.amount)}
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                      </TableCell>
                      <TableCell className="w-[180px] text-xs text-slate-500">{formatDate(claim.createdAt)}</TableCell>
                      <TableCell className="w-[180px] text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {claim.status === 'DRAFT' && (
                            <>
                              <Button onClick={() => handleOpenNoteModal(claim.id, 'submit')} className="h-8 w-8 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="Submit claim">
                                <SendHorizontal className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleOpenEdit(claim)} className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="Edit draft">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleDeleteTrigger(claim.id)} className="h-8 w-8 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="Delete draft">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button onClick={() => handleOpenDetails(claim.id)} className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* VIEW C: Approvals Queue (Manager only) */}
      {activeView === 'approvals' && user?.role === 'MANAGER' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
            <div>
              <CardTitle>Approvals Manager</CardTitle>
              <CardDescription>Review and track organization expenditures.</CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
              <Tabs value={searchParams.get('tab') || 'pending'} onValueChange={(val) => setSearchParams({ view: 'approvals', tab: val })}>
                <TabsList>
                  <TabsTrigger value="pending">Pending Queue</TabsTrigger>
                  <TabsTrigger value="all">All Expenses</TabsTrigger>
                </TabsList>
              </Tabs>
              {renderTableToolbar()}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClaims.filter((c) => (searchParams.get('tab') === 'all' ? true : c.status === 'SUBMITTED')).length === 0 ? (
              renderEmptyState(
                searchParams.get('tab') === 'all' ? 'No claims found' : 'Queue Clear',
                searchParams.get('tab') === 'all' ? 'No claims have been filed in your organization yet.' : 'There are no claims awaiting manager approval.'
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Creator</TableHead>
                    <TableHead className="w-[150px]">Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px]">Amount</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[180px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims
                    .filter((c) => (searchParams.get('tab') === 'all' ? true : c.status === 'SUBMITTED'))
                    .map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="w-1/3">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {claim.createdBy?.name}
                            </div>
                            <div className="text-xs text-slate-500">{claim.createdBy?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">{claim.category}</TableCell>
                        <TableCell className="max-w-xs truncate">{claim.description}</TableCell>
                        <TableCell className="w-[140px] font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(claim.amount)}
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                        </TableCell>
                        <TableCell className="w-[180px] text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {claim.status === 'SUBMITTED' && claim.createdById !== user.id ? (
                              <>
                                <Button onClick={() => handleOpenNoteModal(claim.id, 'approve')} className="h-8 w-8 p-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="Approve claim">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleOpenNoteModal(claim.id, 'reject')} className="h-8 w-8 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="Reject claim">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : claim.createdById === user.id && claim.status === 'SUBMITTED' ? (
                              <span className="text-xs text-slate-400 italic mr-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md">Self-created</span>
                            ) : null}
                            <Button onClick={() => handleOpenDetails(claim.id)} className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* VIEW D: Payments View (Finance only) */}
      {activeView === 'payments' && user?.role === 'FINANCE' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
            <div>
              <CardTitle>Disbursements Manager</CardTitle>
              <CardDescription>Mark approved expense reports as paid.</CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
              <Tabs value={searchParams.get('tab') || 'pending'} onValueChange={(val) => setSearchParams({ view: 'payments', tab: val })}>
                <TabsList>
                  <TabsTrigger value="pending">Pending Queue</TabsTrigger>
                  <TabsTrigger value="all">All Expenses</TabsTrigger>
                </TabsList>
              </Tabs>
              {renderTableToolbar()}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClaims.filter((c) => (searchParams.get('tab') === 'all' ? true : c.status === 'APPROVED')).length === 0 ? (
              renderEmptyState(
                searchParams.get('tab') === 'all' ? 'No claims found' : 'Queue Clear',
                searchParams.get('tab') === 'all' ? 'No claims have been filed in your organization yet.' : 'There are no approved claims waiting for disbursement.'
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Creator</TableHead>
                    <TableHead className="w-[150px]">Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px]">Amount</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[180px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims
                    .filter((c) => (searchParams.get('tab') === 'all' ? true : c.status === 'APPROVED'))
                    .map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="w-1/3">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {claim.createdBy?.name}
                            </div>
                            <div className="text-xs text-slate-500">{claim.createdBy?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">{claim.category}</TableCell>
                        <TableCell className="max-w-xs truncate">{claim.description}</TableCell>
                        <TableCell className="w-[140px] font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(claim.amount)}
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                        </TableCell>
                        <TableCell className="w-[180px] text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {claim.status === 'APPROVED' ? (
                              <Button onClick={() => handleOpenNoteModal(claim.id, 'pay')} className="h-8 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-lg shadow-none active:scale-95 duration-100 transition-all px-2.5 space-x-1" title="Mark Paid">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold">Pay</span>
                              </Button>
                            ) : null}
                            <Button onClick={() => handleOpenDetails(claim.id)} className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none active:scale-95 duration-100 transition-all" title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}



      {/* VIEW F: Settings page */}
      {activeView === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System & Sandbox Properties</CardTitle>
              <CardDescription>Multi-tenant authorization sandbox setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Organization Name</span>
                  <span className="text-lg font-bold">{user?.organizationName}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tenant Organization ID</span>
                  <span className="text-sm font-mono block text-indigo-500 select-all">{user?.organizationId}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h3 className="font-bold text-base">Prisma RLS Emulation</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Every query executed by the backend repositories strictly attaches `organizationId` from the verified session context. Under zero circumstances can a user of organization A query or modify records of organization B, even by executing target resource APIs with ID spoofing.
                </p>
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 text-xs leading-relaxed text-indigo-800 dark:text-indigo-400 space-y-2">
                  <p className="font-bold">✓ Tenant Isolation Confirmed</p>
                  <p>In the Vitest suites, attempts to fetch or mutate cross-tenant IDs assert `404 Not Found` rather than `403 Forbidden` to hide resource existence entirely.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW G: Profile Page */}
      {activeView === 'profile' && user && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Your account parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 font-semibold">User Name</span>
              <span className="font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 font-semibold">Email Address</span>
              <span className="font-bold font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 font-semibold">Authorization Role</span>
              <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{user.role}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 font-semibold">Tenant ID</span>
              <span className="font-mono text-xs">{user.organizationId}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. MODALS AND DIALOGS */}

      {/* CREATE & EDIT CLAIM DIALOG */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClaim ? 'Edit Expense Claim' : 'File Expense Claim'}</DialogTitle>
            <DialogDescription>
              File a new reimbursement claim. Amount must be greater than zero.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClaim} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (USD)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description (Max 1000 characters)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Taxi booking, client lunch, monitor, etc..."
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl shadow-md">
                Save Expense Claim
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TRANSITION COMMENT NOTE DIALOG */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteAction === 'submit' && 'Submit Claim for Review'}
              {noteAction === 'approve' && 'Approve Expense Claim'}
              {noteAction === 'reject' && 'Reject Expense Claim'}
              {noteAction === 'pay' && 'Disburse Expense Payment'}
            </DialogTitle>
            <DialogDescription>
              {noteAction === 'submit' && 'Submit this claim to your manager. You can optionally attach an audit note.'}
              {noteAction === 'approve' && 'Confirm approval of this expenditure. You can optionally attach an audit note.'}
              {noteAction === 'reject' && 'Please state the reason for rejecting this claim. Rejection notes are required.'}
              {noteAction === 'pay' && 'Disburse payment for this approved expense claim.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Comment</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={noteAction === 'reject' ? 'Reason for rejection (Required)...' : 'Optional comments...'}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setNoteOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleExecuteAction}
                disabled={noteAction === 'reject' && !noteText.trim()}
                className={`rounded-xl shadow-sm ${
                  noteAction === 'reject'
                    ? buttonVariants({ variant: 'destructive' })
                    : noteAction === 'pay'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION ALERT DIALOG (REPLACES WINDOW.CONFIRM) */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => alertAction && alertAction()} className="rounded-xl">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DETAILED CLAIM POPUP WITH AUDIT LOG TIMELINE */}
      <Dialog open={detailOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle>Expense Claim Audit File</DialogTitle>
            <DialogDescription>Full details and security timeline trace.</DialogDescription>
          </DialogHeader>

          {currentClaim ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentClaim.category}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Amount</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-lg">
                      {formatCurrency(currentClaim.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(currentClaim.status)}>{currentClaim.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Created By</span>
                    <span className="font-bold text-xs">{currentClaim.createdBy?.name} ({currentClaim.createdBy?.role})</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                  <p className="mt-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-xs">
                    {currentClaim.description || <span className="italic opacity-40">No description provided</span>}
                  </p>
                </div>

                {/* Audit timeline */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <History className="mr-2 h-4 w-4 text-indigo-500" /> Audit Log Timeline
                  </span>
                  <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4 ml-2">
                    {currentClaim.auditLogs && currentClaim.auditLogs.length > 0 ? (
                      currentClaim.auditLogs.map((log) => (
                        <div key={log.id} className="relative">
                          {/* Timeline dot */}
                          <span className="absolute -left-[21px] mt-1 bg-indigo-500 rounded-full h-2.5 w-2.5 border-2 border-white dark:border-slate-900" />
                          
                          <div className="text-[11px] text-slate-500 dark:text-slate-450 flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {log.changedBy?.name} ({log.changedBy?.role})
                            </span>
                            <span className="font-mono text-[10px]">{formatDate(log.createdAt)}</span>
                          </div>
                          
                          <p className="text-[11px] font-semibold mt-1">
                            Changed status from <span className="text-slate-500 font-bold">{log.fromStatus}</span> ➔{' '}
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{log.toStatus}</span>
                          </p>
                          
                          {log.note && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded border border-dashed border-slate-200 dark:border-slate-850 mt-1.5">
                              &ldquo;{log.note}&rdquo;
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-450 italic">No audit log events recorded (DRAFT status).</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button variant="outline" onClick={handleCloseDetails} className="rounded-xl w-full sm:w-auto">
                  Close Details
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-6 py-12 text-center text-slate-400 space-y-2">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper for button variant mapping
function buttonVariants(opts?: { variant?: string; size?: string }) {
  const v = opts?.variant || 'default';
  const s = opts?.size || 'default';
  
  const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] duration-100';
  
  const variants = {
    default: 'bg-indigo-600 text-white shadow hover:bg-indigo-500 shadow-indigo-500/10',
    destructive: 'bg-red-600 text-white shadow hover:bg-red-500 shadow-red-500/10',
    outline: 'border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-50',
    secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
    ghost: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
    link: 'text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3 text-xs',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-9 w-9 p-0',
  };

  return `${base} ${variants[v as keyof typeof variants]} ${sizes[s as keyof typeof sizes]}`;
}
