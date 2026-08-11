'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Road, ShieldAlert, Scale, FileSpreadsheet, UploadCloud, Users, Menu, X } from 'lucide-react';

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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs print-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Header Title (Clickable Link) */}
          <Link
            href="/highways"
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-1 transition-all"
            title="Return to Main Highways Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white font-black shadow-md transition-colors">
              NH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Tamil Nadu National Highways
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  PWD
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Infrastructure Management System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1.5 overflow-x-auto">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
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
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold">{item.label}</div>
                    <div className="text-[10px] opacity-80 font-normal">{item.description}</div>
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
