'use client';

import React, { useState } from 'react';
import { LegalCategory, LegalMasterData } from '@/app/api/legal/master-data/route';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface LegalMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterData: LegalMasterData;
  onRefresh: () => void;
}

const CATEGORY_TABS: { id: LegalCategory; label: string; description: string }[] = [
  { id: 'case_type', label: 'Case Types', description: 'WP, WA, CRP, OSA, SLP, Contempt, OS...' },
  { id: 'circle', label: 'Circles', description: 'Administrative Circles (Chennai, Madurai, Salem...)' },
  { id: 'division', label: 'Divisions', description: 'Territorial highway divisions' },
  { id: 'court_name', label: 'Court Names', description: 'High Court, District Courts, Sub Courts, NGT...' },
  { id: 'case_pertains_to', label: 'Case Pertains To', description: 'GOTN, MoRTH, Both, NHAI' },
  { id: 'nature_of_case', label: 'Nature of Case', description: 'Work, Tender, Land Acquisition, Encroachment...' },
  { id: 'present_stage', label: 'Present Stage', description: 'Notice / Admission, CA Pending, Arguments...' },
  { id: 'case_status', label: 'Current Status', description: 'Pending, Disposed, Stay Granted...' },
  { id: 'appeal_case_type', label: 'Appeal Case Types', description: 'Writ Appeal (WA), CMA, AS, SLP, CRP' },
  { id: 'appellate_court', label: 'Appellate Courts', description: 'Division Bench Principal Seat, Madurai Bench, SC' },
  { id: 'condonation_of_delay', label: 'Condonation of Delay', description: 'Pending, Allowed / Condoned, Dismissed' },
  { id: 'gp_opinion', label: 'GP Opinions', description: 'Opinion Pending, Recommended for Appeal, Not Recommended for Appeal, Not Required' },
  { id: 'compliance_status', label: 'Compliance Status', description: 'Complied, Pending' },
];

export const LegalMasterDataModal: React.FC<LegalMasterDataModalProps> = ({
  isOpen,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<LegalCategory>('case_type');
  const [searchTerm, setSearchTerm] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id?: string; value: string } | null>(null);

  if (!isOpen) return null;

  const currentCategoryItems: { id: string; category: LegalCategory; value: string }[] = (
    masterData.rawItems || []
  )
    .filter((item) => item.category === activeCategory)
    .map((item) => ({ id: item.id || `raw-${item.value}`, category: item.category, value: item.value }));

  const fallbackArray =
    masterData[
      activeCategory === 'circle'
        ? 'circles'
        : activeCategory === 'division'
        ? 'divisions'
        : activeCategory === 'case_type'
        ? 'caseTypes'
        : activeCategory === 'case_status'
        ? 'caseStatuses'
        : activeCategory === 'court_name'
        ? 'courtNames'
        : activeCategory === 'present_stage'
        ? 'presentStages'
        : activeCategory === 'appeal_case_type'
        ? 'appealCaseTypes'
        : activeCategory === 'appellate_court'
        ? 'appellateCourts'
        : activeCategory === 'condonation_of_delay'
        ? 'condonationOfDelays'
        : activeCategory === 'gp_opinion'
        ? 'gpOpinions'
        : activeCategory === 'compliance_status'
        ? 'complianceStatuses'
        : activeCategory === 'case_pertains_to'
        ? 'casePertainsTo'
        : 'natureOfCases'
    ] || [];

  const displayItems: { id: string; category: LegalCategory; value: string }[] =
    currentCategoryItems.length > 0
      ? currentCategoryItems
      : fallbackArray.map((val: string, idx: number) => ({
          id: `db-${idx}`,
          category: activeCategory,
          value: val,
        }));

  const filteredItems = displayItems.filter((item) =>
    (item.value || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/legal/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: newValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add option');
      }

      setNewValue('');
      setSuccess(`Added "${newValue.trim()}" to ${CATEGORY_TABS.find((t) => t.id === activeCategory)?.label}`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = async (id: string, oldValue: string) => {
    if (!editingValue.trim() || editingValue.trim() === oldValue) {
      setEditingId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Delete old & insert new
      await fetch('/api/legal/master-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory, value: oldValue }),
      });

      const res = await fetch('/api/legal/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: editingValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update option');

      setEditingId(null);
      setSuccess(`Updated option to "${editingValue.trim()}"`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteConfirmItem) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/legal/master-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: deleteConfirmItem.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete option');

      setSuccess(`Deleted "${deleteConfirmItem.value}"`);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Legal Cases Master Data Management
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure dropdown values & legal categories across the departmental portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Category Navigation Bar */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Configurable Categories
            </span>
            <div className="space-y-1 mt-1">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveCategory(tab.id);
                      setSearchTerm('');
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor Pane */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
            {/* Active Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {activeTabMeta?.label}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTabMeta?.description}
                </p>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                {displayItems.length} Options Defined
              </span>
            </div>

            {/* Notification Messages */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Add Option Form */}
            <form onSubmit={handleAddOption} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Add new option to ${activeTabMeta?.label}...`}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Option
              </button>
            </form>

            {/* Search Filter */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter defined values..."
                className="w-full pl-8 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No options found</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-bold"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateOption(item.id, item.value)}
                          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                          title="Save change"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate flex-1">{item.value}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingValue(item.value);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                            title="Edit Option"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title="Delete Option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Sub-Modal */}
        {deleteConfirmItem && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-extrabold">Confirm Removal</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to remove <strong>&quot;{deleteConfirmItem.value}&quot;</strong> from{' '}
                {activeTabMeta?.label}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOption}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Delete Option
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalMasterDataModal;
