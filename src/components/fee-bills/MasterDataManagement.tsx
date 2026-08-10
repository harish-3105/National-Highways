'use client';

import React, { useState } from 'react';
import { FeeBillMasterDataConfig } from '@/types/feeBill';
import { Settings, Plus, CheckCircle2, XCircle, Building, UserCheck } from 'lucide-react';

interface MasterDataManagementProps {
  masterData: FeeBillMasterDataConfig;
  onUpdateMasterData: (newData: FeeBillMasterDataConfig) => void;
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  masterData,
  onUpdateMasterData,
}) => {
  const [activeTab, setActiveTab] = useState<'circles' | 'divisions' | 'lawyers'>('circles');
  const [newCircleName, setNewCircleName] = useState('');
  const [newDivName, setNewDivName] = useState('');
  const [selectedCircleForDiv, setSelectedCircleForDiv] = useState(masterData.circles[0]?.name || '');

  const handleAddCircle = () => {
    if (!newCircleName.trim()) return;
    const newCircle = {
      id: `c-${Date.now()}`,
      name: newCircleName.trim(),
      active: true,
    };
    const updated = {
      ...masterData,
      circles: [...masterData.circles, newCircle],
    };
    onUpdateMasterData(updated);
    setNewCircleName('');
  };

  const handleAddDivision = () => {
    if (!newDivName.trim()) return;
    const newDiv = {
      id: `d-${Date.now()}`,
      circleName: selectedCircleForDiv,
      name: newDivName.trim(),
      active: true,
    };
    const updated = {
      ...masterData,
      divisions: [...masterData.divisions, newDiv],
    };
    onUpdateMasterData(updated);
    setNewDivName('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Master Data Configuration Manager
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure Circles, Divisions, and Law Officer Designations for Fee Claims
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('circles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'circles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Circles ({masterData.circles.length})
          </button>
          <button
            onClick={() => setActiveTab('divisions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'divisions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Divisions ({masterData.divisions.length})
          </button>
        </div>
      </div>

      {activeTab === 'circles' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Enter New Circle Name (e.g., Tirunelveli)"
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddCircle}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Circle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {masterData.circles.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{c.name} Circle</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'divisions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedCircleForDiv}
              onChange={(e) => setSelectedCircleForDiv(e.target.value)}
              className="w-full sm:w-48 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {masterData.circles.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} Circle
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter New Division Name (e.g., Hosur Division)"
              value={newDivName}
              onChange={(e) => setNewDivName(e.target.value)}
              className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleAddDivision}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Division</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {masterData.divisions.map((d) => (
              <div
                key={d.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{d.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{d.circleName} Circle</span>
                </div>
                <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {d.circleName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
