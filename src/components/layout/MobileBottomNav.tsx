'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  Calendar,
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
    title: 'Departments',
    href: '/departments',
    icon: Building2,
    roles: ['admin'],
  },
  {
    title: 'Subjects',
    href: '/subjects',
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    title: 'Programs',
    href: '/programs',
    icon: GraduationCap,
    roles: ['admin'],
  },
  {
    title: 'Professors',
    href: '/professors',
    icon: Users,
    roles: ['admin'],
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

interface MobileBottomNavProps {
  onLogoutClick: () => void;
}

/* eslint-disable react-hooks/set-state-in-effect */

export function MobileBottomNav({ onLogoutClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNavItems = navItems.filter((item) =>
    user && item.roles.includes(user.role as 'admin' | 'professor')
  );

  // Don't render until mounted on client to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          <div className="w-[60px] h-9" />
          <div className="w-[60px] h-9" />
          <div className="w-[60px] h-9" />
          <div className="w-[60px] h-9" />
          <div className="w-60px h-9" />
          <div className="w-[60px] h-9" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600/95 to-emerald-700/95 backdrop-blur-xl border-t border-emerald-400/30 safe-area-inset-bottom shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[60px] transition-all duration-200 backdrop-blur-sm',
                isActive
                  ? 'bg-gradient-to-t from-yellow-400/90 to-yellow-500/90 text-emerald-900 shadow-lg shadow-yellow-500/20 border border-yellow-300/50'
                  : 'text-emerald-100/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </button>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={onLogoutClick}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[60px] text-white hover:bg-red-500/90 hover:text-white hover:border-red-400/50 transition-all duration-200 backdrop-blur-sm border border-transparent"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
