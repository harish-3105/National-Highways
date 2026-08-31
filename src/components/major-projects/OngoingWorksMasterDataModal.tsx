'use client';

import React, { useState } from 'react';
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
  SlidersHorizontal,
  MapPin,
  Building2,
  FileSpreadsheet,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { MasterConfigItem, OngoingWorksMasterData } from '@/app/api/ongoing-works/master-data/route';

interface OngoingWorksMasterDataModalProps {
  isOpen?: boolean;
  isPageMode?: boolean;
  onClose: () => void;
  masterData: OngoingWorksMasterData;
  onRefresh: () => void;
}

type CategoryType = 'circle' | 'division' | 'scheme';

interface CategoryTab {
  id: CategoryType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'circle',
    label: 'Administrative Circles',
    description: 'Regional headquarters and administrative zones',
    icon: MapPin,
  },
  {
    id: 'division',
    label: 'Field Divisions',
    description: 'Operational territorial highway divisions (mapped to Parent Circle)',
    icon: Building2,
  },
  {
    id: 'scheme',
    label: 'Funding Schemes',
    description: 'NH(O), CRIF, Annual Plan, State Fund, EPC, HAM...',
    icon: FileSpreadsheet,
  },
];

export const OngoingWorksMasterDataModal: React.FC<OngoingWorksMasterDataModalProps> = ({
  isOpen = true,
  isPageMode = false,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('circle');
  const [newValue, setNewValue] = useState<string>('');
  const [newParentCircle, setNewParentCircle] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingParentCircle, setEditingParentCircle] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MasterConfigItem | null>(null);

  if (!isOpen) return null;

  const currentCategoryItems = (masterData.rawItems || []).filter(
    (item) => item.category === activeCategory
  );

  const filteredItems = currentCategoryItems.filter((item) => {
    const matchesValue = (item.value || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = (item.parent_value || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesValue || matchesParent;
  });

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === activeCategory);

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    if (activeCategory === 'division' && !newParentCircle.trim()) {
      setError('Please select a Parent Circle for the new Division.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/ongoing-works/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: newValue.trim(),
          parent_category: activeCategory === 'division' ? 'circle' : undefined,
          parent_value: activeCategory === 'division' ? newParentCircle.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add master option');

      setNewValue('');
      setSuccess(`Added "${json.value}" successfully to ${activeTabMeta?.label}.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: MasterConfigItem) => {
    setEditingId(item.id);
    setEditingValue(item.value);
    setEditingParentCircle(item.parent_value || '');
    setError(null);
    setSuccess(null);
  };

  const handleUpdateOption = async (item: MasterConfigItem) => {
    if (!editingValue.trim()) {
      setError('Option value cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/ongoing-works/master-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          value: editingValue.trim(),
          parent_category: activeCategory === 'division' ? 'circle' : null,
          parent_value: activeCategory === 'division' ? editingParentCircle.trim() || null : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update option');

      setSuccess(`Updated option to "${editingValue.trim()}".`);
      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to update option');
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
      const res = await fetch(`/api/ongoing-works/master-data?id=${encodeURIComponent(deleteConfirmItem.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirmItem.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete option');

      setSuccess(`Deleted "${deleteConfirmItem.value}".`);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full flex flex-col overflow-hidden relative ${isPageMode ? 'min-h-[620px]' : 'max-w-5xl max-h-[90vh]'}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Ongoing Works Master Data Configuration
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Centralized database management of Circles, Divisions (with Parent Circle), Schemes, and Work Stages
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Back to Works List"
        >
          <X className="w-4 h-4" />
          <span>Back to Works</span>
        </button>
      </div>

        {/* Two-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Sidebar (Categories) */}
          <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1.5 bg-slate-50/30 dark:bg-slate-900/40">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Categories ({CATEGORY_TABS.length})
            </span>
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = (masterData.rawItems || []).filter(
                (i) => i.category === tab.id
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
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{tab.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="md:col-span-8 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Active Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {activeTabMeta?.label}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{activeTabMeta?.description}</p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                {filteredItems.length} option{filteredItems.length === 1 ? '' : 's'} configured
              </span>
            </div>

            {/* Notification Messages */}
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

            {/* Add New Option Form */}
            <form onSubmit={handleAddOption} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={
                    activeCategory === 'circle'
                      ? 'Enter administrative circle name (e.g. Chennai, Salem)...'
                      : activeCategory === 'division'
                      ? 'Enter division name (e.g. Chengalpattu, Vellore)...'
                      : activeCategory === 'scheme'
                      ? 'Enter funding scheme (e.g. NH(O), CRIF, Annual Plan)...'
                      : 'Enter work stage (e.g. IN_PROGRESS, TENDER_STAGE)...'
                  }
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {activeCategory === 'division' && (
                  <div className="sm:w-52">
                    <select
                      value={newParentCircle}
                      onChange={(e) => setNewParentCircle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Parent Circle --</option>
                      {masterData.circles.map((c) => (
                        <option key={c} value={c}>
                          Circle: {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !newValue.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </div>

              {activeCategory === 'division' && masterData.circles.length === 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ No Circles created yet. Please create at least one Administrative Circle first to map divisions.
                </p>
              )}
            </form>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTabMeta?.label.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  {searchTerm
                    ? `No matching options found for "${searchTerm}".`
                    : `No ${activeTabMeta?.label.toLowerCase()} configured in database yet. Add one above.`}
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
                            if (e.key === 'Enter') handleUpdateOption(item);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold outline-none"
                          autoFocus
                        />
                        {activeCategory === 'division' && (
                          <select
                            value={editingParentCircle}
                            onChange={(e) => setEditingParentCircle(e.target.value)}
                            className="sm:w-44 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold outline-none"
                          >
                            <option value="">-- No Circle --</option>
                            {masterData.circles.map((c) => (
                              <option key={c} value={c}>
                                Circle: {c}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => handleUpdateOption(item)}
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
                          {activeCategory === 'division' && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                item.parent_value
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {item.parent_value ? `Circle: ${item.parent_value}` : 'No Circle assigned'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(item)}
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

        {/* Delete Confirmation Modal */}
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
  );

  if (isPageMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh]">
        {content}
      </div>
    </div>
  );
};

export default OngoingWorksMasterDataModal;
