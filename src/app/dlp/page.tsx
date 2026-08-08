'use client';

import React, { useState, useEffect } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { DlpCalendarDateFilter, DateRangeFilter } from '@/components/dlp/DlpCalendarDateFilter';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Building2,
  Calendar as CalendarIcon,
  RefreshCw,
} from 'lucide-react';

export interface DLPContractItem {
  id: string;
  highway_code: string;
  stretch_name: string;
  from_km: number;
  to_km: number;
  length_km: number;
  contractor_name: string;
  contract_mode: 'EPC' | 'STMC' | 'PBMC' | 'Annual Plan' | string;
  work_description: string;
  doc_date: string;
  dlp_expiry_date: string;
  days_remaining: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

const SAMPLE_DLP_CONTRACTS: DLPContractItem[] = [
  {
    id: 'dlp-1',
    highway_code: 'NH-181',
    stretch_name: 'Coimbatore - Mettupalayam Stretch',
    from_km: 0,
    to_km: 35.4,
    length_km: 35.4,
    contractor_name: 'L&T Transportation Infrastructure Ltd',
    contract_mode: 'EPC',
    work_description: 'Strengthening and 4-laning with paved shoulders',
    doc_date: '2023-04-15',
    dlp_expiry_date: '2026-09-15',
    days_remaining: 39,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'dlp-2',
    highway_code: 'NH-181',
    stretch_name: 'Mettupalayam - Coonoor Pass',
    from_km: 35.4,
    to_km: 70.0,
    length_km: 34.6,
    contractor_name: 'GVR Infra Projects Ltd',
    contract_mode: 'STMC',
    work_description: 'Hill slope stabilization & retaining wall renewal',
    doc_date: '2024-01-10',
    dlp_expiry_date: '2027-01-10',
    days_remaining: 156,
    status: 'ACTIVE',
  },
  {
    id: 'dlp-3',
    highway_code: 'NH-44',
    stretch_name: 'Hosur - Dharmapuri Section',
    from_km: 0,
    to_km: 84.5,
    length_km: 84.5,
    contractor_name: 'KNR Constructions Ltd',
    contract_mode: 'PBMC',
    work_description: 'Flexible pavement resurfacing & toll plaza maintenance',
    doc_date: '2022-08-01',
    dlp_expiry_date: '2026-08-01',
    days_remaining: -6,
    status: 'EXPIRED',
  },
  {
    id: 'dlp-4',
    highway_code: 'NH-44',
    stretch_name: 'Dharmapuri - Salem Corridor',
    from_km: 84.5,
    to_km: 148.0,
    length_km: 63.5,
    contractor_name: 'IRB Infrastructure Developers',
    contract_mode: 'EPC',
    work_description: 'Rigid pavement construction & flyover junction renewal',
    doc_date: '2023-11-20',
    dlp_expiry_date: '2026-10-21',
    days_remaining: 75,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'dlp-5',
    highway_code: 'NH-48',
    stretch_name: 'Chennai - Kanchipuram Express Corridor',
    from_km: 0,
    to_km: 68.0,
    length_km: 68.0,
    contractor_name: 'GMR Highways Ltd',
    contract_mode: 'EPC',
    work_description: '6-Laning expansion and stormwater drain integration',
    doc_date: '2024-03-01',
    dlp_expiry_date: '2027-03-01',
    days_remaining: 206,
    status: 'ACTIVE',
  },
  {
    id: 'dlp-6',
    highway_code: 'NH-38',
    stretch_name: 'Tiruvannamalai - Villupuram Stretch',
    from_km: 62.0,
    to_km: 120.0,
    length_km: 58.0,
    contractor_name: 'Welspun Enterprises Ltd',
    contract_mode: 'Annual Plan',
    work_description: 'Periodic overlay & safety signage replacement',
    doc_date: '2023-09-10',
    dlp_expiry_date: '2026-08-29',
    days_remaining: 22,
    status: 'EXPIRING_SOON',
  },
];

export default function DlpPage() {
  const [contracts, setContracts] = useState<DLPContractItem[]>(SAMPLE_DLP_CONTRACTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    startDate: null,
    endDate: null,
    preset: null,
  });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDlpContracts() {
      try {
        setLoading(true);
        const res = await fetch('/api/dlp');
        const data = await res.json();
        if (data.success && data.contracts && data.contracts.length > 0) {
          setContracts(data.contracts);
        }
      } catch (err) {
        console.error('Failed to fetch DLP contracts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDlpContracts();
  }, []);

  const filtered = contracts.filter((c) => {
    if (filter !== 'ALL' && c.status !== filter) return false;
    if (dateRangeFilter.startDate && c.dlp_expiry_date < dateRangeFilter.startDate) return false;
    if (dateRangeFilter.endDate && c.dlp_expiry_date > dateRangeFilter.endDate) return false;
    return true;
  });

  const triggerAlert = (c: DLPContractItem) => {
    setNotificationMsg(
      `📧 Automated DLP Expiry Alert dispatched to contractor: ${c.contractor_name} (${c.highway_code})!`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const renderStatusBadge = (days: number) => {
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-extrabold shadow-xs text-xs">
          {days < 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Expired (Action Needed)</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Expiring Soon ({days}d left)</span>
            </>
          )}
        </span>
      );
    }

    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white font-extrabold shadow-xs text-xs">
          <Clock className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Expiring Soon ({days}d left)</span>
        </span>
      );
    }

    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-white font-extrabold shadow-xs text-xs">
          <Clock className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Expiring Soon ({days}d left)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Active ({days}d left)</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notificationMsg && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-sm shadow-md animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
              Defect Liability Period (DLP) Contracts Tracker
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active contractor maintenance guarantees, expiry notifications, and stretch-wise DLP logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DlpCalendarDateFilter
              dateRange={dateRangeFilter}
              onChangeDateRange={setDateRangeFilter}
              matchingCount={filtered.length}
              totalCount={contracts.length}
            />

            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                Filter Status:
              </span>
              <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
                {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filter === st
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Stretches'
                      : st === 'ACTIVE'
                      ? 'Active'
                      : st === 'EXPIRING_SOON'
                      ? 'Expiring Soon'
                      : 'Expired'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DLP Contracts Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Highway Code</th>
                  <th className="py-4 px-6">Stretch & Work Description</th>
                  <th className="py-4 px-6">Contractor Name</th>
                  <th className="py-4 px-6">Contract Mode</th>
                  <th className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>DLP Expiry Date</span>
                    </div>
                  </th>
                  <th className="py-4 px-6">Status & Days</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">No DLP contracts match the selected calendar date filter.</p>
                      <button
                        onClick={() => setDateRangeFilter({ startDate: null, endDate: null, preset: null })}
                        className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Clear Date Filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-blue-600">
                        {item.highway_code}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.stretch_name}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Km {item.from_km} to {item.to_km} ({item.length_km} km) &bull; {item.work_description}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.contractor_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 font-bold rounded-md text-slate-700 dark:text-slate-300">
                          {item.contract_mode}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.dlp_expiry_date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {renderStatusBadge(item.days_remaining)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => triggerAlert(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Trigger Alert</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
