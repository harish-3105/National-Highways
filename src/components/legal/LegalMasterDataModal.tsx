'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  AlertTriangle,
  SlidersHorizontal,
  MapPin,
  Building,
  Scale,
  Activity,
  Building2,
  FileText,
  UserCheck,
  Search,
  FolderTree,
  Gavel,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { LegalMasterData, LegalCategory } from '@/app/api/legal/master-data/route';

interface LegalMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterData: LegalMasterData;
  onRefresh: () => void;
}

export const LegalMasterDataModal: React.FC<LegalMasterDataModalProps> = ({
  isOpen,
  onClose,
  masterData,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<LegalCategory>('circle');
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

  const getFallbackList = (cat: LegalCategory): string[] => {
    switch (cat) {
      case 'circle': return masterData.circles || [];
      case 'division': return masterData.divisions || [];
      case 'category': return masterData.categories || ['Filed Against Department', 'Filed By Department'];
      case 'case_type': return masterData.caseTypes || [];
      case 'case_status': return masterData.caseStatuses || [];
      case 'case_pertains_to': return masterData.casePertainsTo || [];
      case 'nature_of_case': return masterData.natureOfCases || [];
      case 'court_name': return masterData.courtNames || [];
      case 'law_officer': return masterData.lawOfficers || [];
      case 'appeal_level': return masterData.appealLevels || [];
      case 'appeal_case_type': return masterData.appealCaseTypes || [];
      case 'appellate_court': return masterData.appellateCourts || [];
      case 'condonation_of_delay': return masterData.condonationOfDelays || [];
      case 'present_stage': return masterData.presentStages || [];
      case 'gp_opinion': return masterData.gpOpinions || [];
      case 'compliance_status': return masterData.complianceStatuses || [];
      default: return [];
    }
  };

  const displayItems = currentCategoryItems.length > 0
    ? currentCategoryItems
    : getFallbackList(activeCategory).map((val, idx) => ({
        id: `default-${idx}`,
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
        body: JSON.stringify({ category: activeCategory, value: newValue.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add option');
      }

      setSuccess(`Added "${newValue.trim()}" successfully!`);
      setNewValue('');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding option');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = async (id: string, originalVal: string) => {
    if (!editingValue.trim() || editingValue.trim() === originalVal) {
      setEditingId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (id.startsWith('default-')) {
        const res = await fetch('/api/legal/master-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: activeCategory, value: editingValue.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save updated option');
      } else {
        const res = await fetch('/api/legal/master-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, value: editingValue.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update option');
      }

      setSuccess(`Updated successfully!`);
      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating option');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (deleteConfirmItem.id && !deleteConfirmItem.id.startsWith('default-')) {
        const res = await fetch(`/api/legal/master-data?id=${deleteConfirmItem.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete option');
      }

      setSuccess(`Deleted "${deleteConfirmItem.value}"`);
      setDeleteConfirmItem(null);
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting option');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: LegalCategory; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'circle', label: 'Circles', icon: MapPin, count: masterData.circles?.length || 0 },
    { id: 'division', label: 'Divisions', icon: Building, count: masterData.divisions?.length || 0 },
    { id: 'case_type', label: 'Case Types', icon: FileText, count: masterData.caseTypes?.length || 0 },
    { id: 'court_name', label: 'Courts & Tribunals', icon: Scale, count: masterData.courtNames?.length || 0 },
    { id: 'category', label: 'Category', icon: Building2, count: masterData.categories?.length || 0 },
    { id: 'case_pertains_to', label: 'Pertains To', icon: Building2, count: masterData.casePertainsTo?.length || 0 },
    { id: 'nature_of_case', label: 'Nature of Cases', icon: Activity, count: masterData.natureOfCases?.length || 0 },
    { id: 'present_stage', label: 'Present Stages', icon: Clock, count: masterData.presentStages?.length || 0 },
    { id: 'case_status', label: 'Case Statuses', icon: Check, count: masterData.caseStatuses?.length || 0 },
    { id: 'appeal_level', label: 'Appeal Levels', icon: Gavel, count: masterData.appealLevels?.length || 0 },
    { id: 'appeal_case_type', label: 'Appeal Case Types', icon: FolderTree, count: masterData.appealCaseTypes?.length || 0 },
    { id: 'appellate_court', label: 'Appellate Courts', icon: Scale, count: masterData.appellateCourts?.length || 0 },
    { id: 'condonation_of_delay', label: 'Condonation Delays', icon: Clock, count: masterData.condonationOfDelays?.length || 0 },
    { id: 'gp_opinion', label: 'GP Opinions', icon: UserCheck, count: masterData.gpOpinions?.length || 0 },
    { id: 'compliance_status', label: 'Compliance Status', icon: ShieldAlert, count: masterData.complianceStatuses?.length || 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative"
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
                Legal Cases Master Data Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure dropdown values for Case Types, Courts, Stages, Appeal Levels, etc.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 bg-slate-50/30 dark:bg-slate-800/20 overflow-x-auto dropdown-scroll">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeCategory === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveCategory(t.id);
                  setEditingId(null);
                  setError(null);
                  setSuccess(null);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-inherit font-mono">
                  {t.count}
                </span>
              </button>
            );
          })}
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
              placeholder={`Add new option to ${tabs.find((t) => t.id === activeCategory)?.label}...`}
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

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Filter active ${tabs.find((t) => t.id === activeCategory)?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Items List Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No options found for "{searchTerm}". Add your first option above!
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateOption(item.id, item.value);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleUpdateOption(item.id, item.value)}
                          disabled={loading}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                          title="Save change"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.value}
                      </span>
                    )}

                    {editingId !== item.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingValue(item.value);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmItem && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-10 animate-in fade-in duration-100">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-4 shadow-xl text-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Delete Option?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong>"{deleteConfirmItem.value}"</strong> from{' '}
                  {tabs.find((t) => t.id === activeCategory)?.label}?
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-1">
                <button
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-xs"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500">
            Master changes are automatically available across legal case entry & edit forms.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalMasterDataModal;
