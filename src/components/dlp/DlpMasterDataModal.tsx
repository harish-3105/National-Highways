'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Building,
  Briefcase,
  Layers,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DlpMasterData } from '@/app/api/dlp/master-data/route';

interface DlpMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterData: DlpMasterData;
  onRefresh: () => void;
}

type TabType = 'circle' | 'division' | 'contract_mode' | 'maintenance_type' | 'status';

export const DlpMasterDataModal: React.FC<DlpMasterDataModalProps> = ({
  isOpen,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('circle');
  const [newValue, setNewValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const getItemsForTab = (): string[] => {
    switch (activeTab) {
      case 'circle':
        return masterData.circles || [];
      case 'division':
        return masterData.divisions || [];
      case 'contract_mode':
        return masterData.contractModes || [];
      case 'maintenance_type':
        return masterData.maintenanceTypes || [];
      case 'status':
        return masterData.statuses || [];
      default:
        return [];
    }
  };

  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'circle':
        return 'Administrative Circles';
      case 'division':
        return 'Field Divisions';
      case 'contract_mode':
        return 'Contract Modes';
      case 'maintenance_type':
        return 'Maintenance Sub-Types';
      case 'status':
        return 'Contract Statuses';
    }
  };

  const currentItems = getItemsForTab();
  const filteredItems = currentItems.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch('/api/dlp/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeTab,
          value: newValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add option');

      setNewValue('');
      setSuccessMsg(`Added "${newValue.trim()}" to ${getTabLabel(activeTab)}.`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditValue(val);
    setErrorMsg('');
  };

  const handleSaveEdit = async (oldVal: string) => {
    if (!editValue.trim() || editValue.trim() === oldVal) {
      setEditingIndex(null);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const rawItem = masterData.rawItems?.find(
        (i) => i.category === activeTab && i.value === oldVal
      );

      const res = await fetch('/api/dlp/master-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rawItem?.id,
          category: activeTab,
          oldValue: oldVal,
          newValue: editValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update option');

      setEditingIndex(null);
      setSuccessMsg(`Renamed "${oldVal}" to "${editValue.trim()}".`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (val: string) => {
    if (!confirm(`Are you sure you want to remove "${val}" from ${getTabLabel(activeTab)}?`)) {
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const rawItem = masterData.rawItems?.find(
        (i) => i.category === activeTab && i.value === val
      );

      const query = rawItem?.id
        ? `id=${encodeURIComponent(rawItem.id)}`
        : `category=${encodeURIComponent(activeTab)}&value=${encodeURIComponent(val)}`;

      const res = await fetch(`/api/dlp/master-data?${query}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete option');

      setSuccessMsg(`Removed "${val}".`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                DLP & Maintenance Master Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add, modify, rename or delete options across all maintenance dropdowns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-6 pt-2 gap-2 overflow-x-auto">
          {(
            [
              { id: 'circle', label: 'Circles', icon: MapPin, count: masterData.circles?.length || 0 },
              { id: 'division', label: 'Divisions', icon: Building, count: masterData.divisions?.length || 0 },
              { id: 'contract_mode', label: 'Contract Modes', icon: Briefcase, count: masterData.contractModes?.length || 0 },
              { id: 'maintenance_type', label: 'Maintenance Types', icon: Layers, count: masterData.maintenanceTypes?.length || 0 },
              { id: 'status', label: 'Statuses', icon: ShieldCheck, count: masterData.statuses?.length || 0 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditingIndex(null);
                  setErrorMsg('');
                  setSuccessMsg('');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-t-xl'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 dropdown-scroll">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Form & Search Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form onSubmit={handleAdd} className="sm:col-span-2 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Add new ${getTabLabel(activeTab).toLowerCase()} option...`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div>
              <input
                type="text"
                placeholder="Filter listed options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                {searchTerm ? 'No options match your filter.' : 'No options configured yet.'}
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={`${item}-${idx}`}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 outline-none ring-2 ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10.5px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx, item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Rename Option"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Option"
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

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total {currentItems.length} options in {getTabLabel(activeTab)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DlpMasterDataModal;
