'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  ShieldCheck,
  Briefcase,
  FileSpreadsheet,
  Building2,
  DollarSign,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Corridors Catalog',
    href: '/highways',
    icon: MapPin,
    description: 'Level 1 Ground-Truth & Level 2 Sub-Chainages',
  },
  {
    label: 'DLP Maintenance',
    href: '/dlp',
    icon: ShieldCheck,
    description: 'Defect Liability Warranty Contracts',
  },
  {
    label: 'Legal Cases',
    href: '/legal',
    icon: Briefcase,
    description: 'Madras High Court & Counter Affidavit Tracker',
  },
  {
    label: 'Legal Fee Bills',
    href: '/fee-bills',
    icon: DollarSign,
    description: 'Advocate Fee Vouchers & Pendency Portal',
  },
  {
    label: 'Data Ingestion',
    href: '/ingest',
    icon: FileSpreadsheet,
    description: 'Excel / CSV Automated Ingestion Engine',
  },
];

export function NavigationHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
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

          {/* Navigation Links */}
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
        </div>
      </div>
    </header>
  );
}
