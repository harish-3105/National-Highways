'use client';

import React, { useState } from 'react';
import { FeeBillMasterDataConfig } from '@/types/feeBill';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  Building,
  MapPin,
  Briefcase,
  Scale,
  CreditCard,
  CheckCircle2,
  Search,
  AlertTriangle,
  FileCheck,
  FileText,
  User,
  X,
} from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface MasterDataManagementProps {
  masterData: FeeBillMasterDataConfig;
  onUpdateMasterData: (newData: FeeBillMasterDataConfig) => void;
  onClose?: () => void;
}

type TabType =
  | 'circles'
  | 'divisions'
  | 'lawyerDesignations'
  | 'assistantDesignations'
  | 'caseTypes'
  | 'casePertainsTo'
  | 'goStatusOptions'
  | 'statusOfObtainingGo'
  | 'statusOfPaymentProposal'
  | 'paymentStatuses'
  | 'yesNoOptions';

interface CategoryTab {
  id: TabType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'circles',
    label: 'Administrative Circles',
    description: 'Regional headquarters and administrative zones',
    icon: MapPin,
  },
  {
    id: 'divisions',
    label: 'Field Divisions',
    description: 'Highway maintenance and project divisions',
    icon: Building,
  },
  {
    id: 'lawyerDesignations',
    label: 'Lawyer Designations',
    description: 'Advocate General, GP, AGP, Standing Counsel...',
    icon: Briefcase,
  },
  {
    id: 'assistantDesignations',
    label: 'Assistant Designations',
    description: 'Government Advocate, Junior Counsel, Law Assistant...',
    icon: User,
  },
  {
    id: 'caseTypes',
    label: 'Case Types',
    description: 'Writ Petition, Writ Appeal, Contempt, CMP...',
    icon: Scale,
  },
  {
    id: 'casePertainsTo',
    label: 'Case Pertains To',
    description: 'GOTN, MoRTH, Both, NHAI',
    icon: Building,
  },
  {
    id: 'goStatusOptions',
    label: 'Whether G.O. Required',
    description: 'Yes, No, Not Required...',
    icon: FileCheck,
  },
  {
    id: 'statusOfObtainingGo',
    label: 'Status of Obtaining G.O.',
    description: 'Proposal Sent, Under Process, Sanctioned...',
    icon: FileText,
  },
  {
    id: 'statusOfPaymentProposal',
    label: 'Payment Proposal Status',
    description: 'Under Scrutiny, Verified, Recommended...',
    icon: CreditCard,
  },
  {
    id: 'paymentStatuses',
    label: 'Payment Statuses',
    description: 'Settled, Pending, Rejected, Part-Paid...',
    icon: CheckCircle2,
  },
  {
    id: 'yesNoOptions',
    label: 'Yes / No Options',
    description: 'Standard binary validation values',
    icon: Check,
  },
];

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  masterData,
  onUpdateMasterData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('circles');
  const [newTextValue, setNewTextValue] = useState('');
  const [selectedCircleForDiv, setSelectedCircleForDiv] = useState(
    masterData.circles[0]?.name || ''
  );
  const [editingKey, setEditingKey] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id?: string | number; name: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const circles = masterData.circles || [];
  const divisions = masterData.divisions || [];
  const lawyerDesignations = masterData.lawyerDesignations || [];
  const assistantDesignations = masterData.assistantDesignations || [];
  const caseTypes = masterData.caseTypes || [];
  const casePertainsTo = masterData.casePertainsTo || [];
  const paymentStatuses = masterData.paymentStatuses || [];
  const statusOfObtainingGoOptions = masterData.statusOfObtainingGoOptions || [];
  const statusOfPaymentProposalOptions = masterData.statusOfPaymentProposalOptions || [];
  const goStatusOptions = masterData.goStatusOptions || [];
  const yesNoOptions = masterData.yesNoOptions || [];

  const getCount = (tab: TabType): number => {
    switch (tab) {
      case 'circles': return circles.length;
      case 'divisions': return divisions.length;
      case 'lawyerDesignations': return lawyerDesignations.length;
      case 'assistantDesignations': return assistantDesignations.length;
      case 'caseTypes': return caseTypes.length;
      case 'casePertainsTo': return casePertainsTo.length;
      case 'goStatusOptions': return goStatusOptions.length;
      case 'statusOfObtainingGo': return statusOfObtainingGoOptions.length;
      case 'statusOfPaymentProposal': return statusOfPaymentProposalOptions.length;
      case 'paymentStatuses': return paymentStatuses.length;
      case 'yesNoOptions': return yesNoOptions.length;
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextValue.trim()) return;
    const clean = newTextValue.trim();

    if (activeTab === 'circles') {
      const newCircle = { id: `c-${Date.now()}`, name: clean, active: true };
      onUpdateMasterData({ ...masterData, circles: [...circles, newCircle] });
    } else if (activeTab === 'divisions') {
      const newDiv = {
        id: `d-${Date.now()}`,
        circleName: selectedCircleForDiv || (circles[0]?.name || ''),
        name: clean,
        active: true,
      };
      onUpdateMasterData({ ...masterData, divisions: [...divisions, newDiv] });
    } else if (activeTab === 'lawyerDesignations') {
      if (!lawyerDesignations.includes(clean)) {
        onUpdateMasterData({ ...masterData, lawyerDesignations: [...lawyerDesignations, clean] });
      }
    } else if (activeTab === 'assistantDesignations') {
      if (!assistantDesignations.includes(clean)) {
        onUpdateMasterData({ ...masterData, assistantDesignations: [...assistantDesignations, clean] });
      }
    } else if (activeTab === 'caseTypes') {
      if (!caseTypes.includes(clean)) {
        onUpdateMasterData({ ...masterData, caseTypes: [...caseTypes, clean] });
      }
    } else if (activeTab === 'casePertainsTo') {
      if (!casePertainsTo.includes(clean)) {
        onUpdateMasterData({ ...masterData, casePertainsTo: [...casePertainsTo, clean] });
      }
    } else if (activeTab === 'goStatusOptions') {
      if (!goStatusOptions.includes(clean)) {
        onUpdateMasterData({ ...masterData, goStatusOptions: [...goStatusOptions, clean] });
      }
    } else if (activeTab === 'statusOfObtainingGo') {
      if (!statusOfObtainingGoOptions.includes(clean)) {
        onUpdateMasterData({ ...masterData, statusOfObtainingGoOptions: [...statusOfObtainingGoOptions, clean] });
      }
    } else if (activeTab === 'statusOfPaymentProposal') {
      if (!statusOfPaymentProposalOptions.includes(clean)) {
        onUpdateMasterData({ ...masterData, statusOfPaymentProposalOptions: [...statusOfPaymentProposalOptions, clean] });
      }
    } else if (activeTab === 'paymentStatuses') {
      if (!paymentStatuses.includes(clean)) {
        onUpdateMasterData({ ...masterData, paymentStatuses: [...paymentStatuses, clean] });
      }
    } else if (activeTab === 'yesNoOptions') {
      if (!yesNoOptions.includes(clean)) {
        onUpdateMasterData({ ...masterData, yesNoOptions: [...yesNoOptions, clean] });
      }
    }

    setSuccessMsg(`Added "${clean}" successfully.`);
    setNewTextValue('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveEdit = (key: string | number) => {
    if (!editValue.trim()) {
      setEditingKey(null);
      return;
    }
    const clean = editValue.trim();

    if (activeTab === 'circles') {
      onUpdateMasterData({
        ...masterData,
        circles: circles.map((c) => (c.id === key ? { ...c, name: clean } : c)),
      });
    } else if (activeTab === 'divisions') {
      onUpdateMasterData({
        ...masterData,
        divisions: divisions.map((d) => (d.id === key ? { ...d, name: clean } : d)),
      });
    } else {
      const idx = Number(key);
      const updateArray = (arr: string[]) => {
        const copy = [...arr];
        copy[idx] = clean;
        return copy;
      };

      if (activeTab === 'lawyerDesignations') {
        onUpdateMasterData({ ...masterData, lawyerDesignations: updateArray(lawyerDesignations) });
      } else if (activeTab === 'assistantDesignations') {
        onUpdateMasterData({ ...masterData, assistantDesignations: updateArray(assistantDesignations) });
      } else if (activeTab === 'caseTypes') {
        onUpdateMasterData({ ...masterData, caseTypes: updateArray(caseTypes) });
      } else if (activeTab === 'casePertainsTo') {
        onUpdateMasterData({ ...masterData, casePertainsTo: updateArray(casePertainsTo) });
      } else if (activeTab === 'goStatusOptions') {
        onUpdateMasterData({ ...masterData, goStatusOptions: updateArray(goStatusOptions) });
      } else if (activeTab === 'statusOfObtainingGo') {
        onUpdateMasterData({ ...masterData, statusOfObtainingGoOptions: updateArray(statusOfObtainingGoOptions) });
      } else if (activeTab === 'statusOfPaymentProposal') {
        onUpdateMasterData({ ...masterData, statusOfPaymentProposalOptions: updateArray(statusOfPaymentProposalOptions) });
      } else if (activeTab === 'paymentStatuses') {
        onUpdateMasterData({ ...masterData, paymentStatuses: updateArray(paymentStatuses) });
      } else if (activeTab === 'yesNoOptions') {
        onUpdateMasterData({ ...masterData, yesNoOptions: updateArray(yesNoOptions) });
      }
    }

    setSuccessMsg(`Updated option to "${clean}".`);
    setEditingKey(null);
    setEditValue('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteConfirmItem) return;
    const { id } = deleteConfirmItem;

    if (activeTab === 'circles') {
      onUpdateMasterData({
        ...masterData,
        circles: circles.filter((c) => c.id !== id),
      });
    } else if (activeTab === 'divisions') {
      onUpdateMasterData({
        ...masterData,
        divisions: divisions.filter((d) => d.id !== id),
      });
    } else {
      const idx = Number(id);
      const removeIndex = (arr: string[]) => arr.filter((_, i) => i !== idx);

      if (activeTab === 'lawyerDesignations') {
        onUpdateMasterData({ ...masterData, lawyerDesignations: removeIndex(lawyerDesignations) });
      } else if (activeTab === 'assistantDesignations') {
        onUpdateMasterData({ ...masterData, assistantDesignations: removeIndex(assistantDesignations) });
      } else if (activeTab === 'caseTypes') {
        onUpdateMasterData({ ...masterData, caseTypes: removeIndex(caseTypes) });
      } else if (activeTab === 'casePertainsTo') {
        onUpdateMasterData({ ...masterData, casePertainsTo: removeIndex(casePertainsTo) });
      } else if (activeTab === 'goStatusOptions') {
        onUpdateMasterData({ ...masterData, goStatusOptions: removeIndex(goStatusOptions) });
      } else if (activeTab === 'statusOfObtainingGo') {
        onUpdateMasterData({ ...masterData, statusOfObtainingGoOptions: removeIndex(statusOfObtainingGoOptions) });
      } else if (activeTab === 'statusOfPaymentProposal') {
        onUpdateMasterData({ ...masterData, statusOfPaymentProposalOptions: removeIndex(statusOfPaymentProposalOptions) });
      } else if (activeTab === 'paymentStatuses') {
        onUpdateMasterData({ ...masterData, paymentStatuses: removeIndex(paymentStatuses) });
      } else if (activeTab === 'yesNoOptions') {
        onUpdateMasterData({ ...masterData, yesNoOptions: removeIndex(yesNoOptions) });
      }
    }

    setSuccessMsg(`Deleted "${deleteConfirmItem.name}".`);
    setDeleteConfirmItem(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === activeTab);

  // Render items based on activeTab
  const getRenderItems = () => {
    if (activeTab === 'circles') {
      return circles.map((c) => ({ key: c.id, display: c.name, extra: null }));
    }
    if (activeTab === 'divisions') {
      return divisions.map((d) => ({ key: d.id, display: d.name, extra: d.circleName }));
    }
    const arr =
      activeTab === 'lawyerDesignations'
        ? lawyerDesignations
        : activeTab === 'assistantDesignations'
        ? assistantDesignations
        : activeTab === 'caseTypes'
        ? caseTypes
        : activeTab === 'casePertainsTo'
        ? casePertainsTo
        : activeTab === 'goStatusOptions'
        ? goStatusOptions
        : activeTab === 'statusOfObtainingGo'
        ? statusOfObtainingGoOptions
        : activeTab === 'statusOfPaymentProposal'
        ? statusOfPaymentProposalOptions
        : activeTab === 'paymentStatuses'
        ? paymentStatuses
        : yesNoOptions;

    return arr.map((item, idx) => ({ key: idx, display: item, extra: null }));
  };

  const allItems = getRenderItems();
  const filteredItems = allItems.filter((i) =>
    i.display.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Fee Bills Master Data Configuration
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure circles, divisions, advocate designations, case classifications, and payment statuses
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Back to Fee Claims"
          >
            <X className="w-4 h-4" />
            <span>Back to Fee Claims</span>
          </button>
        )}
      </div>

      {/* Chat App Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        {/* Left Sidebar (Categories) */}
        <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1.5 bg-slate-50/30 dark:bg-slate-900/40 overflow-y-auto max-h-[650px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
            Categories ({CATEGORY_TABS.length})
          </span>
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = getCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                  setEditingKey(null);
                  setSuccessMsg(null);
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
        <div className="md:col-span-8 p-6 flex flex-col space-y-4 overflow-hidden">
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

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Option Form */}
          <form onSubmit={handleAdd} className="space-y-2">
            {activeTab === 'divisions' && (
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                  Select Parent Circle for New Division:
                </label>
                <SearchableSelect
                  options={circles.map((c) => c.name)}
                  value={selectedCircleForDiv}
                  onChange={(val) => setSelectedCircleForDiv(val)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newTextValue}
                onChange={(e) => setNewTextValue(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newTextValue.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
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
          <div className="flex-1 overflow-y-auto max-h-[400px] border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No options found. Add one above.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={String(item.key)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                >
                  {editingKey === item.key ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item.key);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-xs font-semibold outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.key)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
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
                          {item.display}
                        </span>
                        {item.extra && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                            {item.extra}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKey(item.key);
                            setEditValue(item.display);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                          title="Edit Option"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem({ id: item.key, name: item.display })}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-sm font-extrabold">Confirm Removal</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong>&ldquo;{deleteConfirmItem.name}&rdquo;</strong> from{' '}
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
                onClick={handleDeleteConfirmed}
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
};

export default MasterDataManagement;
