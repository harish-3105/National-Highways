'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Layers,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Check,
  LockKeyhole,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { DlpCorridor, DlpWorkStretch, DlpWorkCategory, DlpMasterData } from '@/types/dlp';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { SubChainageStretch } from '@/app/api/sub-chainages/route';
import { detectLaneWidthForChainage, checkSpanWidthCapacity } from '@/lib/dlp/laneDetection';

interface DlpContractEntryFormProps {
  initialData?: Partial<DlpCorridor>;
  masterData?: DlpMasterData;
  onSave: (corridorData: Partial<DlpCorridor>) => Promise<void> | void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: Record<
  DlpWorkCategory,
  { label: string; bgBadge: string; textBadge: string; borderCard: string; dotColor: string }
> = {
  DLP: {
    label: 'Under DLP',
    bgBadge: 'bg-emerald-100 dark:bg-emerald-950',
    textBadge: 'text-emerald-800 dark:text-emerald-200',
    borderCard: 'border-emerald-300 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
  },
  CONSTRUCTION: {
    label: 'Under Construction',
    bgBadge: 'bg-blue-100 dark:bg-blue-950',
    textBadge: 'text-blue-800 dark:text-blue-200',
    borderCard: 'border-blue-300 dark:border-blue-800/60',
    dotColor: 'bg-blue-500',
  },
  STMC: {
    label: 'Under STMC',
    bgBadge: 'bg-amber-100 dark:bg-amber-950',
    textBadge: 'text-amber-800 dark:text-amber-200',
    borderCard: 'border-amber-300 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
  },
  PBMC: {
    label: 'Under PBMC',
    bgBadge: 'bg-purple-100 dark:bg-purple-950',
    textBadge: 'text-purple-800 dark:text-purple-200',
    borderCard: 'border-purple-300 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
  },
  NO_DLP: {
    label: 'Under NO DLP',
    bgBadge: 'bg-slate-200 dark:bg-slate-800',
    textBadge: 'text-slate-800 dark:text-slate-200',
    borderCard: 'border-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-500',
  },
};

export const DlpContractEntryForm: React.FC<DlpContractEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'STRETCHES'>('IDENTITY');

  // Tab 1: Corridor & Jurisdiction
  const [divisionName, setDivisionName] = useState<string>(initialData?.division_name || '');
  const [highwayCode, setHighwayCode] = useState<string>(initialData?.highway_code || '');
  const [fromKm, setFromKm] = useState<string>(
    initialData?.from_km !== undefined && initialData?.from_km !== null ? String(initialData.from_km) : ''
  );
  const [toKm, setToKm] = useState<string>(
    initialData?.to_km !== undefined && initialData?.to_km !== null ? String(initialData.to_km) : ''
  );
  const [corridorRemarks, setCorridorRemarks] = useState<string>(initialData?.remarks || '');

  // Level 2 Sub-Chainages for lane configuration detection
  const [subChainages, setSubChainages] = useState<SubChainageStretch[]>([]);

  useEffect(() => {
    const code = highwayCode.trim();
    if (!code) {
      setSubChainages([]);
      return;
    }

    const fetchSub = async () => {
      try {
        const res = await fetch(`/api/sub-chainages?code=${encodeURIComponent(code)}&type=MICRO_LANE`);
        const data = await res.json();
        if (data.success && Array.isArray(data.subChainages)) {
          setSubChainages(data.subChainages);
        }
      } catch (err) {
        console.warn('Sub-chainages fetch note for DLP:', err);
      }
    };

    fetchSub();
  }, [highwayCode]);

  // Tab 2: Dynamic Sub-Work Stretches
  const [workStretches, setWorkStretches] = useState<DlpWorkStretch[]>(
    initialData?.work_stretches || []
  );

  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const divisionOptions = masterData?.divisions || [];

  const totalLengthKm =
    fromKm !== '' && toKm !== ''
      ? Math.max(0, Math.round((Number(toKm) - Number(fromKm)) * 1000) / 1000)
      : 0;

