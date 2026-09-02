'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Road,
  ShieldAlert,
  Scale,
  FileSpreadsheet,
  Users,
  Building2,
  Menu,
  X,
  Lock,
  Unlock,
  LogOut,
  User,
  ShieldCheck,
  History,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { SessionUser } from '@/lib/auth/session';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Corridors Catalog',
    href: '/highways',
    icon: Road,
    description: 'Level 1 Highways & Level 2 Sub-Chainage PCU Data',
  },
  {
    label: 'DLP Maintenance',
    href: '/dlp',
    icon: ShieldAlert,
    description: 'Defect Liability Period & STMC/PBMC Stretches',
  },
  {
    label: 'Ongoing Works',
    href: '/ongoing-works',
    icon: Building2,
    description: 'Capital Highway Works, Stage Monitoring & CM Review Extracts',
  },
  {
    label: 'Legal Cases',
    href: '/legal',
    icon: Scale,
    description: 'Court Cases, Counter Affidavits & Status Tracking',
  },
  {
    label: 'Fee Bills Portal',
    href: '/fee-bills',
    icon: FileSpreadsheet,
    description: 'Lawyer Legal Assistance Bills & Pendency Tracking',
  },
  {
    label: 'Staff Portal',
    href: '/staff',
    icon: Users,
    description: 'Personnel Directory & Organizational Unit Staff Records',
  },
];

export function NavigationHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);

  // Fetch Session on Mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setIsLockdownActive(Boolean(data.user.isLockdownActive));
          }
        }
      } catch (err) {
        console.error('Error fetching session header:', err);
      }
    }
    loadSession();
  }, [pathname]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Handle Master Lockdown Toggle
  const handleToggleLockdown = async () => {
    if (!currentUser) return;
    const targetState = !isLockdownActive;
    const confirmMsg = targetState
      ? 'Are you sure you want to ACTIVATE the Statewide Emergency Freeze? All non-admin users will immediately convert to Read-Only.'
      : 'Are you sure you want to DEACTIVATE the Emergency Freeze and restore normal write permissions?';

    if (!window.confirm(confirmMsg)) return;

    setIsTogglingLockdown(true);
    try {
      const res = await fetch('/api/admin/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: targetState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle lockdown');

      setIsLockdownActive(data.isLockdownActive);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error toggling emergency lockdown.');
    } finally {
      setIsTogglingLockdown(false);
    }
  };

  const canToggleLockdown =
    currentUser?.isSuperAdmin ||
    currentUser?.permissions.includes('system:lockdown_toggle') ||
    currentUser?.permissions.includes('*:*');

  const canViewGlobalAudit =
    currentUser?.isSuperAdmin ||
    currentUser?.permissions.includes('system:audit_view') ||
    currentUser?.permissions.includes('*:*');

  return (
    <>
      {/* Emergency Lockdown Statewide Red Banner */}
      {isLockdownActive && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md print-hide">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
            <span>
              <strong>EMERGENCY READ-ONLY LOCKDOWN ACTIVE:</strong> Write, edit, and delete operations are temporarily frozen across all statewide modules.
            </span>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print-hide">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo & Header Title */}
            <Link
              href="/highways"
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 p-1 transition-all"
              title="Return to Main Highways Dashboard"
            >
              <div className="w-8 h-8 rounded-xs bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white font-black text-xs transition-colors">
                NH
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                    Tamil Nadu National Highways
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-xs text-[9.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                    PWD
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                  Integrated Management & Analytics Portal
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links (VS Code Tab Bar Style) */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 overflow-x-auto h-full pt-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/highways' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/80'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                    }`}
                    title={item.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Master Lockdown Switch & User Profile Dropdown */}
            <div className="flex items-center gap-2.5">
              {/* Master Lockdown Switch for Admins */}
              {canToggleLockdown && (
                <button
                  type="button"
                  onClick={handleToggleLockdown}
                  disabled={isTogglingLockdown}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-xs border transition-all cursor-pointer shadow-xs ${
                    isLockdownActive
                      ? 'bg-red-600 border-red-700 text-white hover:bg-red-700 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-400'
                  }`}
                  title="Master Emergency Lockdown Switch: Freeze all non-admin write operations statewide"
                >
                  {isTogglingLockdown ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isLockdownActive ? (
                    <Lock className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{isLockdownActive ? 'LOCKDOWN ON' : 'Lockdown'}</span>
                </button>
              )}

              {/* User Avatar & Identity Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-xs bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[9.5px] text-blue-600 dark:text-blue-400 font-semibold leading-none">
                        {currentUser.roleName}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700/60">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">+91 {currentUser.phoneNumber}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.2 rounded-xs text-[9.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {currentUser.roleName} (Pos {currentUser.position})
                          </span>
                          <span className="px-1.5 py-0.2 rounded-xs text-[9.5px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                            {currentUser.jurisdictionScope}
                          </span>
                        </div>
                      </div>

                      {canViewGlobalAudit && (
                        <Link
                          href="/admin/audit"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-blue-500" />
                          <span>Statewide Audit Logs</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-700/60 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xs transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </Link>
              )}

              {/* Mobile Hamburger Toggle Button */}
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1 animate-in slide-in-from-top-2 duration-150">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/highways' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-all border-l-2 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold">{item.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{item.description}</div>
                    </div>
                  </Link>
                );
              })}

              {canToggleLockdown && (
                <button
                  type="button"
                  onClick={handleToggleLockdown}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xs mt-2"
                >
                  <span>Toggle Statewide Lockdown</span>
                  <span>{isLockdownActive ? 'ACTIVE' : 'OFF'}</span>
                </button>
              )}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
