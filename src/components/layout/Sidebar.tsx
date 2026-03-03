'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn, SETTINGS_CHANGED_EVENT } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  Calendar as CalendarIcon,
  User,
  Building2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('admin' | 'professor')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    title: 'Subjects',
    href: '/subjects',
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    title: 'Programs & Sections',
    href: '/programs',
    icon: School,
    roles: ['admin'],
  },
  {
    title: 'Departments',
    href: '/departments',
    icon: Building2,
    roles: ['admin'],
  },
  {
    title: 'Professors',
    href: '/professors',
    icon: GraduationCap,
    roles: ['admin'],
  },
  {
    title: 'My Schedule',
    href: '/my-schedule',
    icon: CalendarIcon,
    roles: ['professor'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['professor'],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [systemName, setSystemName] = useState('PTC QuackTrack');

  // Set isClient to true on client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch system name from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings?.systemName) {
          setSystemName(data.settings.systemName);
        }
      } catch (error) {
        console.error('Failed to fetch system name:', error);
      }
    };
    if (isClient) {
      fetchSettings();
    }
  }, [isClient]);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      const fetchSettings = async () => {
        try {
          const res = await fetch('/api/settings');
          const data = await res.json();
          if (data.settings?.systemName) {
            setSystemName(data.settings.systemName);
          }
        } catch (error) {
          console.error('Failed to fetch system name:', error);
        }
      };
      fetchSettings();
    };

    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChange);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const filteredNavItems = navItems.filter((item) =>
    user && item.roles.includes(user.role as 'admin' | 'professor')
  );

  // Don't render interactive elements until mounted on client
  if (!isClient) {
    return (
      <div className="w-64 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-white/10 animate-pulse"></div>
            </div>
            <span className="font-bold text-lg">{systemName}</span>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="h-8 bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-8 bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-8 bg-slate-700 rounded animate-pulse mb-2" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 text-white h-screen transition-all duration-300 sticky top-0 left-0 z-50',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-400/20 bg-white/5 backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 shadow-lg">
              <img src="/logo.png" alt="PTC Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-bold text-xl text-white/95">{systemName}</span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 shadow-lg mx-auto">
            <img src="/logo.png" alt="PTC Logo" className="w-8 h-8 object-contain" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/90 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/20"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Button
              key={item.href}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start backdrop-blur-sm transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 text-emerald-900 hover:from-yellow-400 hover:to-yellow-500 shadow-lg shadow-yellow-500/20 border border-yellow-300/50'
                  : 'text-emerald-100/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20',
                collapsed && 'justify-center px-2'
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.title}</span>}
            </Button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-emerald-400/20 bg-white/5 backdrop-blur-sm">
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="ring-2 ring-white/20 shadow-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-emerald-900 font-semibold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white/95">{user.name}</p>
              <p className="text-xs text-emerald-200/80 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 text-white font-semibold backdrop-blur-md border border-red-400/50 shadow-lg shadow-red-500/20 transition-all duration-200',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleLogoutClick}
        >
          <LogOut className={cn('w-5 h-5', !collapsed && 'mr-3')} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="z-[9999] bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/60 backdrop-blur-md border border-emerald-200/50 hover:bg-white/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 text-white font-semibold backdrop-blur-md border border-red-400/50 shadow-lg shadow-red-500/20 transition-all duration-200">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
