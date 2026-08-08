'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Route,
  ShieldCheck,
  Gavel,
  Upload,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/highways', label: 'Corridors', icon: Route },
  { href: '/dlp', label: 'DLP Contracts', icon: ShieldCheck },
  { href: '/legal', label: 'Legal Cases', icon: Gavel },
  { href: '/ingest', label: 'Ingestion Engine', icon: Upload },
];

export function NavigationHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-extrabold text-sm">
              NH
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                Tamil Nadu National Highways
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Integrated Management & Analytics Portal
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
