'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  AlertCircle,
  FileText,
  MapPin,
  Layers,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { DLPContractItem, DLPSubContract } from '@/app/dlp/page';
import {
  DLP_CIRCLE_OPTIONS,
  DLP_CIRCLE_DIVISION_MAP,
  getCircleForDivision,
} from '@/lib/dlp/masterData';
import { DatePickerInput } from '@/components/common/DatePickerInput';

interface DlpContractEntryFormProps {
  initialData?: Partial<DLPContractItem>;
  onSave: (contractData: Partial<DLPContractItem>) => Promise<void> | void;
  onCancel: () => void;
}

const CONTRACT_MODES = ['EPC', 'STMC', 'PBMC', 'BOT', 'HAM', 'Annual Plan', 'Special Repairs'];
const MAINTENANCE_TYPES = ['DLP', 'STMC', 'PBMC', 'CONSTRUCTION', 'NO_DLP', 'UNCONTRACTED'];

export const DlpContractEntryForm: React.FC<DlpContractEntryFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const initialCircle = (initialData?.division_name
    ? getCircleForDivision(initialData.division_name)
    : null) || 'Salem';

  const [highwayCode, setHighwayCode] = useState<string>(initialData?.highway_code || '');
  const [circleName, setCircleName] = useState<string>(initialCircle);
  const [divisionName, setDivisionName] = useState<string>(initialData?.division_name || 'Salem');
  const [stretchName, setStretchName] = useState<string>(initialData?.stretch_name || '');
  const [fromKm, setFromKm] = useState<string>(
    initialData?.from_km !== undefined && initialData?.from_km !== null ? String(initialData.from_km) : '0'
  );
  const [toKm, setToKm] = useState<string>(
    initialData?.to_km !== undefined && initialData?.to_km !== null ? String(initialData.to_km) : '10'
  );

  const [contractorName, setContractorName] = useState<string>(initialData?.contractor_name || '');
  const [contractMode, setContractMode] = useState<string>(initialData?.contract_mode || 'EPC');
  const [workDescription, setWorkDescription] = useState<string>(initialData?.work_description || '');
  const [docDate, setDocDate] = useState<string>(initialData?.doc_date || '');
  const [dlpExpiryDate, setDlpExpiryDate] = useState<string>(initialData?.dlp_expiry_date || '');

  // 100% Complete Breakdown Category Inputs
  const [dlpContractCount, setDlpContractCount] = useState<string>(
    initialData?.dlp_contract_count !== undefined ? String(initialData.dlp_contract_count) : '0'
  );
  const [dlpLengthKm, setDlpLengthKm] = useState<string>(
    initialData?.dlp_length_km !== undefined ? String(initialData.dlp_length_km) : '0'
  );
  const [dlpChainage, setDlpChainage] = useState<string>(initialData?.dlp_chainage || '');

  const [stmcContractCount, setStmcContractCount] = useState<string>(
    initialData?.stmc_contract_count !== undefined ? String(initialData.stmc_contract_count) : '0'
  );
  const [stmcLengthKm, setStmcLengthKm] = useState<string>(
    initialData?.stmc_length_km !== undefined ? String(initialData.stmc_length_km) : '0'
  );
  const [stmcChainage, setStmcChainage] = useState<string>(initialData?.stmc_chainage || '');
  const [stmcExpiryDate, setStmcExpiryDate] = useState<string>(initialData?.stmc_expiry_date || '');

  const [constructionProjectCount, setConstructionProjectCount] = useState<string>(
    initialData?.construction_project_count !== undefined
      ? String(initialData.construction_project_count)
      : '0'
  );
  const [constructionLengthKm, setConstructionLengthKm] = useState<string>(
    initialData?.construction_length_km !== undefined
      ? String(initialData.construction_length_km)
      : '0'
  );
  const [constructionChainage, setConstructionChainage] = useState<string>(
    initialData?.construction_chainage || ''
  );

  const [pbmcProjectCount, setPbmcProjectCount] = useState<string>(
    initialData?.pbmc_project_count !== undefined ? String(initialData.pbmc_project_count) : '0'
  );
  const [pbmcLengthKm, setPbmcLengthKm] = useState<string>(
    initialData?.pbmc_length_km !== undefined ? String(initialData.pbmc_length_km) : '0'
  );
  const [pbmcChainage, setPbmcChainage] = useState<string>(initialData?.pbmc_chainage || '');
  const [pbmcExpiryDate, setPbmcExpiryDate] = useState<string>(initialData?.pbmc_expiry_date || '');

  const [noDlpLengthKm, setNoDlpLengthKm] = useState<string>(
    initialData?.no_dlp_length_km !== undefined ? String(initialData.no_dlp_length_km) : '0'
  );
  const [noDlpChainage, setNoDlpChainage] = useState<string>(initialData?.no_dlp_chainage || '');
  const [noDlpExpiryDate, setNoDlpExpiryDate] = useState<string>(initialData?.no_dlp_expiry_date || '');

  const [uncontractedAfter2027Km, setUncontractedAfter2027Km] = useState<string>(
    initialData?.uncontracted_after_2027_km !== undefined
      ? String(initialData.uncontracted_after_2027_km)
      : '0'
  );

  // 1-to-N Granular Child Sub-Contracts Dynamic Repeater List
  const [subContracts, setSubContracts] = useState<DLPSubContract[]>(
    initialData?.sub_contracts || []
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const divisionOptions = DLP_CIRCLE_DIVISION_MAP[circleName] || [];

  const handleCircleChange = (c: string) => {
    setCircleName(c);
    const divs = DLP_CIRCLE_DIVISION_MAP[c] || [];
    if (divs.length > 0) setDivisionName(divs[0]);
  };

  const handleAddSubContract = () => {
    const newSub: DLPSubContract = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      maintenance_type: 'DLP',
      sub_stretch_title: '',
      from_km: 0,
      to_km: 0,
      length_km: 0,
      contractor_name: contractorName || '',
      expiry_date: dlpExpiryDate || '',
      remarks: '',
    };
    setSubContracts((prev) => [...prev, newSub]);
  };

  const handleRemoveSubContract = (index: number) => {
    setSubContracts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSubContract = (index: number, field: keyof DLPSubContract, value: unknown) => {
    setSubContracts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'from_km' || field === 'to_km') {
        const f = Number(field === 'from_km' ? value : updated[index].from_km) || 0;
        const t = Number(field === 'to_km' ? value : updated[index].to_km) || 0;
        updated[index].length_km = Math.max(0, Math.round((t - f) * 1000) / 1000);
      }
      return updated;
    });
  };

  const calculatedLength =
    fromKm !== '' && toKm !== '' ? Math.max(0, Math.round((Number(toKm) - Number(fromKm)) * 1000) / 1000) : 0;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!highwayCode.trim()) newErrors.highwayCode = 'Highway Code is required (e.g. NH-179A).';
    if (!divisionName.trim()) newErrors.divisionName = 'Division Name is required.';
    if (fromKm === '' || isNaN(Number(fromKm))) newErrors.fromKm = 'Valid From Km is required.';
    if (toKm === '' || isNaN(Number(toKm))) newErrors.toKm = 'Valid To Km is required.';
    if (Number(toKm) < Number(fromKm)) newErrors.toKm = 'To Km cannot be less than From Km.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const formattedHighwayCode = highwayCode.toUpperCase().startsWith('NH')
      ? highwayCode.toUpperCase()
      : `NH-${highwayCode.toUpperCase()}`;

    const autoStretchName =
      stretchName.trim() ||
      `${divisionName} Division - ${formattedHighwayCode} (Km ${fromKm} to ${toKm})`;

    const payload: Partial<DLPContractItem> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      highway_code: formattedHighwayCode,
      division_name: divisionName,
      stretch_name: autoStretchName,
      from_km: Number(fromKm || 0),
      to_km: Number(toKm || 0),
      length_km: calculatedLength,

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

      sub_contracts: subContracts,

      contractor_name: contractorName.trim() || `${divisionName} Division (Contractor DLP)`,
      contract_mode: contractMode,
      work_description:
        workDescription.trim() ||
        `Maintenance & DLP period under ${divisionName} Division (${contractMode})`,
      doc_date: docDate || undefined,
    };

    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Sticky Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to DLP List
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit DLP Maintenance Master Record' : 'New DLP Maintenance Master Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Maintenance &bull; Defect Liability Period, STMC, PBMC & Child Stretches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving DLP Record...' : 'Save DLP Record'}
          </button>
        </div>
      </div>

      {/* Validation Diagnostic Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the following required fields ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 1: Corridor & Stretch Bounds */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 1: Corridor & Geographic Stretch Bounds
            </h3>
            <span className="text-xs text-blue-200">
              National Highway corridor code, administrative circle/division assignment, and chainage limits
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highway Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={highwayCode}
                onChange={(e) => {
                  setHighwayCode(e.target.value);
                  if (errors.highwayCode) setErrors((prev) => ({ ...prev, highwayCode: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NH-179A"
                required
              />
              {errors.highwayCode && <p className="text-[11px] text-rose-500 mt-1">{errors.highwayCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Administrative Circle <span className="text-rose-500">*</span>
              </label>
              <select
                value={circleName}
                onChange={(e) => handleCircleChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DLP_CIRCLE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c} Circle
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Division Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={divisionName}
                onChange={(e) => {
                  setDivisionName(e.target.value);
                  if (errors.divisionName) setErrors((prev) => ({ ...prev, divisionName: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {divisionOptions.map((d) => (
                  <option key={d} value={d}>
                    {d} Division
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stretch Title / Location Description
              </label>
              <input
                type="text"
                value={stretchName}
                onChange={(e) => setStretchName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Salem - Harur - Tirupattur Section"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                From Km <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={fromKm}
                onChange={(e) => setFromKm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                To Km <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={toKm}
                onChange={(e) => setToKm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-blue-800 dark:text-blue-300">
              Calculated Master Stretch Length:
            </span>
            <span className="font-extrabold text-blue-700 dark:text-blue-400 font-mono text-sm">
              {calculatedLength} Km
            </span>
          </div>
        </div>
      </div>

      {/* MODULE 2: Primary Execution & Contractor Particulars */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 text-white flex items-center gap-3">
          <Building2 className="w-5 h-5 text-emerald-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 2: Primary Contract Execution & Maintenance Dates
            </h3>
            <span className="text-xs text-emerald-200">
              Contractor identity, execution procurement mode, commercial start, and DLP expiry dates
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contractor Name / Agency
              </label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. M/s ABC Infrastructure Ltd"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contract Mode
              </label>
              <select
                value={contractMode}
                onChange={(e) => setContractMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONTRACT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <DatePickerInput
                label="Date of Commencement (DOC)"
                value={docDate}
                onChange={setDocDate}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <DatePickerInput
                label="Primary DLP Expiry Date"
                value={dlpExpiryDate}
                onChange={setDlpExpiryDate}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Scope Description
              </label>
              <input
                type="text"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Four laning with paved shoulder and 5-year maintenance warranty"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: 100% Granular Category Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 text-white flex items-center gap-3">
          <Layers className="w-5 h-5 text-amber-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 3: 100% Complete Maintenance Category Breakdown
            </h3>
            <span className="text-xs text-amber-200">
              Verified sub-stretch metrics across DLP, Construction, STMC, PBMC, and Non-DLP categories
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: DLP */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                1. Defect Liability Period (DLP)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Contract Count</label>
                  <input
                    type="number"
                    min="0"
                    value={dlpContractCount}
                    onChange={(e) => setDlpContractCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Length (Km)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={dlpLengthKm}
                    onChange={(e) => setDlpLengthKm(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-500">Chainage Bounds</label>
                <input
                  type="text"
                  value={dlpChainage}
                  onChange={(e) => setDlpChainage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                  placeholder="e.g. 0/0 - 45/200"
                />
              </div>
            </div>

            {/* Card 2: Construction */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                2. Active Construction
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Project Count</label>
                  <input
                    type="number"
                    min="0"
                    value={constructionProjectCount}
                    onChange={(e) => setConstructionProjectCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Length (Km)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={constructionLengthKm}
                    onChange={(e) => setConstructionLengthKm(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-500">Chainage Bounds</label>
                <input
                  type="text"
                  value={constructionChainage}
                  onChange={(e) => setConstructionChainage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                  placeholder="e.g. 45/200 - 80/0"
                />
              </div>
            </div>

            {/* Card 3: STMC */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                3. Short-Term Maintenance (STMC)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">STMC Count</label>
                  <input
                    type="number"
                    min="0"
                    value={stmcContractCount}
                    onChange={(e) => setStmcContractCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Length (Km)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={stmcLengthKm}
                    onChange={(e) => setStmcLengthKm(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Chainage</label>
                  <input
                    type="text"
                    value={stmcChainage}
                    onChange={(e) => setStmcChainage(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <DatePickerInput
                    label="STMC Expiry"
                    value={stmcExpiryDate}
                    onChange={setStmcExpiryDate}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: PBMC */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                4. Performance-Based Maintenance (PBMC)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">PBMC Count</label>
                  <input
                    type="number"
                    min="0"
                    value={pbmcProjectCount}
                    onChange={(e) => setPbmcProjectCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Length (Km)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={pbmcLengthKm}
                    onChange={(e) => setPbmcLengthKm(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Chainage</label>
                  <input
                    type="text"
                    value={pbmcChainage}
                    onChange={(e) => setPbmcChainage(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <DatePickerInput
                    label="PBMC Expiry"
                    value={pbmcExpiryDate}
                    onChange={setPbmcExpiryDate}
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Non-DLP */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                5. Non-DLP Stretches
              </h4>
              <div>
                <label className="text-[10.5px] font-bold text-slate-500">Length (Km)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={noDlpLengthKm}
                  onChange={(e) => setNoDlpLengthKm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-500">Chainage</label>
                  <input
                    type="text"
                    value={noDlpChainage}
                    onChange={(e) => setNoDlpChainage(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <DatePickerInput
                    label="Expected Expiry"
                    value={noDlpExpiryDate}
                    onChange={setNoDlpExpiryDate}
                  />
                </div>
              </div>
            </div>

            {/* Card 6: Uncontracted Post-2027 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                6. Uncontracted Beyond 2027
              </h4>
              <div>
                <label className="text-[10.5px] font-bold text-slate-500">Uncontracted Length (Km)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={uncontractedAfter2027Km}
                  onChange={(e) => setUncontractedAfter2027Km(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 4: Granular Child Sub-Contracts Dynamic Repeater */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-300" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                MODULE 4: Granular Child Sub-Contracts Repeater ({subContracts.length})
              </h3>
              <span className="text-xs text-indigo-200">
                1-to-N dynamic maintenance sub-stretches with independent contractors and expiry tracking
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddSubContract}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Sub-Stretch
          </button>
        </div>

        <div className="p-6 space-y-4">
          {subContracts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-medium mb-3">
                No child sub-contracts attached to this master stretch yet.
              </p>
              <button
                type="button"
                onClick={handleAddSubContract}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add First Child Sub-Contract
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subContracts.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      Sub-Contract #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubContract(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove Sub-Contract"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">Maintenance Type</label>
                      <select
                        value={sub.maintenance_type}
                        onChange={(e) => handleUpdateSubContract(idx, 'maintenance_type', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                      >
                        {MAINTENANCE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">Sub-Stretch Title</label>
                      <input
                        type="text"
                        value={sub.sub_stretch_title}
                        onChange={(e) => handleUpdateSubContract(idx, 'sub_stretch_title', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                        placeholder="e.g. Bypass Package 1"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">From Km</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={sub.from_km || 0}
                        onChange={(e) => handleUpdateSubContract(idx, 'from_km', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">To Km</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={sub.to_km || 0}
                        onChange={(e) => handleUpdateSubContract(idx, 'to_km', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">Contractor Name</label>
                      <input
                        type="text"
                        value={sub.contractor_name || ''}
                        onChange={(e) => handleUpdateSubContract(idx, 'contractor_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                        placeholder="Contractor Firm"
                      />
                    </div>

                    <div>
                      <DatePickerInput
                        label="Expiry Date"
                        value={sub.expiry_date || ''}
                        onChange={(val) => handleUpdateSubContract(idx, 'expiry_date', val)}
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500">Sub-Contract Remarks</label>
                      <input
                        type="text"
                        value={sub.remarks || ''}
                        onChange={(e) => handleUpdateSubContract(idx, 'remarks', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                        placeholder="e.g. PBMC under inspection"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving DLP Record...' : 'Save Complete DLP Record'}
        </button>
      </div>
    </form>
  );
};

export default DlpContractEntryForm;
