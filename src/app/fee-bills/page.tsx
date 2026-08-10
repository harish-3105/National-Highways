import React from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { FeeBillManagementPortal } from '@/components/fee-bills/FeeBillManagementPortal';

export const metadata = {
  title: 'Legal Fee Bill Portal | Tamil Nadu Highways Department',
  description: 'Manage advocate fee vouchers, assistance fee auto-calculations, government order (G.O.) approvals, and inter-office pendency tracking.',
};

export default function FeeBillsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <NavigationHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FeeBillManagementPortal />
      </main>
    </div>
  );
}
