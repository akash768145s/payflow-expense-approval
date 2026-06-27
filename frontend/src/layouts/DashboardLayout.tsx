import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../features/auth/authSlice';
import { toggleDarkMode } from '../features/ui/uiSlice';
import { addToast } from '../features/ui/uiSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  CreditCard as CardIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Bell,
  Landmark,
  Menu,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, initialized } = useSelector((state: RootState) => state.auth);
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  const activeView = searchParams.get('view') || 'dashboard';

  // Sync dark mode class with HTML tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (initialized && !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      dispatch(addToast({ type: 'success', message: 'Logged out successfully' }));
      navigate('/login');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Logout failed' }));
    }
  };

  const setView = (viewName: string) => {
    setSearchParams({ view: viewName });
  };

  // Define sidebar navigation items based on User Role
  const getNavItems = () => {
    const common = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ];

    if (user?.role === 'EMPLOYEE') {
      common.push({ id: 'my-claims', label: 'My Claims', icon: <FileText className="h-4 w-4" /> });
    } else if (user?.role === 'MANAGER') {
      common.push(
        { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="h-4 w-4" /> }
      );
    } else if (user?.role === 'FINANCE') {
      common.push(
        { id: 'payments', label: 'Payments', icon: <CardIcon className="h-4 w-4" /> }
      );
    }

    common.push(
      { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> },
      { id: 'profile', label: 'Profile', icon: <UserIcon className="h-4 w-4" /> }
    );

    return common;
  };

  const navItems = getNavItems();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'EMPLOYEE':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MANAGER':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'FINANCE':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-355';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300 h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 space-x-3">
          <img src="/favicon.png" alt="PayFlow Logo" className="h-8 w-8 object-contain" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            PayFlow SaaS
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-300 z-20 sticky top-0">
          {/* Search / Org info */}
          <div className="flex items-center space-x-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="h-5 w-5" />
            </button>

            {/* Organization Display & Role Badge */}
            {user && (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                  <Landmark className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {user.organizationName || 'Acme Technologies'}
                  </span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                    ID: {user.organizationId.substring(0, 8)}
                  </span>
                </div>
                
                <span className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold tracking-wider uppercase ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            )}
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleDarkMode())}
              className="rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications mock */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* User Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs leading-none text-slate-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView('profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
