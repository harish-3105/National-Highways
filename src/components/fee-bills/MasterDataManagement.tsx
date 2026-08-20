'use client';

import React, { useState } from 'react';
import { FeeBillMasterDataConfig } from '@/types/feeBill';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  Building,
  MapPin,
  Briefcase,
  Scale,
  Building2,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

import { SearchableSelect } from '@/components/common/SearchableSelect';

interface MasterDataManagementProps {
  masterData: FeeBillMasterDataConfig;
  onUpdateMasterData: (newData: FeeBillMasterDataConfig) => void;
}

type TabType =
  | 'circles'
  | 'divisions'
  | 'lawyerDesignations'
  | 'caseTypes'
  | 'casePertainsTo'
  | 'paymentStatuses';

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  masterData,
  onUpdateMasterData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('circles');
  const [newTextValue, setNewTextValue] = useState('');
  const [selectedCircleForDiv, setSelectedCircleForDiv] = useState(
    masterData.circles[0]?.name || ''
  );
  const [editingKey, setEditingKey] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize fallback arrays
  const lawyerDesignations = masterData.lawyerDesignations || [];
  const caseTypes = masterData.caseTypes || [];
  const casePertainsTo = masterData.casePertainsTo || ['GOTN', 'MoRTH', 'BOTH'];
  const paymentStatuses = masterData.paymentStatuses || ['Settled', 'Not Settled'];

  const handleAdd = () => {
    if (!newTextValue.trim()) return;
    const clean = newTextValue.trim();

    if (activeTab === 'circles') {
      const newCircle = {
        id: `c-${Date.now()}`,
        name: clean,
        active: true,
      };
      onUpdateMasterData({
        ...masterData,
        circles: [...masterData.circles, newCircle],
      });
    } else if (activeTab === 'divisions') {
      const newDiv = {
        id: `d-${Date.now()}`,
        circleName: selectedCircleForDiv || (masterData.circles[0]?.name || 'Chennai'),
        name: clean,
        active: true,
      };
      onUpdateMasterData({
        ...masterData,
        divisions: [...masterData.divisions, newDiv],
      });
    } else if (activeTab === 'lawyerDesignations') {
      if (!lawyerDesignations.includes(clean)) {
        onUpdateMasterData({
          ...masterData,
          lawyerDesignations: [...lawyerDesignations, clean],
        });
      }
    } else if (activeTab === 'caseTypes') {
      if (!caseTypes.includes(clean)) {
        onUpdateMasterData({
          ...masterData,
          caseTypes: [...caseTypes, clean],
        });
      }
    } else if (activeTab === 'casePertainsTo') {
      if (!casePertainsTo.includes(clean)) {
        onUpdateMasterData({
          ...masterData,
          casePertainsTo: [...casePertainsTo, clean],
        });
      }
    } else if (activeTab === 'paymentStatuses') {
      if (!paymentStatuses.includes(clean)) {
        onUpdateMasterData({
          ...masterData,
          paymentStatuses: [...paymentStatuses, clean],
        });
      }
    }

    setNewTextValue('');
  };

  const handleSaveStringEdit = (arrKey: 'lawyerDesignations' | 'caseTypes' | 'casePertainsTo' | 'paymentStatuses', idx: number) => {
    if (!editValue.trim()) {
      setEditingKey(null);
      return;
    }
    const currentList = [...(masterData[arrKey] || [])];
    currentList[idx] = editValue.trim();
    onUpdateMasterData({
      ...masterData,
      [arrKey]: currentList,
    });
    setEditingKey(null);
  };

  const handleDeleteStringItem = (arrKey: 'lawyerDesignations' | 'caseTypes' | 'casePertainsTo' | 'paymentStatuses', idx: number) => {
    const currentList = [...(masterData[arrKey] || [])];
    currentList.splice(idx, 1);
    onUpdateMasterData({
      ...masterData,
      [arrKey]: currentList,
    });
  };

  const handleSaveCircleEdit = (id: string) => {
    if (!editValue.trim()) {
      setEditingKey(null);
      return;
    }
    const updated = masterData.circles.map((c) =>
      c.id === id ? { ...c, name: editValue.trim() } : c
    );
    onUpdateMasterData({ ...masterData, circles: updated });
    setEditingKey(null);
  };

  const handleDeleteCircle = (id: string) => {
    const updated = masterData.circles.filter((c) => c.id !== id);
    onUpdateMasterData({ ...masterData, circles: updated });
  };

  const handleSaveDivisionEdit = (id: string) => {
    if (!editValue.trim()) {
      setEditingKey(null);
      return;
    }
    const updated = masterData.divisions.map((d) =>
      d.id === id ? { ...d, name: editValue.trim() } : d
    );
    onUpdateMasterData({ ...masterData, divisions: updated });
    setEditingKey(null);
  };

  const handleDeleteDivision = (id: string) => {
    const updated = masterData.divisions.filter((d) => d.id !== id);
    onUpdateMasterData({ ...masterData, divisions: updated });
  };

  const tabsConfig = [
    { id: 'circles' as TabType, label: 'Circles', icon: MapPin, count: masterData.circles?.length || 0 },
    { id: 'divisions' as TabType, label: 'Divisions', icon: Building, count: masterData.divisions?.length || 0 },
    { id: 'lawyerDesignations' as TabType, label: 'Lawyer Designations', icon: Briefcase, count: lawyerDesignations.length },
    { id: 'caseTypes' as TabType, label: 'Case Types', icon: Scale, count: caseTypes.length },
    { id: 'casePertainsTo' as TabType, label: 'Pertains To', icon: Building2, count: casePertainsTo.length },
    { id: 'paymentStatuses' as TabType, label: 'Payment Statuses', icon: CreditCard, count: paymentStatuses.length },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Fee Claims Master Data Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Configure circles, divisions, designations, case types, and payment statuses for fee claims
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl overflow-x-auto">
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setEditingKey(null);
                  setNewTextValue('');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
      </div>

      {/* Add / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {activeTab === 'divisions' && (
          <div className="w-full sm:w-56">
            <SearchableSelect
              options={masterData.circles.map((c) => c.name)}
              value={selectedCircleForDiv}
              onChange={(val) => setSelectedCircleForDiv(val)}
              placeholder="Select Circle..."
            />
          </div>
        )}

        <input
          type="text"
          placeholder={`Add new ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
          value={newTextValue}
          onChange={(e) => setNewTextValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="flex-1 py-2 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleAdd}
          disabled={!newTextValue.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Option</span>
        </button>

        <input
          type="text"
          placeholder="Filter list..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-44 py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tab Contents */}
      {/* 1. Circles Tab */}
      {activeTab === 'circles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {masterData.circles
            .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((c) => {
              const isEditing = editingKey === c.id;
              return (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCircleEdit(c.id);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-bold outline-none"
                      />
                      <button
                        onClick={() => handleSaveCircleEdit(c.id)}
                        className="p-1 bg-emerald-600 text-white rounded-md cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 rounded-md cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{c.name} Circle</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-extrabold text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingKey(c.id);
                            setEditValue(c.name);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer"
                          title="Rename Circle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCircle(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Delete Circle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* 2. Divisions Tab */}
      {activeTab === 'divisions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {masterData.divisions
            .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.circleName.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((d) => {
              const isEditing = editingKey === d.id;
              return (
                <div
                  key={d.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDivisionEdit(d.id);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-bold outline-none"
                      />
                      <button
                        onClick={() => handleSaveDivisionEdit(d.id)}
                        className="p-1 bg-emerald-600 text-white rounded-md cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 rounded-md cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{d.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{d.circleName} Circle</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingKey(d.id);
                            setEditValue(d.name);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer"
                          title="Rename Division"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDivision(d.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Delete Division"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* 3, 4, 5, 6: String Array Tabs */}
      {['lawyerDesignations', 'caseTypes', 'casePertainsTo', 'paymentStatuses'].includes(activeTab) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {((masterData[activeTab as keyof FeeBillMasterDataConfig] as string[]) || [])
            .filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((item, idx) => {
              const isEditing = editingKey === `${activeTab}-${idx}`;
              return (
                <div
                  key={`${item}-${idx}`}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleSaveStringEdit(
                              activeTab as 'lawyerDesignations' | 'caseTypes' | 'casePertainsTo' | 'paymentStatuses',
                              idx
                            );
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-bold outline-none"
                      />
                      <button
                        onClick={() =>
                          handleSaveStringEdit(
                            activeTab as 'lawyerDesignations' | 'caseTypes' | 'casePertainsTo' | 'paymentStatuses',
                            idx
                          )
                        }
                        className="p-1 bg-emerald-600 text-white rounded-md cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 rounded-md cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{item}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingKey(`${activeTab}-${idx}`);
                            setEditValue(item);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer"
                          title="Rename Option"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteStringItem(
                              activeTab as 'lawyerDesignations' | 'caseTypes' | 'casePertainsTo' | 'paymentStatuses',
                              idx
                            )
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Delete Option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
