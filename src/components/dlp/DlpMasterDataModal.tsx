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
  Building,
  AlertCircle,
} from 'lucide-react';
import { DlpMasterConfigCategory, DlpMasterConfigItem, DlpMasterData } from '@/types/dlp';

interface DlpMasterDataModalProps {
  isOpen?: boolean;
  isPageMode?: boolean;
  onClose: () => void;
  masterData: DlpMasterData;
  onRefresh: () => void;
}

interface CategoryTab {
  id: DlpMasterConfigCategory;
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
    icon: Building,
  },
  {
    id: 'scheme',
    label: 'Remediation Schemes',
    description: 'Scheme classifications for uncontracted and No-DLP stretches (NH(O), CRIF, etc.)',
    icon: Layers,
  },
];

export const DlpMasterDataModal: React.FC<DlpMasterDataModalProps> = ({
  isOpen = true,
  isPageMode = false,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<DlpMasterConfigCategory>('circle');
  const [newValue, setNewValue] = useState('');
  const [newParentCircle, setNewParentCircle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingParentCircle, setEditingParentCircle] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DlpMasterConfigItem | null>(null);

  if (!isOpen) return null;

  const currentCategoryItems = (masterData.rawItems || []).filter(
    (item) => item.category === activeTab && item.status !== 'DELETED'
  );

  const filteredItems = currentCategoryItems.filter((item) => {
    const matchesValue = (item.value || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = (item.parent_value || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesValue || matchesParent;
  });

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === activeTab);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    if (activeTab === 'division' && !newParentCircle.trim()) {
      setErrorMsg('Please select a Parent Circle for the new Division.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/dlp/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeTab,
          value: newValue.trim(),
          parent_category: activeTab === 'division' ? 'circle' : undefined,
          parent_value: activeTab === 'division' ? newParentCircle.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add master data record');

      setNewValue('');
      setSuccessMsg(`Added "${newValue.trim()}" to ${activeTabMeta?.label}.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: DlpMasterConfigItem) => {
    setEditingId(item.id);
    setEditingValue(item.value);
    setEditingParentCircle(item.parent_value || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEdit = async (item: DlpMasterConfigItem) => {
    if (!editingValue.trim()) {
      setErrorMsg('Option value cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/dlp/master-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          value: editingValue.trim(),
          parent_category: activeTab === 'division' ? 'circle' : null,
          parent_value: activeTab === 'division' ? editingParentCircle.trim() || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update master data option');

      setSuccessMsg(`Updated option to "${editingValue.trim()}".`);
      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/dlp/master-data?id=${deleteConfirmItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete master data option');

      setSuccessMsg(`Deleted "${deleteConfirmItem.value}".`);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
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
              DLP Master Data Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Centralized database management of Circles, Divisions, and Remediation Schemes
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Back to DLP Portal"
        >
          <X className="w-4 h-4" />
          <span>Back to DLP</span>
        </button>
      </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Sidebar (Categories) */}
          <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1.5 bg-slate-50/30 dark:bg-slate-900/40">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Configuration Categories ({CATEGORY_TABS.length})
            </span>
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = (masterData.rawItems || []).filter(
                (i) => i.category === tab.id && i.status !== 'DELETED'
              ).length;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchTerm('');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setEditingId(null);
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs truncate">{tab.label}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 line-clamp-1 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Main Content Panel */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
            {/* Action Banners */}
            {errorMsg && (
              <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 rounded-lg cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="m-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded-lg cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Top Add Option Form */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={
                        activeTab === 'circle'
                          ? 'Enter circle name (e.g. Chennai, Salem, Madurai)...'
                          : activeTab === 'division'
                          ? 'Enter division name (e.g. Vellore, Villupuram)...'
                          : 'Enter remediation scheme (e.g. NH(O), CRIF, Annual Plan)...'
                      }
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {activeTab === 'division' && (
                    <div className="sm:w-56">
                      <select
                        value={newParentCircle}
                        onChange={(e) => setNewParentCircle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </div>

                {activeTab === 'division' && masterData.circles.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ No Circles created yet. Please create at least one Administrative Circle first to map divisions.
                  </p>
                )}
              </form>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeTabMeta?.label.toLowerCase()}...`}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-semibold shrink-0">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {searchTerm
                      ? `No matching options found for "${searchTerm}".`
                      : `No ${activeTabMeta?.label.toLowerCase()} configured yet.`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {searchTerm
                      ? 'Try adjusting your search query.'
                      : 'Use the form above to insert database records.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                            autoFocus
                          />
                          {activeTab === 'division' && (
                            <select
                              value={editingParentCircle}
                              onChange={(e) => setEditingParentCircle(e.target.value)}
                              className="sm:w-48 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                            >
                              <option value="">-- No Circle --</option>
                              {masterData.circles.map((c) => (
                                <option key={c} value={c}>
                                  Circle: {c}
                                </option>
                              ))}
                            </select>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              disabled={loading || !editingValue.trim()}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.value}
                            </span>
                            {activeTab === 'division' && (
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

                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete item"
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Records stored centrally in <code className="font-mono text-slate-600 dark:text-slate-300">public.dlp_master_config</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Master Config
          </button>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Delete Option</h4>
                  <p className="text-[11px] text-slate-500">This action will deactivate the record.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to delete <strong className="font-bold text-slate-900 dark:text-slate-100">"{deleteConfirmItem.value}"</strong> from{' '}
                {activeTabMeta?.label}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Deleting...' : 'Delete Option'}
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
