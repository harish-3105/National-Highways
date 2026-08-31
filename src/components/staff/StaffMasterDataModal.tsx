'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Settings,
  Check,
  AlertTriangle,
  Building,
  MapPin,
  Building2,
  Layers,
  Briefcase,
  Search,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { StaffMasterConfig, StaffMasterItem } from './StaffTypes';

interface StaffMasterDataModalProps {
  isOpen?: boolean;
  isPageMode?: boolean;
  onClose: () => void;
  masterConfig: StaffMasterConfig;
  onRefresh: () => void;
}

interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  parentCategory?: string;
  parentLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_TABS: CategoryMeta[] = [
  {
    id: 'office',
    label: 'Offices',
    description: 'Headquarters, Regional & Field Offices',
    icon: Building2,
  },
  {
    id: 'circle',
    label: 'Circles',
    description: 'Administrative Circles across Tamil Nadu',
    icon: MapPin,
  },
  {
    id: 'division',
    label: 'Divisions',
    description: 'Operational territorial highway divisions',
    parentCategory: 'circle',
    parentLabel: 'Parent Circle',
    icon: Building,
  },
  {
    id: 'sub_division',
    label: 'Sub-Divisions',
    description: 'Sub-divisional engineer jurisdictions',
    parentCategory: 'division',
    parentLabel: 'Parent Division',
    icon: Layers,
  },
  {
    id: 'section',
    label: 'Sections',
    description: 'Engineering & Section Office units',
    parentCategory: 'sub_division',
    parentLabel: 'Parent Sub-Division',
    icon: Layers,
  },
  {
    id: 'sub_section',
    label: 'Sub-Sections',
    description: 'Sub-section field maintenance units',
    parentCategory: 'section',
    parentLabel: 'Parent Section',
    icon: Layers,
  },
  {
    id: 'designation',
    label: 'Designations',
    description: 'CE, SE, DE, AEE, AE, JDO, Assistant...',
    icon: Briefcase,
  },
];

export const StaffMasterDataModal: React.FC<StaffMasterDataModalProps> = ({
  isOpen = true,
  isPageMode = false,
  onClose,
  masterConfig,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('office');
  const [newValue, setNewValue] = useState('');
  const [selectedParentValue, setSelectedParentValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Option State
  const [editingItem, setEditingItem] = useState<StaffMasterItem | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingParentValue, setEditingParentValue] = useState<string>('');

  // Delete Confirm Popup State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StaffMasterItem | null>(null);

  if (!isOpen) return null;

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === activeCategory);

  // Parent options list for hierarchical categories
  const availableParentOptions: string[] =
    activeTabMeta?.parentCategory === 'circle'
      ? masterConfig.circles || []
      : activeTabMeta?.parentCategory === 'division'
      ? masterConfig.divisions || []
      : activeTabMeta?.parentCategory === 'sub_division'
      ? masterConfig.sub_divisions || []
      : activeTabMeta?.parentCategory === 'section'
      ? masterConfig.sections || []
      : [];

  const displayItems = (masterConfig.rawItems || []).filter(
    (item) => item.category === activeCategory
  );

  const filteredItems = displayItems.filter((item) =>
    (item.value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.parent_value || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, any> = {
        category: activeCategory,
        value: newValue.trim(),
      };

      if (activeTabMeta?.parentCategory) {
        payload.parent_category = activeTabMeta.parentCategory;
        payload.parent_value = selectedParentValue.trim() || null;
      }

      const res = await fetch('/api/staff/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add option');

      setNewValue('');
      setSelectedParentValue('');
      setSuccess(`Added "${json.value}" successfully to ${activeTabMeta?.label}.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (item: StaffMasterItem) => {
    if (!editingValue.trim()) {
      setEditingItem(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, any> = {
        newValue: editingValue.trim(),
      };

      if (item.id) {
        payload.id = item.id;
      } else {
        payload.category = activeCategory;
        payload.oldValue = item.value;
      }

      if (activeTabMeta?.parentCategory) {
        payload.parent_category = activeTabMeta.parentCategory;
        payload.parent_value = editingParentValue.trim() || null;
      }

      const res = await fetch('/api/staff/master-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update option');

      setSuccess(`Updated option to "${editingValue.trim()}".`);
      setEditingItem(null);
      setEditingValue('');
      setEditingParentValue('');
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
      const url = deleteConfirmItem.id
        ? `/api/staff/master-data?id=${deleteConfirmItem.id}`
        : `/api/staff/master-data?category=${activeCategory}&value=${encodeURIComponent(deleteConfirmItem.value)}`;

      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to delete option');

      setSuccess(`Removed "${deleteConfirmItem.value}" successfully.`);
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
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Staff Master Data Configuration
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage relational 6-tier posting hierarchy, administrative units, and staff designations
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Back to Staff Directory"
        >
          <X className="w-4 h-4" />
          <span>Back to Roster</span>
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
              const count = (
                masterConfig.rawItems?.filter((i) => i.category === tab.id) || []
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
                    setEditingItem(null);
                    setSelectedParentValue('');
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
                {filteredItems.length} option{filteredItems.length === 1 ? '' : 's'} available
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
            <form onSubmit={handleAddOption} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {activeTabMeta?.parentCategory && (
                <select
                  value={selectedParentValue}
                  onChange={(e) => setSelectedParentValue(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select {activeTabMeta.parentLabel} --</option>
                  {availableParentOptions.map((parentOpt) => (
                    <option key={parentOpt} value={parentOpt}>
                      {parentOpt}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </form>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
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
                filteredItems.map((item) => {
                  const itemKey = item.id || `default-${item.value}`;
                  const isEditingThis = editingItem?.value === item.value && editingItem?.category === item.category;

                  return (
                    <div
                      key={itemKey}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                    >
                      {isEditingThis ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold outline-none"
                            autoFocus
                          />

                          {activeTabMeta?.parentCategory && (
                            <select
                              value={editingParentValue}
                              onChange={(e) => setEditingParentValue(e.target.value)}
                              className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
                            >
                              <option value="">-- No Parent --</option>
                              {availableParentOptions.map((parentOpt) => (
                                <option key={parentOpt} value={parentOpt}>
                                  {parentOpt}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.value}
                            </span>
                            {item.parent_value && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                <GitBranch className="w-2.5 h-2.5" />
                                {item.parent_value}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditingValue(item.value);
                                setEditingParentValue(item.parent_value || '');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Edit option"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmItem && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Confirm Deletion
                </h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200 font-bold">&quot;{deleteConfirmItem.value}&quot;</strong> from {activeTabMeta?.label}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
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

export default StaffMasterDataModal;
