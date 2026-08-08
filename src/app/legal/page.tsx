'use client';

import React from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LegalDashboard } from '@/components/legal/LegalDashboard';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <NavigationHeader />
      <LegalDashboard />
    </div>
  );
}
