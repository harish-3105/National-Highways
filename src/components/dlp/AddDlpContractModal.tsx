'use client';

import React, { useState, useEffect } from 'react';
import { DLPContractItem, DLPSubContract } from '@/app/dlp/page';
import {
  DLP_CIRCLE_OPTIONS,
  DLP_CIRCLE_DIVISION_MAP,
  getCircleForDivision,
} from '@/lib/dlp/masterData';
import { ShieldCheck, X, Plus, Trash2, Layers } from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface AddDlpContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONTRACT_MODES = ['EPC', 'STMC', 'PBMC', 'BOT', 'HAM', 'Annual Plan', 'Special Repairs'];
const MAINTENANCE_TYPES = ['DLP', 'STMC', 'PBMC', 'CONSTRUCTION', 'NO_DLP', 'UNCONTRACTED'];

export const AddDlpContractModal: React.FC<AddDlpContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [highwayCode, setHighwayCode] = useState('');
  const [circleName, setCircleName] = useState<string>('');
  const [divisionName, setDivisionName] = useState<string>('');
  const [stretchName, setStretchName] = useState('');
  const [fromKm, setFromKm] = useState<number | ''>('');
  const [toKm, setToKm] = useState<number | ''>('');

  const [contractorName, setContractorName] = useState('');
  const [contractMode, setContractMode] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dlpExpiryDate, setDlpExpiryDate] = useState('');

  // 100% Complete Breakdown Category Inputs
  const [dlpContractCount, setDlpContractCount] = useState<number>(0);
  const [dlpLengthKm, setDlpLengthKm] = useState<number>(0);
  const [dlpChainage, setDlpChainage] = useState('');

  const [stmcContractCount, setStmcContractCount] = useState<number>(0);
  const [stmcLengthKm, setStmcLengthKm] = useState<number>(0);
  const [stmcChainage, setStmcChainage] = useState('');
  const [stmcExpiryDate, setStmcExpiryDate] = useState('');

  const [constructionProjectCount, setConstructionProjectCount] = useState<number>(0);
  const [constructionLengthKm, setConstructionLengthKm] = useState<number>(0);
  const [constructionChainage, setConstructionChainage] = useState('');

  const [pbmcProjectCount, setPbmcProjectCount] = useState<number>(0);
  const [pbmcLengthKm, setPbmcLengthKm] = useState<number>(0);
  const [pbmcChainage, setPbmcChainage] = useState('');
  const [pbmcExpiryDate, setPbmcExpiryDate] = useState('');

  const [noDlpLengthKm, setNoDlpLengthKm] = useState<number>(0);
  const [noDlpChainage, setNoDlpChainage] = useState('');
  const [noDlpExpiryDate, setNoDlpExpiryDate] = useState('');

  const [uncontractedAfter2027Km, setUncontractedAfter2027Km] = useState<number>(0);

  // 1-to-N Granular Child Sub-Contracts Dynamic Repeater List
  const [subContracts, setSubContracts] = useState<DLPSubContract[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update available division options when Circle changes
  const divisionOptions = circleName
    ? (DLP_CIRCLE_DIVISION_MAP[circleName] || [])
    : Object.values(DLP_CIRCLE_DIVISION_MAP).flat();

  const handleCircleChange = (c: string) => {
    setCircleName(c);
    setDivisionName('');
  };

  const handleAddSubContract = () => {
    const newSub: DLPSubContract = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      maintenance_type: 'DLP',
      sub_stretch_title: '',
      from_km: 0,
      to_km: 0,
      length_km: 0,
      contractor_name: '',
      expiry_date: '',
      remarks: '',
    };
    setSubContracts((prev) => [...prev, newSub]);
  };

  const handleRemoveSubContract = (index: number) => {
    setSubContracts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSubContract = (index: number, field: keyof DLPSubContract, value: any) => {
    setSubContracts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calculatedLength =
    fromKm !== '' && toKm !== '' ? Math.max(0, Math.round((Number(toKm) - Number(fromKm)) * 1000) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!highwayCode.trim()) {
      setErrorMsg('Highway code is required (e.g. NH-179A)');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const formattedHighwayCode = highwayCode.toUpperCase().startsWith('NH')
        ? highwayCode.toUpperCase()
        : `NH-${highwayCode.toUpperCase()}`;

      const autoStretchName =
        stretchName.trim() ||
        `${divisionName} Division - ${formattedHighwayCode} (Km ${fromKm} to ${toKm})`;

      const payload: Partial<DLPContractItem> = {
        highway_code: formattedHighwayCode,
        division_name: divisionName,
        stretch_name: autoStretchName,
        from_km: Number(fromKm || 0),
        to_km: Number(toKm || 0),
        length_km: calculatedLength,

        // All 26 Excel Sub-Columns
        dlp_contract_count: Number(dlpContractCount || 0),
        dlp_length_km: Number(dlpLengthKm || 0),
        dlp_chainage: dlpChainage.trim(),
        dlp_expiry_date: dlpExpiryDate || undefined,

        construction_project_count: Number(constructionProjectCount || 0),
        construction_length_km: Number(constructionLengthKm || 0),
        construction_chainage: constructionChainage.trim(),

        stmc_contract_count: Number(stmcContractCount || 0),
        stmc_length_km: Number(stmcLengthKm || 0),
        stmc_chainage: stmcChainage.trim(),
        stmc_expiry_date: stmcExpiryDate || undefined,

        pbmc_project_count: Number(pbmcProjectCount || 0),
        pbmc_length_km: Number(pbmcLengthKm || 0),
        pbmc_chainage: pbmcChainage.trim(),
        pbmc_expiry_date: pbmcExpiryDate || undefined,

        no_dlp_length_km: Number(noDlpLengthKm || 0),
        no_dlp_chainage: noDlpChainage.trim(),
        no_dlp_expiry_date: noDlpExpiryDate || undefined,

        uncontracted_after_2027_km: Number(uncontractedAfter2027Km || 0),

        // 1-to-N Granular Child Sub-Contracts Array
        sub_contracts: subContracts,

        contractor_name: contractorName.trim() || `${divisionName} Division (Contractor DLP)`,
        contract_mode: contractMode,
        work_description: workDescription.trim() || `Maintenance & DLP period under ${divisionName} Division (${contractMode})`,
        doc_date: docDate || undefined,
      };

      const res = await fetch('/api/dlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to create DLP contract.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Server error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">Add DLP & Maintenance Record</h3>
              <p className="text-xs text-slate-300">Log full 26-column Excel metrics & granular sub-contracts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Circle & Division Cascading Selection */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              1. Circle, Division & Chainages
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Highway Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-179A"
                  value={highwayCode}
                  onChange={(e) => setHighwayCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Circle <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={DLP_CIRCLE_OPTIONS}
                  value={circleName}
                  onChange={handleCircleChange}
                  placeholder="Select Circle..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Division <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={divisionOptions}
                  value={divisionName}
                  onChange={setDivisionName}
                  placeholder="Select Division..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stretch Name / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Salem Division - NH-179A (Km 0 to 80)"
                value={stretchName}
                onChange={(e) => setStretchName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">From Km</label>
                <input
                  type="number"
                  step="0.001"
                  value={fromKm}
                  onChange={(e) => setFromKm(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">To Km</label>
                <input
                  type="number"
                  step="0.001"
                  value={toKm}
                  onChange={(e) => setToKm(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Stretch Length</label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-extrabold text-blue-600 dark:text-blue-400">
                  {calculatedLength} km
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Complete Category Sub-Chainages & Expiry Inputs */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              2. Summary Breakdown Metrics (Excel Columns 6-24)
            </h4>

            {/* Category Breakdown Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Under DLP Guarantee</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Contracts Count</label>
                    <input
                      type="number"
                      value={dlpContractCount}
                      onChange={(e) => setDlpContractCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Length (km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={dlpLengthKm}
                      onChange={(e) => setDlpLengthKm(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">DLP Chainages (Col 8)</label>
                  <input
                    type="text"
                    placeholder="e.g. Km 0/0 - 80/0"
                    value={dlpChainage}
                    onChange={(e) => setDlpChainage(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">DLP Till Date (Col 9)</label>
                  <input
                    type="date"
                    value={dlpExpiryDate}
                    onChange={(e) => setDlpExpiryDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Short-Term Maintenance (STMC)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Contracts Count</label>
                    <input
                      type="number"
                      value={stmcContractCount}
                      onChange={(e) => setStmcContractCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Length (km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={stmcLengthKm}
                      onChange={(e) => setStmcLengthKm(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">STMC Chainages (Col 15)</label>
                  <input
                    type="text"
                    placeholder="e.g. Km 0/0 - 45/0"
                    value={stmcChainage}
                    onChange={(e) => setStmcChainage(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">STMC Expiry Date (Col 16)</label>
                  <input
                    type="date"
                    value={stmcExpiryDate}
                    onChange={(e) => setStmcExpiryDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                  />
                </div>
              </div>
            </div>

            {/* PBMC, Construction & No DLP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">PBMC Projects</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Count</label>
                    <input
                      type="number"
                      value={pbmcProjectCount}
                      onChange={(e) => setPbmcProjectCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Length (km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={pbmcLengthKm}
                      onChange={(e) => setPbmcLengthKm(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">PBMC Chainages (Col 19)</label>
                  <input
                    type="text"
                    placeholder="e.g. Km 0/0 - 31/8"
                    value={pbmcChainage}
                    onChange={(e) => setPbmcChainage(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">PBMC Expiry Date (Col 20)</label>
                  <input
                    type="date"
                    value={pbmcExpiryDate}
                    onChange={(e) => setPbmcExpiryDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Under Construction</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Projects</label>
                    <input
                      type="number"
                      value={constructionProjectCount}
                      onChange={(e) => setConstructionProjectCount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Length (km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={constructionLengthKm}
                      onChange={(e) => setConstructionLengthKm(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">Construction Chainage</label>
                  <input
                    type="text"
                    placeholder="e.g. Km 8.770"
                    value={constructionChainage}
                    onChange={(e) => setConstructionChainage(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">No DLP Stretch</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">No DLP Length (km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={noDlpLengthKm}
                      onChange={(e) => setNoDlpLengthKm(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Expiry Date (Col 23)</label>
                    <input
                      type="date"
                      value={noDlpExpiryDate}
                      onChange={(e) => setNoDlpExpiryDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">No DLP Chainages</label>
                  <input
                    type="text"
                    value={noDlpChainage}
                    onChange={(e) => setNoDlpChainage(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Uncontracted Length After 31.03.2027 (km)</label>
              <input
                type="number"
                step="0.001"
                value={uncontractedAfter2027Km}
                onChange={(e) => setUncontractedAfter2027Km(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-700 dark:text-blue-400"
              />
            </div>
          </div>

          {/* Section 3: 1-to-N Granular Sub-Contracts Dynamic Repeater */}
          <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  3. Individual Maintenance Sub-Contracts (Granular Relational 1-to-N)
                </h4>
                <p className="text-[11px] text-slate-500">Log distinct sub-stretches with individual contractors, chainages, and expiry dates</p>
              </div>

              <button
                type="button"
                onClick={handleAddSubContract}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub-Contract</span>
              </button>
            </div>

            {subContracts.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-900 text-center text-slate-500 text-xs">
                No granular sub-contracts added yet. Click <strong>+ Add Sub-Contract</strong> above to log individual maintenance stretches.
              </div>
            ) : (
              <div className="space-y-3">
                {subContracts.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-blue-700 dark:text-blue-400 text-xs">
                        Sub-Contract #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubContract(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Maintenance Type
                        </label>
                        <SearchableSelect
                          options={MAINTENANCE_TYPES}
                          value={sub.maintenance_type}
                          onChange={(val) => handleUpdateSubContract(idx, 'maintenance_type', val)}
                          placeholder="Select Type..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sub-Stretch Chainage Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Km 12.650 to Km 20.00"
                          value={sub.sub_stretch_title}
                          onChange={(e) => handleUpdateSubContract(idx, 'sub_stretch_title', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sub-Stretch Length (km)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={sub.length_km || 0}
                          onChange={(e) => handleUpdateSubContract(idx, 'length_km', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-blue-600 dark:text-blue-400 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sub-Contractor Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Apex Constructions Pvt Ltd"
                          value={sub.contractor_name || ''}
                          onChange={(e) => handleUpdateSubContract(idx, 'contractor_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Specific Expiry Date
                        </label>
                        <input
                          type="date"
                          value={sub.expiry_date || ''}
                          onChange={(e) => handleUpdateSubContract(idx, 'expiry_date', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Contractor Info & Remarks */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              4. Overall Contract Info & Remarks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Overall Contractor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Salem Division (Contractor DLP)"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Contract Mode</label>
                <SearchableSelect
                  options={CONTRACT_MODES}
                  value={contractMode}
                  onChange={setContractMode}
                  placeholder="Select Mode..."
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departmental Remarks & Work Scope</label>
              <textarea
                rows={3}
                placeholder="e.g. Proposed under Special Repairs 2026-27..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create DLP Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDlpContractModal;
