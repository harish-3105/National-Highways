'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Road, ShieldAlert, Scale, FileSpreadsheet, UploadCloud, Users, Building2, Menu, X } from 'lucide-react';

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
  {
    label: 'Data Ingestion',
    href: '/ingest',
    icon: UploadCloud,
    description: 'Bulk Excel & CSV Data Upload Engine',
  },
];


export function NavigationHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
          </nav>
        )}
      </div>
    </header>
  );
}