  // Tab 1 Validation Check
  const validateTab1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!divisionName.trim()) errs.divisionName = 'Division selection is required.';
    if (!highwayCode.trim()) errs.highwayCode = 'Highway Code is required (e.g. NH-44, NH-179A).';
    if (fromKm === '' || isNaN(Number(fromKm)) || Number(fromKm) < 0) {
      errs.fromKm = 'Valid starting chainage (From Km) is required.';
    }
    if (toKm === '' || isNaN(Number(toKm))) {
      errs.toKm = 'Valid ending chainage (To Km) is required.';
    } else if (Number(toKm) < Number(fromKm)) {
      errs.toKm = 'Ending chainage (To Km) cannot be less than starting chainage.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isTab1Valid = Boolean(
    divisionName.trim() &&
    highwayCode.trim() &&
    fromKm !== '' &&
    toKm !== '' &&
    Number(toKm) >= Number(fromKm)
  );

  const handleAddWorkStretch = (category: DlpWorkCategory) => {
    const newStretch: DlpWorkStretch = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      chainage_from_km: '' as any,
      chainage_to_km: '' as any,
      length_km: 0,
      road_width_from_m: '' as any,
      road_width_to_m: '' as any,
      contractor_name: '',
      work_name: '',
      commencement_date: '',
      dlp_till_date: '',
      physical_progress_pct: null,
      actual_completion_date: null,
      dlp_period_years: null,
      scheme: category === 'NO_DLP' ? 'Proposed Special Repairs' : null,
      dlp_ended_on_date: null,
      remarks: '',
      status: 'ACTIVE',
    };

    setWorkStretches((prev) => [...prev, newStretch]);
    setIsAddMenuOpen(false);
    setSubmitError(null);
  };

  const handleUpdateStretch = (index: number, field: keyof DlpWorkStretch, value: any) => {
    setWorkStretches((prev) => {
      const updated = [...prev];
      const stretch = { ...updated[index], [field]: value };

      // Auto-compute length when chainages change
      if (field === 'chainage_from_km' || field === 'chainage_to_km') {
        const f = field === 'chainage_from_km' ? value : stretch.chainage_from_km;
        const t = field === 'chainage_to_km' ? value : stretch.chainage_to_km;
        if (f !== '' && t !== '' && !isNaN(Number(f)) && !isNaN(Number(t))) {
          stretch.length_km = Math.max(0, Math.round((Number(t) - Number(f)) * 1000) / 1000);
        }
      }

      updated[index] = stretch;
      return updated;
    });
    setSubmitError(null);
  };

  const handleRemoveStretch = (index: number) => {
    setWorkStretches((prev) => prev.filter((_, idx) => idx !== index));
    setSubmitError(null);
  };

  // Validate all Tab 2 sub-work stretches including Road Width Capacity checks
  const validateStretches = (): { valid: boolean; errorMsg?: string } => {
    for (let i = 0; i < workStretches.length; i++) {
      const s = workStretches[i];
      const rawFrom = String((s as any).chainage_from_km ?? '').trim();
      const rawTo = String((s as any).chainage_to_km ?? '').trim();
      const rawWidthTo = String((s as any).road_width_to_m ?? '').trim();
      const sFrom = Number(rawFrom);
      const sTo = Number(rawTo);
      const wTo = Number(rawWidthTo);

      if (rawFrom === '' || isNaN(sFrom) || sFrom < 0) {
        return { valid: false, errorMsg: `Work Stretch #${i + 1}: Valid starting chainage is required.` };
      }
      if (rawTo === '' || isNaN(sTo) || sTo <= sFrom) {
        return { valid: false, errorMsg: `Work Stretch #${i + 1}: Ending chainage must be greater than starting chainage.` };
      }
      if (rawWidthTo !== '' && !isNaN(wTo) && wTo > 0) {
        const capacity = checkSpanWidthCapacity(sFrom, sTo, wTo, subChainages);
        if (!capacity.valid) {
          const b = capacity.bottlenecks[0];
          return {
            valid: false,
            errorMsg: `Work Stretch #${i + 1}: Width (${wTo}m) exceeds physical carriageway on Km ${b.overlapFromKm.toFixed(3)}–${b.overlapToKm.toFixed(3)} (${b.laneConfig}: ${b.maxAllowedWidth}m). Please adjust or split the stretch.`,
          };
        }
      }
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateTab1()) {
      setActiveTab('IDENTITY');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const stretchValidation = validateStretches();
    if (!stretchValidation.valid) {
      setActiveTab('STRETCHES');
      setSubmitError(stretchValidation.errorMsg || 'Invalid stretch configuration');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const payload: Partial<DlpCorridor> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      division_name: divisionName.trim(),
      highway_code: highwayCode.trim().toUpperCase(),
      from_km: parseFloat(fromKm) || 0,
      to_km: parseFloat(toKm) || 0,
      total_length_km: totalLengthKm,
      remarks: corridorRemarks.trim() || null,
      status: initialData?.status || 'ACTIVE',
      work_stretches: workStretches.map((s) => ({
        ...s,
        chainage_from_km: Number(s.chainage_from_km || 0),
        chainage_to_km: Number(s.chainage_to_km || 0),
        road_width_from_m: String((s as any).road_width_from_m ?? '').trim() !== '' ? Number(s.road_width_from_m) : 0.0,
        road_width_to_m: String((s as any).road_width_to_m ?? '').trim() !== '' ? Number(s.road_width_to_m) : 0,
        contractor_name: s.contractor_name?.trim() || null,
        work_name: s.work_name?.trim() || null,
        scheme: s.scheme?.trim() || null,
        remarks: s.remarks?.trim() || null,
      })),
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save corridor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Sticky Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to DLP Register
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit DLP Corridor & Maintenance Works' : 'New DLP Corridor & Maintenance Master Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tamil Nadu National Highways &bull; 2D Spatial Geometry &amp; Lifecycle Management
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
            <Save className="w-4 h-4" /> {loading ? 'Saving Master Record...' : 'Save Complete Record'}
          </button>
        </div>
      </div>

      {/* Form Submission Error Banner */}
      {submitError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-rose-950 dark:text-rose-100">Validation / Save Issue</h4>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* 2-STAGE STAGE-GATED TAB NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tab 1 Pill */}
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setActiveTab('IDENTITY');
            }}
            className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
              activeTab === 'IDENTITY'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'IDENTITY' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block text-blue-600 dark:text-blue-400">
                  Tab 1 &bull; Baseline Identity
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Corridor &amp; Jurisdiction
                </span>
              </div>
            </div>
            {isTab1Valid ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" /> Valid
              </span>
            ) : null}
          </button>

          {/* Tab 2 Pill */}
          <button
            type="button"
            onClick={() => {
              if (validateTab1()) {
                setErrors({});
                setActiveTab('STRETCHES');
              }
            }}
            disabled={!isTab1Valid}
            className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all border cursor-pointer disabled:cursor-not-allowed ${
              activeTab === 'STRETCHES'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                : isTab1Valid
                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === 'STRETCHES' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block text-blue-600 dark:text-blue-400">
                  Tab 2 &bull; 2D Work Workspace
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Sub-Work Stretches ({workStretches.length} Works)
                </span>
              </div>
            </div>
            {!isTab1Valid ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <LockKeyhole className="w-3 h-3" /> Locked
              </span>
            ) : workStretches.length > 0 ? (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold rounded-md">
                {workStretches.length} added
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Validation Diagnostic Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the following required fields:
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* ========================================================= */}
        {/* TAB 1: Corridor & Jurisdiction */}
        {/* ========================================================= */}
        {activeTab === 'IDENTITY' && (
          <div>
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                    Tab 1: Corridor Identity &amp; Chainage Bounds
                  </h3>
                  <span className="text-xs text-blue-200">
                    Administrative jurisdiction and continuous chainage limits
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Division <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={divisionOptions}
                    value={divisionName}
                    onChange={(val) => {
                      setDivisionName(val);
                      if (errors.divisionName) setErrors((prev) => ({ ...prev, divisionName: '' }));
                    }}
                    placeholder="Select Division..."
                  />
                  {errors.divisionName && <p className="text-[11px] text-rose-500 mt-1">{errors.divisionName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    National Highway Number / Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={highwayCode}
                    onChange={(e) => {
                      setHighwayCode(e.target.value);
                      if (errors.highwayCode) setErrors((prev) => ({ ...prev, highwayCode: '' }));
                    }}
                    placeholder="e.g. NH-179A, NH-44"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.highwayCode && <p className="text-[11px] text-rose-500 mt-1">{errors.highwayCode}</p>}
                </div>
              </div>

              {/* Chainage Limits Grid */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Corridor Chainage Limits
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      From Chainage (Km) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={fromKm}
                      onChange={(e) => {
                        setFromKm(e.target.value);
                        if (errors.fromKm) setErrors((prev) => ({ ...prev, fromKm: '' }));
                      }}
                      placeholder="0.000"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                    {errors.fromKm && <p className="text-[11px] text-rose-500 mt-1">{errors.fromKm}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      To Chainage (Km) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={toKm}
                      onChange={(e) => {
                        setToKm(e.target.value);
                        if (errors.toKm) setErrors((prev) => ({ ...prev, toKm: '' }));
                      }}
                      placeholder="45.000"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                    {errors.toKm && <p className="text-[11px] text-rose-500 mt-1">{errors.toKm}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Calculated Total Length (Km)
                    </label>
                    <div className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                      {totalLengthKm.toFixed(3)} Km
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corridor Notes &amp; Administrative Remarks (Col AC)
                </label>
                <textarea
                  rows={3}
                  value={corridorRemarks}
                  onChange={(e) => setCorridorRemarks(e.target.value)}
                  placeholder="Enter overall corridor remarks..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateTab1()) {
                      setActiveTab('STRETCHES');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Proceed to Sub-Work Stretches (Tab 2) &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: Sub-Work Stretches Workspace */}
        {/* ========================================================= */}
        {activeTab === 'STRETCHES' && (
          <div>
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                    Tab 2: Granular Sub-Work Stretches Workspace
                  </h3>
                  <span className="text-xs text-blue-200">
                    2D spatial bounds (Chainage &amp; Lateral Road Width) across 5 categories
                  </span>
                </div>
              </div>

              {/* Dynamic + Add Work Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>+ Add Work</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isAddMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-20 animate-in fade-in zoom-in-95">
                    {(['DLP', 'CONSTRUCTION', 'STMC', 'PBMC', 'NO_DLP'] as DlpWorkCategory[]).map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleAddWorkStretch(cat)}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {workStretches.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No Sub-Work Stretches Added Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Click the <strong>&quot;+ Add Work&quot;</strong> button above to add a stretch under DLP, Construction, STMC, PBMC, or NO DLP.
                  </p>
                  <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    {(['DLP', 'CONSTRUCTION', 'STMC', 'PBMC', 'NO_DLP'] as DlpWorkCategory[]).map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleAddWorkStretch(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                          <span>+ {cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {workStretches.map((stretch, index) => {
                    const cfg = CATEGORY_CONFIG[stretch.category];
                    const detectedLane = detectLaneWidthForChainage(
                      Number(stretch.chainage_from_km) || 0,
                      Number(stretch.chainage_to_km) || 0,
                      subChainages
                    );
                    const capacity = checkSpanWidthCapacity(
                      Number(stretch.chainage_from_km),
                      Number(stretch.chainage_to_km),
                      Number(stretch.road_width_to_m),
                      subChainages
                    );

                    return (
                      <div
                        key={stretch.id || index}
                        className={`p-5 rounded-2xl border ${cfg.borderCard} bg-white dark:bg-slate-900/90 shadow-xs space-y-4 relative`}
                      >
                        {/* Card Top Row */}
                        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-lg font-extrabold text-xs flex items-center gap-1.5 ${cfg.bgBadge} ${cfg.textBadge}`}>
                              <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                              {cfg.label}
                            </span>
                            <span className="text-xs font-bold text-slate-500 font-mono">
                              Work Stretch #{index + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStretch(index)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Remove Work Stretch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 2D Geometry Row: Chainage Limits & Centerline Offsets */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              2D Spatial Coordinates &bull; Longitudinal (Km) &amp; Lateral Width (m)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Centerline = 0m
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Chainage From (Km)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={stretch.chainage_from_km}
                                onChange={(e) => handleUpdateStretch(index, 'chainage_from_km', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Chainage To (Km)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={stretch.chainage_to_km}
                                onChange={(e) => handleUpdateStretch(index, 'chainage_to_km', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Stretch Length (Km)
                              </label>
                              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                {Number(stretch.length_km || 0).toFixed(3)} Km
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Road Width From (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={stretch.road_width_from_m}
                                onChange={(e) => handleUpdateStretch(index, 'road_width_from_m', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Road Width To (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={stretch.road_width_to_m}
                                onChange={(e) => handleUpdateStretch(index, 'road_width_to_m', e.target.value)}
                                placeholder={detectedLane.matchedStretch ? String(detectedLane.totalWidthMeters) : '0.00'}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Level 2 Sub-Chainage Micro-Lane Parameter Reference */}
                          {detectedLane.matchedStretch && (
                            <div className="mt-2.5 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 min-w-0">
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                                  Level 2 Micro-Lane
                                </span>
                                <span className="font-semibold truncate">
                                  {detectedLane.laneConfig} &bull; Full Lane Width: <strong className="font-bold">{detectedLane.totalWidthMeters}m</strong> (0 to {detectedLane.totalWidthMeters}m)
                                  {detectedLane.importantTown ? ` • Town: ${detectedLane.importantTown}` : ''}
                                </span>
                              </div>

                              {(Number(stretch.road_width_from_m || 0) !== 0 || Number(stretch.road_width_to_m || 0) !== detectedLane.totalWidthMeters) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateStretch(index, 'road_width_from_m', 0);
                                    handleUpdateStretch(index, 'road_width_to_m', detectedLane.totalWidthMeters);
                                  }}
                                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                                >
                                  Use Level 2 Width (0 to {detectedLane.totalWidthMeters}m)
                                </button>
                              )}
                            </div>
                          )}

                          {/* Width Capacity Alert if specified width exceeds any overlapping physical carriageway */}
                          {!capacity.valid && (
                            <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Width Exceeds Road Capacity: </span>
                                <span>
                                  Entered width ({stretch.road_width_to_m}m) exceeds physical carriageway on{' '}
                                  {capacity.bottlenecks.map((b, bi) => (
                                    <strong key={bi} className="font-bold">
                                      Km {b.overlapFromKm.toFixed(3)}–{b.overlapToKm.toFixed(3)} ({b.laneConfig}: {b.maxAllowedWidth}m){bi < capacity.bottlenecks.length - 1 ? ', ' : ''}
                                    </strong>
                                  ))}.
                                </span>
                                <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                                  Please adjust the width or split this work into separate entries for each road section.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Category-Specific Dynamic Inputs */}
                        {stretch.category === 'DLP' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Contractor (Col I)
                              </label>
                              <input
                                type="text"
                                value={stretch.contractor_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'contractor_name', e.target.value)}
                                placeholder="Contractor name..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Work (Col J)
                              </label>
                              <input
                                type="text"
                                value={stretch.work_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'work_name', e.target.value)}
                                placeholder="e.g. Strengthening & Widening..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Date of Commencement (Col K)
                              </label>
                              <DatePickerInput
                                value={stretch.commencement_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'commencement_date', val)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                DLP Till Date (Col L)
                              </label>
                              <DatePickerInput
                                value={stretch.dlp_till_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'dlp_till_date', val)}
                              />
                            </div>
                          </div>
                        )}

                        {stretch.category === 'CONSTRUCTION' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Name of Contractor (Col M)
                                </label>
                                <input
                                  type="text"
                                  value={stretch.contractor_name || ''}
                                  onChange={(e) => handleUpdateStretch(index, 'contractor_name', e.target.value)}
                                  placeholder="Contractor name..."
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Name of Work (Col N)
                                </label>
                                <input
                                  type="text"
                                  value={stretch.work_name || ''}
                                  onChange={(e) => handleUpdateStretch(index, 'work_name', e.target.value)}
                                  placeholder="e.g. 4-Laning Capital Work..."
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Date of Commencement (Col O)
                                </label>
                                <DatePickerInput
                                  value={stretch.commencement_date || ''}
                                  onChange={(val) => handleUpdateStretch(index, 'commencement_date', val)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Physical Progress % (Col P)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={stretch.physical_progress_pct ?? 0}
                                  onChange={(e) => handleUpdateStretch(index, 'physical_progress_pct', e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Actual Date of Completion (Col Q)
                                </label>
                                <DatePickerInput
                                  value={stretch.actual_completion_date || ''}
                                  onChange={(val) => handleUpdateStretch(index, 'actual_completion_date', val)}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  DLP Period in Years (Col R)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={stretch.dlp_period_years ?? 5}
                                  onChange={(e) => handleUpdateStretch(index, 'dlp_period_years', e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {stretch.category === 'STMC' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Contractor (Col S)
                              </label>
                              <input
                                type="text"
                                value={stretch.contractor_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'contractor_name', e.target.value)}
                                placeholder="STMC contractor..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Work (Col T)
                              </label>
                              <input
                                type="text"
                                value={stretch.work_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'work_name', e.target.value)}
                                placeholder="STMC work title..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Date of Commencement (Col U)
                              </label>
                              <DatePickerInput
                                value={stretch.commencement_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'commencement_date', val)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                DLP Till Date (Col V)
                              </label>
                              <DatePickerInput
                                value={stretch.dlp_till_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'dlp_till_date', val)}
                              />
                            </div>
                          </div>
                        )}

                        {stretch.category === 'PBMC' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Contractor (Col W)
                              </label>
                              <input
                                type="text"
                                value={stretch.contractor_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'contractor_name', e.target.value)}
                                placeholder="PBMC contractor..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Name of Work (Col X)
                              </label>
                              <input
                                type="text"
                                value={stretch.work_name || ''}
                                onChange={(e) => handleUpdateStretch(index, 'work_name', e.target.value)}
                                placeholder="PBMC work title..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Date of Commencement (Col Y)
                              </label>
                              <DatePickerInput
                                value={stretch.commencement_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'commencement_date', val)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                DLP Till Date (Col Z)
                              </label>
                              <DatePickerInput
                                value={stretch.dlp_till_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'dlp_till_date', val)}
                              />
                            </div>
                          </div>
                        )}

                        {stretch.category === 'NO_DLP' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Scheme / Proposed Action (Col AA)
                              </label>
                              <input
                                type="text"
                                list="dlp-schemes-list"
                                value={stretch.scheme || ''}
                                onChange={(e) => handleUpdateStretch(index, 'scheme', e.target.value)}
                                placeholder="e.g. Proposed under Special Repairs..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                              />
                              {masterData?.schemes && masterData.schemes.length > 0 && (
                                <datalist id="dlp-schemes-list">
                                  {masterData.schemes.map((s) => (
                                    <option key={s} value={s} />
                                  ))}
                                </datalist>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                DLP Ended On Date (Col AB)
                              </label>
                              <DatePickerInput
                                value={stretch.dlp_ended_on_date || ''}
                                onChange={(val) => handleUpdateStretch(index, 'dlp_ended_on_date', val)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stretch Remarks */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Stretch Remarks (Col AC)
                          </label>
                          <input
                            type="text"
                            value={stretch.remarks || ''}
                            onChange={(e) => handleUpdateStretch(index, 'remarks', e.target.value)}
                            placeholder="Stretch-specific remarks..."
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between pt-2">
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Master Record...' : 'Save Complete Record'}
        </button>
      </div>
    </form>
  );
};
