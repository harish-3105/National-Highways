'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { DEFAULT_MASTER_DATA } from '@/lib/feeBillMasterData';
import { FeeBillListTable } from './FeeBillListTable';
import { FeeBillDataEntryForm } from './FeeBillDataEntryForm';
import { FeeBillPendencyTracker } from './FeeBillPendencyTracker';
import { FeeBillAnalysisDashboard } from './FeeBillAnalysisDashboard';
import { MasterDataManagement } from './MasterDataManagement';
import { FeeBillDetailModal } from './FeeBillDetailModal';
import { FeeBillAuditModal } from './FeeBillAuditModal';
import {
  FileText,
  Plus,
  Clock,
  PieChart,
  Settings,
  Search,
  AlertTriangle,
  Archive,
} from 'lucide-react';

export function FeeBillManagementPortal() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'pendency' | 'analytics' | 'settings'>('list');
  const [bills, setBills] = useState<FeeBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<FeeBillMasterDataConfig>(DEFAULT_MASTER_DATA);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [viewingBill, setViewingBill] = useState<FeeBillRecord | null>(null);
  const [editingBill, setEditingBill] = useState<FeeBillRecord | null>(null);
  const [auditingBill, setAuditingBill] = useState<FeeBillRecord | null>(null);
  const [deletingBill, setDeletingBill] = useState<FeeBillRecord | null>(null);

  const fetchFeeBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCircle) params.set('circle', selectedCircle);
      if (selectedDivision) params.set('division', selectedDivision);
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter);
      if (showArchived) params.set('includeDeleted', 'true');

      const res = await fetch(`/api/fee-bills?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.feeBills)) {
        setBills(data.feeBills);
      }
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCircle, selectedDivision, paymentStatusFilter, showArchived]);

  useEffect(() => {
    fetchFeeBills();
  }, [fetchFeeBills]);

  const handleSaveBill = async (record: FeeBillRecord) => {
    try {
      const res = await fetch('/api/fee-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data = await res.json();
      if (data.success) {
        setEditingBill(null);
        setActiveTab('list');
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const handleDeleteBill = async (bill: FeeBillRecord) => {
    try {
      const res = await fetch(`/api/fee-bills?id=${encodeURIComponent(bill.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeletingBill(null);
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const handleRestoreBill = async (bill: FeeBillRecord) => {
    try {
      const restoredRecord: FeeBillRecord = {
        ...bill,
        delete_status: 'ACTIVE',
        isDeleted: false,
      };
      const res = await fetch('/api/fee-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoredRecord),
      });
      const data = await res.json();
      if (data.success) {
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const availableDivisions = masterData.divisions.filter(
    (d) => (!selectedCircle || d.circleName === selectedCircle) && d.active
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md text-lg">
            ₹
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              Legal & Lawyer Fee Bill Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Highways Department &bull; Government Order (G.O.) Claims, Assistance Fee Calculator & Audit System
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingBill(null);
            setActiveTab('create');
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Fee Bill Voucher</span>
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fee Bill Ledger ({bills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pendency')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pendency'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendency Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Financial Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Master Data Config</span>
          </button>
        </div>

        {/* Show Archived / Soft Deleted Toggle */}
        {activeTab === 'list' && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showArchived
                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
          </button>
        )}
      </div>

      {/* Filter Bar for List View */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Fee Bill No, Lawyer, Case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCircle}
              onChange={(e) => {
                setSelectedCircle(e.target.value);
                setSelectedDivision('');
              }}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="">All Circles</option>
              {masterData.circles.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} Circle
                </option>
              ))}
            </select>

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="">All Divisions</option>
              {availableDivisions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {(['ALL', 'Not Settled', 'Settled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPaymentStatusFilter(st)}
                  className={`flex-1 h-full py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    paymentStatusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'list' && (
        <FeeBillListTable
          bills={bills}
          loading={loading}
          masterData={masterData}
          onView={(b) => setViewingBill(b)}
          onEdit={(b) => {
            setEditingBill(b);
            setActiveTab('create');
          }}
          onAudit={(b) => setAuditingBill(b)}
          onDelete={(b) => setDeletingBill(b)}
          onRestore={(b) => handleRestoreBill(b)}
        />
      )}

      {activeTab === 'create' && (
        <FeeBillDataEntryForm
          initialData={editingBill || undefined}
          existingBills={bills}
          masterData={masterData}
          onSave={handleSaveBill}
          onCancel={() => {
            setEditingBill(null);
            setActiveTab('list');
          }}
        />
      )}

      {activeTab === 'pendency' && (
        <FeeBillPendencyTracker bills={bills} onViewBill={(b) => setViewingBill(b)} />
      )}

      {activeTab === 'analytics' && (
        <FeeBillAnalysisDashboard bills={bills} masterData={masterData} />
      )}

      {activeTab === 'settings' && (
        <MasterDataManagement masterData={masterData} onUpdateMasterData={(newData) => setMasterData(newData)} />
      )}

      {/* Modals Suite */}
      <FeeBillDetailModal contract={viewingBill} onClose={() => setViewingBill(null)} />

      <FeeBillAuditModal
        contract={auditingBill}
        isOpen={!!auditingBill}
        onClose={() => setAuditingBill(null)}
        onSuccess={() => fetchFeeBills()}
      />

      {/* Delete Confirmation Overlay Modal */}
      {deletingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Soft Delete Fee Bill Record?
            </h3>
            <p className="text-xs text-slate-500">
              Voucher Ref: <strong>{deletingBill.feeBillNumber}</strong> ({deletingBill.lawyerName})
            </p>
            <p className="text-xs text-slate-400">
              This action soft-deletes the record. Historical records remain preserved in PostgreSQL audit logs and can be restored using "Show Archived".
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingBill(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBill(deletingBill)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Soft Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
