'use client';

import React, { useState } from 'react';
import { LegalCategory, LegalMasterData, LegalMasterConfigItem } from '@/app/api/legal/master-data/route';
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
  { id: 'category', label: 'Category', description: 'Filed By vs Filed Against Department' },
  { id: 'court_name', label: 'Court Names', description: 'High Court, District Courts, Sub Courts, NGT...' },
  { id: 'case_pertains_to', label: 'Case Pertains To', description: 'GOTN, MoRTH, Both, NHAI' },
  { id: 'nature_of_case', label: 'Nature of Case', description: 'Work, Tender, Land Acquisition, Encroachment...' },
  { id: 'present_stage', label: 'Present Stage', description: 'Notice / Admission, CA Pending, Arguments...' },
  { id: 'case_status', label: 'Current Status', description: 'Pending, Disposed, Stay Granted...' },
  { id: 'appeal_level', label: 'Appeal Levels', description: 'Single Bench to DB, Sub Court to HC, HC to SC' },
  { id: 'appeal_case_type', label: 'Appeal Case Types', description: 'Writ Appeal (WA), CMA, AS, SLP, CRP' },
  { id: 'appellate_court', label: 'Appellate Courts', description: 'Division Bench Principal Seat, Madurai Bench, SC' },
  { id: 'condonation_of_delay', label: 'Condonation of Delay', description: 'Pending, Allowed / Condoned, Dismissed' },
  { id: 'gp_opinion', label: 'GP Opinions', description: 'Pending, Recommended, Not Recommended, Not Required' },
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
        : activeCategory === 'appeal_level'
        ? 'appealLevels'
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
        : activeCategory === 'nature_of_case'
        ? 'natureOfCases'
        : 'categories'
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
      if (id.startsWith('db-')) {
        // If it's a freshly loaded DB item without UUID, insert it as new override
        const res = await fetch('/api/legal/master-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: activeCategory,
            value: editingValue.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save updated option');
        }
      } else {
        const res = await fetch('/api/legal/master-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            value: editingValue.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update option');
        }
      }

      setSuccess(`Updated "${editingValue.trim()}" successfully`);
      setEditingId(null);
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
      if (deleteConfirmItem.id && !deleteConfirmItem.id.startsWith('db-')) {
        const res = await fetch(`/api/legal/master-data?id=${deleteConfirmItem.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to delete option');
        }
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Legal Cases Master Data Configuration
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Customize dropdown options dynamically across all 15 litigation categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Category Navigation Sidebar */}
          <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1.5 bg-slate-50/30 dark:bg-slate-900/40">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Categories ({CATEGORY_TABS.length})
            </span>
            {CATEGORY_TABS.map((tab) => {
              const count = (
                masterData.rawItems?.filter((i) => i.category === tab.id) ||
                masterData[
                  tab.id === 'circle'
                    ? 'circles'
                    : tab.id === 'division'
                    ? 'divisions'
                    : tab.id === 'case_type'
                    ? 'caseTypes'
                    : tab.id === 'case_status'
                    ? 'caseStatuses'
                    : tab.id === 'court_name'
                    ? 'courtNames'
                    : tab.id === 'present_stage'
                    ? 'presentStages'
                    : tab.id === 'appeal_level'
                    ? 'appealLevels'
                    : tab.id === 'appeal_case_type'
                    ? 'appealCaseTypes'
                    : tab.id === 'appellate_court'
                    ? 'appellateCourts'
                    : tab.id === 'condonation_of_delay'
                    ? 'condonationOfDelays'
                    : tab.id === 'gp_opinion'
                    ? 'gpOpinions'
                    : tab.id === 'compliance_status'
                    ? 'complianceStatuses'
                    : tab.id === 'case_pertains_to'
                    ? 'casePertainsTo'
                    : tab.id === 'nature_of_case'
                    ? 'natureOfCases'
                    : 'categories'
                ] || []
              ).length;

              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setSearchTerm('');
                    setError(null);
                    setSuccess(null);
                    setEditingId(null);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold truncate">{tab.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {tab.description}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Content Area: Manage items */}
          <div className="md:col-span-8 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Header info for active category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {activeTabMeta?.label}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{activeTabMeta?.description}</p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                {filteredItems.length} option{filteredItems.length === 1 ? '' : 's'} available
              </span>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Add new option form */}
            <form onSubmit={handleAddOption} className="flex gap-2">
              <input
                type="text"
                placeholder={`Add new ${activeTabMeta?.label.toLowerCase()} option...`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </form>

            {/* Search filter within list */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No options found. Add one above.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateOption(item.id, item.value);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateOption(item.id, item.value)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.value}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
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
                Are you sure you want to remove <strong>"{deleteConfirmItem.value}"</strong> from{' '}
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
