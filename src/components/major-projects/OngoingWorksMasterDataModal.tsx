'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  AlertTriangle,
  SlidersHorizontal,
  Building2,
  FileSpreadsheet,
  Activity,
  Search,
} from 'lucide-react';
import { OngoingWorksMasterData } from '@/app/api/ongoing-works/master-data/route';

interface OngoingWorksMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterData: OngoingWorksMasterData;
  onRefresh: () => void;
}

type CategoryType = 'division' | 'scheme' | 'work_stage';

export const OngoingWorksMasterDataModal: React.FC<OngoingWorksMasterDataModalProps> = ({
  isOpen,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('division');
  const [newValue, setNewValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id?: string; value: string } | null>(null);

  if (!isOpen) return null;

  const currentCategoryItems = (masterData.rawItems || []).filter(
    (item) => item.category === activeCategory
  );

  // Fallback to grouped list if rawItems is empty
  const displayItems = currentCategoryItems.length > 0
    ? currentCategoryItems
    : (activeCategory === 'division'
        ? masterData.divisions || []
        : activeCategory === 'scheme'
        ? masterData.schemes || []
        : masterData.workStages || []
      ).map((val, idx) => ({ id: `default-${idx}`, category: activeCategory, value: val }));

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
      const res = await fetch('/api/ongoing-works/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory, value: newValue.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add master option');

      setNewValue('');
      setSuccess(`Added "${json.value}" successfully.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (id?: string, value?: string) => {
    if (!value) return;
    setEditingId(id || value);
    setEditingValue(value);
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingValue.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (id.startsWith('default-')) {
        // Create in DB
        const res = await fetch('/api/ongoing-works/master-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: activeCategory, value: editingValue.trim() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update option');
      } else {
        const res = await fetch('/api/ongoing-works/master-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, value: editingValue.trim() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update option');
      }

      setEditingId(null);
      setEditingValue('');
      setSuccess(`Updated option successfully.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to update option');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let url = `/api/ongoing-works/master-data?`;
      if (deleteConfirmItem.id && !deleteConfirmItem.id.startsWith('default-')) {
        url += `id=${encodeURIComponent(deleteConfirmItem.id)}`;
      } else {
        url += `category=${activeCategory}&value=${encodeURIComponent(deleteConfirmItem.value)}`;
      }

      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete option');

      setSuccess(`Removed "${deleteConfirmItem.value}" from ${activeCategory} master list.`);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const categoryLabel = activeCategory === 'division' ? 'Division' : activeCategory === 'scheme' ? 'Scheme' : 'Work Stage';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ongoing Works Master Data Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Manage dynamic dropdown options for Divisions, Schemes, and Work Stages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50/30 dark:bg-slate-800/20">
          <button
            onClick={() => {
              setActiveCategory('division');
              setEditingId(null);
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeCategory === 'division'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Divisions ({(masterData.divisions || []).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('scheme');
              setEditingId(null);
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeCategory === 'scheme'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Schemes ({(masterData.schemes || []).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('work_stage');
              setEditingId(null);
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeCategory === 'work_stage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Work Stages ({(masterData.workStages || []).length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Add New Option Form */}
          <form onSubmit={handleAddOption} className="flex gap-2">
            <input
              type="text"
              placeholder={`Add new ${categoryLabel}...`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !newValue.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          </form>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Filter ${categoryLabel} options...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List of Options Container with Vertical Scroller */}
          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto dropdown-scroll pr-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No {categoryLabel.toLowerCase()} options found. Add one above!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id || item.value}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    {editingId === (item.id || item.value) ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item.id || item.value);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditingValue('');
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id || item.value)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingValue('');
                          }}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                          title="Cancel Edit"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.value}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(item.id, item.value)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Edit Option"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem({ id: item.id, value: item.value })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Delete Option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-400 font-mono">
            Master Data Sync &bull; Updates propagate to all Ongoing Works dropdowns
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Sub-Modal: Delete Confirmation */}
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Delete Option</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-slate-100">&quot;{deleteConfirmItem.value}&quot;</strong> from the {activeCategory} master list?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OngoingWorksMasterDataModal;
