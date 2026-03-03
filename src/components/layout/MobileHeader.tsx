'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { SETTINGS_CHANGED_EVENT } from '@/lib/utils';

export function MobileHeader() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [systemName, setSystemName] = useState('PTC QuackTrack');
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setMounted(true);
    }
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
    if (mounted) {
      fetchSettings();
    }
  }, [mounted]);

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

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-[64px] z-[100] bg-gradient-to-r from-emerald-600/95 to-emerald-700/95 backdrop-blur-xl border-b border-emerald-400/30 shadow-lg will-change-transform mt-0">
      <div className="flex items-center justify-between h-full px-4 pt-0">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 shadow-lg shrink-0 -my-2">
            <img src="/logo.png" alt="PTC Logo" className="w-12 h-12 object-contain" />
          </div>
          <span className="font-bold text-xl text-white/95 shrink-0">{systemName}</span>
        </div>

        {/* User Avatar (Visual Only) */}
        <Avatar className="w-9 h-9 ring-2 ring-white/20 shadow-lg shrink-0">
          <AvatarImage src={user?.avatar} alt={user?.name || ''} />
          <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-emerald-900 font-semibold">
            {mounted && user?.name?.charAt(0) ? (
              user.name.charAt(0)
            ) : (
              <User className="w-4 h-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
