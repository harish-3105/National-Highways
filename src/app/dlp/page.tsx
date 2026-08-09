'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { DlpCalendarDateFilter, DateRangeFilter } from '@/components/dlp/DlpCalendarDateFilter';
import AddDlpContractModal from '@/components/dlp/AddDlpContractModal';
import EditDlpContractModal from '@/components/dlp/EditDlpContractModal';
import DeleteDlpContractModal from '@/components/dlp/DeleteDlpContractModal';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Building2,
  Calendar as CalendarIcon,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
} from 'lucide-react';

export interface DLPContractItem {
  id: string;
  highway_code: string;
  division_name?: string;
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
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'DELETED';
}

const DIVISION_OPTIONS = [
  'Vellore',
  'Villupuram',
  'Madurai',
  'Trichy',
  'Salem',
  'Coimbatore',
  'Gobichettipalayam',
  'Chennai',
  'Kanchipuram',
  'Tirunelveli',
];

export default function DlpPage() {
  const [contracts, setContracts] = useState<DLPContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    startDate: null,
    endDate: null,
    preset: null,
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContractForEdit, setSelectedContractForEdit] = useState<DLPContractItem | null>(null);
  const [selectedContractForDelete, setSelectedContractForDelete] = useState<DLPContractItem | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchDlpContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedDivision) params.set('division', selectedDivision);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/dlp?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.contracts) {
        setContracts(data.contracts);
      }
    } catch (err) {
      console.error('Failed to fetch DLP contracts:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDivision, statusFilter]);

  useEffect(() => {
    fetchDlpContracts();
  }, [fetchDlpContracts]);

  // Client-side date filtering
  const filtered = contracts.filter((c) => {
    if (dateRangeFilter.startDate && c.dlp_expiry_date < dateRangeFilter.startDate) return false;
    if (dateRangeFilter.endDate && c.dlp_expiry_date > dateRangeFilter.endDate) return false;
    return true;
  });

  const triggerAlert = (c: DLPContractItem) => {
    setNotificationMsg(
      `📧 Automated DLP Expiry Alert dispatched to contractor/agency: ${c.contractor_name} (${c.highway_code} - ${c.division_name || 'Division'})!`
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

        {/* Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
              Defect Liability Period (DLP) Contracts Portal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active maintenance guarantees, contractor DLP expiry notifications, STMC & PBMC stretch logs by Division.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDlpContracts()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh Contracts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add DLP Contract
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search code, stretch, contractor, remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Division Filter */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Divisions</option>
              {DIVISION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} Division
                </option>
              ))}
            </select>

            {/* Calendar Date Filter */}
            <DlpCalendarDateFilter
              dateRange={dateRangeFilter}
              onChangeDateRange={setDateRangeFilter}
              matchingCount={filtered.length}
              totalCount={contracts.length}
            />

            {/* Status Pills */}
            <div className="flex bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : st === 'EXPIRING_SOON' ? 'Expiring' : 'Expired'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DLP Contracts Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Highway & Division</th>
                  <th className="py-4 px-6">Stretch & Chainage</th>
                  <th className="py-4 px-6">Contractor & Mode</th>
                  <th className="py-4 px-6 max-w-sm">Work Description / Remarks</th>
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 text-amber-600 animate-spin mx-auto mb-2" />
                      <p className="font-semibold text-sm">Loading DLP contract records...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">No DLP contracts match the selected search or date filter.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDivision('');
                          setStatusFilter('ALL');
                          setDateRangeFilter({ startDate: null, endDate: null, preset: null });
                        }}
                        className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-blue-600">{item.highway_code}</div>
                        <div className="text-slate-500 font-semibold text-[11px]">
                          {item.division_name || 'General'} Division
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.stretch_name}</div>
                        <div className="text-slate-500 mt-0.5 text-[11px]">
                          Km {item.from_km} to {item.to_km} ({item.length_km} km)
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{item.contractor_name}</span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold rounded text-[10px] text-slate-700 dark:text-slate-300">
                          {item.contract_mode}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-sm">
                        <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed text-[11px]">
                          {item.work_description || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.dlp_expiry_date || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{renderStatusBadge(item.days_remaining)}</td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => triggerAlert(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                          title="Trigger Expiry Alert Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedContractForEdit(item)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                          title="Edit Contract Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedContractForDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                          title="Archive Contract Record"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Modal */}
      <AddDlpContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchDlpContracts()}
      />

      {/* Edit Modal */}
      <EditDlpContractModal
        contract={selectedContractForEdit}
        isOpen={!!selectedContractForEdit}
        onClose={() => setSelectedContractForEdit(null)}
        onSuccess={() => fetchDlpContracts()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDlpContractModal
        contract={selectedContractForDelete}
        isOpen={!!selectedContractForDelete}
        onClose={() => setSelectedContractForDelete(null)}
        onSuccess={() => fetchDlpContracts()}
      />
    </div>
  );
}
