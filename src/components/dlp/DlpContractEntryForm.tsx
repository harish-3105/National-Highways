'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronDown,
  Sparkles,
  Info,
  Route,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { DlpCorridor, DlpWorkStretch, DlpWorkCategory, DlpMasterData } from '@/types/dlp';
import { HighwayCorridor } from '@/app/api/highways/route';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { SubChainageStretch } from '@/app/api/sub-chainages/route';
import {
  detectLaneWidthForChainage,
  checkSpanWidthCapacity,
  analyzeSpanLaneSubSections,
  OverlappingLaneSubSection,
} from '@/lib/dlp/laneDetection';
import { addYearsToDateString, formatDateIndian, parseDateString } from '@/lib/formatters';

interface DlpContractEntryFormProps {
  initialData?: Partial<DlpCorridor>;
  masterData?: DlpMasterData;
  masterCorridors?: HighwayCorridor[];
  onSave: (corridorData: Partial<DlpCorridor>) => Promise<void> | void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: Record<
  DlpWorkCategory,
  { label: string; bgBadge: string; textBadge: string; borderCard: string; dotColor: string }
> = {
  DLP: {
    label: 'Under DLP',
    bgBadge: 'bg-lime-50 dark:bg-lime-950/40',
    textBadge: 'text-lime-800 dark:text-lime-200',
    borderCard: 'border-lime-200 dark:border-lime-800/60',
    dotColor: 'bg-lime-600',
  },
  CONSTRUCTION: {
    label: 'Under Construction',
    bgBadge: 'bg-emerald-100 dark:bg-emerald-950/60',
    textBadge: 'text-emerald-900 dark:text-emerald-100',
    borderCard: 'border-emerald-300 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-700',
  },
  STMC: {
    label: 'Under STMC',
    bgBadge: 'bg-amber-50 dark:bg-amber-950/40',
    textBadge: 'text-amber-800 dark:text-amber-200',
    borderCard: 'border-amber-200 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
  },
  PBMC: {
    label: 'Under PBMC',
    bgBadge: 'bg-purple-50 dark:bg-purple-950/40',
    textBadge: 'text-purple-800 dark:text-purple-200',
    borderCard: 'border-purple-200 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
  },
  NO_DLP: {
    label: 'Under NO DLP',
    bgBadge: 'bg-rose-50 dark:bg-rose-950/40',
    textBadge: 'text-rose-700 dark:text-rose-300',
    borderCard: 'border-rose-200 dark:border-rose-800/60',
    dotColor: 'bg-rose-500',
  },
};

function parseChainageValue(val: string | number | null | undefined, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const s = String(val).trim().replace('/', '.');
  const num = parseFloat(s);
  return isNaN(num) ? fallback : num;
}

export const DlpContractEntryForm: React.FC<DlpContractEntryFormProps> = ({
  initialData,
  masterData,
  masterCorridors: initialMasterCorridors,
  onSave,
  onCancel,
}) => {
  // Master Corridors State
  const [corridorsList, setCorridorsList] = useState<HighwayCorridor[]>(initialMasterCorridors || []);
  const [fetchingCorridors, setFetchingCorridors] = useState<boolean>(!initialMasterCorridors || initialMasterCorridors.length === 0);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('');
  const [selectedCorridor, setSelectedCorridor] = useState<HighwayCorridor | null>(null);

  // Selected Corridor Level 1 Identity
  const [divisionName, setDivisionName] = useState<string>(initialData?.division_name || '');
  const [highwayCode, setHighwayCode] = useState<string>(initialData?.highway_code || '');
  const [fromKm, setFromKm] = useState<string>(
    initialData?.from_km !== undefined && initialData?.from_km !== null ? String(initialData.from_km) : ''
  );
  const [toKm, setToKm] = useState<string>(
    initialData?.to_km !== undefined && initialData?.to_km !== null ? String(initialData.to_km) : ''
  );
  const [corridorRemarks, setCorridorRemarks] = useState<string>(initialData?.remarks || '');
  const [isChangingCorridor, setIsChangingCorridor] = useState<boolean>(false);

  // Level 2 Sub-Chainages for lane configuration detection
  const [subChainages, setSubChainages] = useState<SubChainageStretch[]>([]);

  // Granular Sub-Work Stretches
  const [workStretches, setWorkStretches] = useState<DlpWorkStretch[]>(
    initialData?.work_stretches || []
  );

  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Master Highway Corridors if not passed as prop
  useEffect(() => {
    if (initialMasterCorridors && initialMasterCorridors.length > 0) {
      setCorridorsList(initialMasterCorridors);
      setFetchingCorridors(false);
      return;
    }

    const fetchCorridors = async () => {
      try {
        setFetchingCorridors(true);
        const res = await fetch('/api/highways');
        const data = await res.json();
        if (data.success && Array.isArray(data.corridors)) {
          setCorridorsList(data.corridors);
        }
      } catch (err) {
        console.warn('Failed to fetch Master Highways for DLP:', err);
      } finally {
        setFetchingCorridors(false);
      }
    };

    fetchCorridors();
  }, [initialMasterCorridors]);

  // Match initialData with master corridors list
  useEffect(() => {
    if (corridorsList.length === 0) return;

    if (initialData?.highway_code) {
      const match =
        corridorsList.find(
          (c) =>
            c.road_code.toUpperCase() === initialData.highway_code?.toUpperCase() &&
            (!initialData.division_name || c.division_name?.toLowerCase() === initialData.division_name.toLowerCase())
        ) ||
        corridorsList.find((c) => c.road_code.toUpperCase() === initialData.highway_code?.toUpperCase());

      if (match) {
        setSelectedCorridorId(match.id);
        setSelectedCorridor(match);
      }
    }
  }, [initialData, corridorsList]);

  // Fetch Sub-Chainages when Highway Code changes
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

  const totalLengthKm =
    fromKm !== '' && toKm !== ''
      ? Math.round(Math.abs(Number(toKm) - Number(fromKm)) * 1000) / 1000
      : (selectedCorridor?.length_km || 0);

  // Searchable Options for Master Corridors
  const corridorOptions = useMemo(() => {
    return corridorsList.map((c) => {
      const fromDisplay = c.from_chainage !== null && c.from_chainage !== undefined && String(c.from_chainage).trim() !== '' ? `Km ${c.from_chainage}` : '';
      const toDisplay = c.to_chainage !== null && c.to_chainage !== undefined && String(c.to_chainage).trim() !== '' ? `Km ${c.to_chainage}` : '';
      const spanText = fromDisplay && toDisplay ? `${fromDisplay} to ${toDisplay}` : fromDisplay || toDisplay || `${c.length_km} Km`;
      const roadTitle = c.road_name || (c.from_location && c.to_location ? `${c.from_location} - ${c.to_location}` : '');
      const divDisplay = c.division_name ? `${c.division_name} Division` : 'General';
      const label = `${c.road_code} • ${divDisplay} • ${spanText}${roadTitle ? ` (${roadTitle})` : ''}`;

      return {
        value: c.id,
        label,
      };
    });
  }, [corridorsList]);

  const handleSelectCorridor = (corridorId: string) => {
    setSelectedCorridorId(corridorId);
    const found = corridorsList.find((c) => c.id === corridorId);
    if (found) {
      setSelectedCorridor(found);
      setHighwayCode(found.road_code);
      setDivisionName(found.division_name || '');
      setFromKm(found.from_chainage !== null && found.from_chainage !== undefined ? String(found.from_chainage) : '');
      setToKm(found.to_chainage !== null && found.to_chainage !== undefined ? String(found.to_chainage) : '');
      setIsChangingCorridor(false);
      if (errors.corridor) {
        setErrors((prev) => ({ ...prev, corridor: '' }));
      }
    }
  };

  const handleAddWorkStretch = (category: DlpWorkCategory) => {
    const newStretch: DlpWorkStretch = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      chainage_from_km: '' as any,
      chainage_to_km: '' as any,
      length_km: 0,
      road_width_from_m: 0.0,
      road_width_to_m: '' as any,
      contractor_name: '',
      work_name: '',
      commencement_date: '',
      dlp_till_date: '',
      physical_progress_pct: null,
      actual_completion_date: null,
      dlp_period_years: null,
      scheme: category === 'NO_DLP' ? 'Annual Work' : null,
      dlp_ended_on_date: null,
      remarks: '',
      status: 'ACTIVE',
    };

    setWorkStretches((prev) => [newStretch, ...prev]);
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

      // Auto-compute DLP Till Date when completion date or dlp_period_years or commencement_date change
      if (field === 'actual_completion_date' || field === 'dlp_period_years' || field === 'commencement_date') {
        const compDate = field === 'actual_completion_date' ? value : stretch.actual_completion_date;
        const commDate = field === 'commencement_date' ? value : stretch.commencement_date;
        const years = field === 'dlp_period_years' ? value : (stretch.dlp_period_years ?? 5);
        const baseDate = compDate || (stretch.category === 'DLP' ? commDate : null);
        if (baseDate && years && !isNaN(Number(years)) && Number(years) > 0) {
          const computed = addYearsToDateString(baseDate, years);
          if (computed) {
            stretch.dlp_till_date = computed;
          }
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

  const handleAutoSplitStretch = (index: number, subSections: OverlappingLaneSubSection[]) => {
    if (!subSections || subSections.length <= 1) return;

    setWorkStretches((prev) => {
      const target = prev[index];
      if (!target) return prev;

      const newStretches: DlpWorkStretch[] = subSections.map((sub) => ({
        ...target,
        id: undefined,
        chainage_from_km: sub.fromKm,
        chainage_to_km: sub.toKm,
        length_km: sub.lengthKm,
        road_width_from_m: 0,
        road_width_to_m: sub.centerlineWidthMeters,
      }));

      const updated = [...prev];
      updated.splice(index, 1, ...newStretches);
      return updated;
    });
    setSubmitError(null);
  };

  // Validate all sub-work stretches including Road Width Capacity checks
  const validateForm = (): { valid: boolean; errorMsg?: string } => {
    const errs: Record<string, string> = {};

    if (!highwayCode.trim() || !divisionName.trim()) {
      errs.corridor = 'Please select a Master Highway Corridor.';
    }

    if (fromKm === '' || isNaN(Number(fromKm)) || Number(fromKm) < 0) {
      errs.corridor = 'Corridor starting chainage is invalid.';
    }
    if (toKm === '' || isNaN(Number(toKm)) || Number(toKm) < 0 || Number(toKm) === Number(fromKm)) {
      errs.corridor = 'Corridor ending chainage is invalid (must be distinct from starting chainage).';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return { valid: false, errorMsg: errs.corridor || 'Please select a valid Master Highway Corridor.' };
    }

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
      if (rawTo === '' || isNaN(sTo) || sTo === sFrom || sTo < 0) {
        return { valid: false, errorMsg: `Work Stretch #${i + 1}: Ending chainage must be distinct from starting chainage.` };
      }
      if (rawWidthTo !== '' && !isNaN(wTo) && wTo > 0) {
        const minKm = Math.min(sFrom, sTo);
        const maxKm = Math.max(sFrom, sTo);
        const capacity = checkSpanWidthCapacity(minKm, maxKm, wTo, subChainages);
        if (!capacity.valid) {
          const b = capacity.bottlenecks[0];
          return {
            valid: false,
            errorMsg: `Work Stretch #${i + 1}: Entered centerline width (${wTo}m = ${(wTo * 2).toFixed(1)}m total) exceeds physical carriageway on Km ${b.overlapFromKm.toFixed(3)}–${b.overlapToKm.toFixed(3)} (${b.laneConfig}: max ${b.maxAllowedCenterlineWidth}m centerline = ${b.maxAllowedCarriagewayWidth}m total). Please adjust width or split into separate entries.`,
          };
        }
      }
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateForm();
    if (!validation.valid) {
      setSubmitError(validation.errorMsg || 'Invalid form entries');
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
      setSubmitError(err?.message || 'Failed to save DLP record');
    } finally {
      setLoading(false);
    }
  };

  const hasSelectedCorridor = Boolean(highwayCode.trim() && divisionName.trim());

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
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit DLP Corridor & Maintenance Works' : 'New DLP Maintenance Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tamil Nadu National Highways &bull; Linked Master Corridors &amp; 2D Spatial Maintenance Registry
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Master Record...' : 'Save Complete Record'}
        </button>
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

      {/* ========================================================= */}
      {/* SECTION 1: MASTER HIGHWAY CORRIDOR SELECTION & PASSPORT */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* If no corridor selected, or in change mode */}
        {(!hasSelectedCorridor || isChangingCorridor) && !initialData?.id ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-xl text-blue-600 dark:text-blue-400">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Select Master Highway Corridor <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick an existing highway corridor from the Master Corridors Catalog to link Level 1 identity and chainage limits
                  </p>
                </div>
              </div>
              {isChangingCorridor && (
                <button
                  type="button"
                  onClick={() => setIsChangingCorridor(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Keep Current Selection
                </button>
              )}
            </div>

            <div className="max-w-3xl">
              <SearchableSelect
                options={corridorOptions}
                value={selectedCorridorId}
                onChange={handleSelectCorridor}
                placeholder={fetchingCorridors ? 'Loading Master Corridors...' : 'Search highway by code, division, or name...'}
              />
              {errors.corridor && <p className="text-xs text-rose-500 mt-1.5 font-semibold">{errors.corridor}</p>}
            </div>
          </div>
        ) : (
          /* High-Density Verified Corridor Passport Banner */
          <div>
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-lg uppercase tracking-wider shadow-xs">
                    {highwayCode}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-900/80 border border-blue-700 text-blue-200 font-bold text-xs rounded-lg">
                    {divisionName} Division
                  </span>
                  {selectedCorridor?.configuration && (
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs rounded-lg">
                      {selectedCorridor.configuration}
                    </span>
                  )}
                  {initialData?.id && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold rounded-md uppercase">
                      Active Master Record
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedCorridor?.road_name || (selectedCorridor?.from_location ? `${selectedCorridor.from_location} - ${selectedCorridor.to_location}` : `${highwayCode} Corridor`)}
                  </h3>
                  <p className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-2">
                    <span>Verified Span: <strong className="text-white font-mono font-bold">Km {Number(fromKm).toFixed(3)}</strong> to <strong className="text-white font-mono font-bold">Km {Number(toKm).toFixed(3)}</strong></span>
                    <span>&bull;</span>
                    <span>Total Length: <strong className="text-white font-mono font-bold">{totalLengthKm.toFixed(3)} Km</strong></span>
                  </p>
                </div>
              </div>

              {!initialData?.id && (
                <button
                  type="button"
                  onClick={() => setIsChangingCorridor(true)}
                  className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Change Corridor
                </button>
              )}
            </div>

            {/* Corridor Notes & Administrative Remarks */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Corridor Notes &amp; Administrative Remarks (Col AC)
              </label>
              <input
                type="text"
                value={corridorRemarks}
                onChange={(e) => setCorridorRemarks(e.target.value)}
                placeholder="Optional parent corridor remarks or special administrative notations..."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: GRANULAR SUB-WORK STRETCHES WORKSPACE */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Workspace Top Header Bar */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-300" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Granular Sub-Work Stretches Workspace
                </h3>
                <span className="px-2 py-0.5 bg-blue-700 text-blue-100 rounded-md text-[11px] font-bold">
                  {workStretches.length} {workStretches.length === 1 ? 'Work' : 'Works'}
                </span>
              </div>
              <span className="text-xs text-blue-200">
                2D spatial bounds (Chainage &amp; Lateral Road Width) across 5 maintenance categories
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
              <span>+ Add Sub-Work Stretch</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isAddMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-20 animate-in fade-in zoom-in-95">
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

        {/* Workspace Stretches Ledger */}
        <div className="p-6 space-y-6">
          {workStretches.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Sub-Work Stretches Added Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Click the <strong>&quot;+ Add Sub-Work Stretch&quot;</strong> button above to record stretches under DLP, Construction, STMC, PBMC, or NO DLP.
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
                const hasEnteredChainages =
                  String(stretch.chainage_from_km ?? '').trim() !== '' &&
                  String(stretch.chainage_to_km ?? '').trim() !== '' &&
                  !isNaN(Number(stretch.chainage_from_km)) &&
                  !isNaN(Number(stretch.chainage_to_km)) &&
                  Number(stretch.chainage_to_km) > Number(stretch.chainage_from_km);

                const spanAnalysis = hasEnteredChainages
                  ? analyzeSpanLaneSubSections(
                      Number(stretch.chainage_from_km),
                      Number(stretch.chainage_to_km),
                      subChainages
                    )
                  : {
                      hasMatches: false,
                      isUniform: true,
                      totalSubSections: 0,
                      subSections: [],
                      minCenterlineWidthMeters: 3.5,
                      minCarriagewayWidthMeters: 7.0,
                      maxCenterlineWidthMeters: 3.5,
                      maxCarriagewayWidthMeters: 7.0,
                      bottleneckConfig: '2-Lane',
                      primaryConfig: '2-Lane',
                      summaryLabel: '2-Lane',
                    };

                const capacity =
                  hasEnteredChainages &&
                  String(stretch.road_width_to_m ?? '').trim() !== '' &&
                  !isNaN(Number(stretch.road_width_to_m)) &&
                  Number(stretch.road_width_to_m) > 0
                    ? checkSpanWidthCapacity(
                        Number(stretch.chainage_from_km),
                        Number(stretch.chainage_to_km),
                        Number(stretch.road_width_to_m),
                        subChainages
                      )
                    : { valid: true, overlappingCount: 0, bottlenecks: [] };

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
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>2D Spatial Coordinates &bull; Longitudinal (Km) &amp; Lateral Width (m)</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {hasEnteredChainages ? (
                            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 rounded-md font-mono font-extrabold text-[11px] shadow-2xs flex items-center gap-1">
                              <span>📍 DLP Work Range:</span>
                              <strong className="text-blue-900 dark:text-blue-100">Km {Number(stretch.chainage_from_km).toFixed(3)} &rarr; Km {Number(stretch.chainage_to_km).toFixed(3)}</strong>
                              <span className="text-[10px] text-blue-600 dark:text-blue-300">({Number(stretch.length_km || 0).toFixed(3)} Km)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              Enter From &amp; To Km to establish range
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            Centerline = 0m
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Chainage From (Km) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-[10px] font-extrabold font-mono text-slate-400 select-none">
                              Km
                            </span>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={stretch.chainage_from_km}
                              onChange={(e) => handleUpdateStretch(index, 'chainage_from_km', e.target.value)}
                              placeholder="0.000"
                              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Chainage To (Km) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-[10px] font-extrabold font-mono text-slate-400 select-none">
                              Km
                            </span>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={stretch.chainage_to_km}
                              onChange={(e) => handleUpdateStretch(index, 'chainage_to_km', e.target.value)}
                              placeholder="0.000"
                              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Stretch Length (Km)
                          </label>
                          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                            <span>{Number(stretch.length_km || 0).toFixed(3)} Km</span>
                            {hasEnteredChainages && <span className="text-[10px] text-slate-400 font-normal">Span</span>}
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
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                            placeholder={hasEnteredChainages && spanAnalysis.hasMatches && spanAnalysis.isUniform ? String(spanAnalysis.minCenterlineWidthMeters) : '0.00'}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Level 2 Uniform Span Reference */}
                      {hasEnteredChainages && spanAnalysis.hasMatches && spanAnalysis.isUniform && (
                        <div className="mt-2.5 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 min-w-0">
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                              Level 2 Micro-Lane
                            </span>
                            <span className="font-semibold truncate">
                              {spanAnalysis.primaryConfig} &bull; {spanAnalysis.minCarriagewayWidthMeters}m Carriageway &bull; Centerline Width: <strong className="font-bold">0 to {spanAnalysis.minCenterlineWidthMeters}m</strong>
                            </span>
                          </div>

                          {(Number(stretch.road_width_from_m || 0) !== 0 || Number(stretch.road_width_to_m || 0) !== spanAnalysis.minCenterlineWidthMeters) && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateStretch(index, 'road_width_from_m', 0);
                                handleUpdateStretch(index, 'road_width_to_m', spanAnalysis.minCenterlineWidthMeters);
                              }}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              Use Level 2 Width (0 to {spanAnalysis.minCenterlineWidthMeters}m)
                            </button>
                          )}
                        </div>
                      )}

                      {/* Level 2 Multi-Lane Mixed Span Banner (Pure Auto-Split Focus) */}
                      {hasEnteredChainages && spanAnalysis.hasMatches && !spanAnalysis.isUniform && (
                        <div className="mt-2.5 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 flex-wrap">
                              <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                                Multi-Lane Span ({spanAnalysis.totalSubSections} Sections)
                              </span>
                              <span className="font-bold truncate">
                                {spanAnalysis.summaryLabel} &bull; Physical lane widths vary across this span
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                              This work crosses multiple lane configurations. Click below to automatically split this entry into {spanAnalysis.totalSubSections} discrete sub-sections with their respective Level 2 lane widths.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAutoSplitStretch(index, spanAnalysis.subSections)}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" /> Auto-Split into {spanAnalysis.totalSubSections} Lane Sections
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Width Capacity Alert if specified width exceeds any overlapping physical carriageway */}
                      {hasEnteredChainages && !capacity.valid && (
                        <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 flex-wrap sm:flex-nowrap">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Width Exceeds Road Capacity: </span>
                              <span>
                                Entered centerline width ({stretch.road_width_to_m}m = {(Number(stretch.road_width_to_m) * 2).toFixed(1)}m total) exceeds physical carriageway on{' '}
                                {capacity.bottlenecks.map((b, bi) => (
                                  <strong key={bi} className="font-bold">
                                    Km {b.overlapFromKm.toFixed(3)}–{b.overlapToKm.toFixed(3)} ({b.laneConfig}: max {b.maxAllowedCenterlineWidth}m centerline = {b.maxAllowedCarriagewayWidth}m total){bi < capacity.bottlenecks.length - 1 ? ', ' : ''}
                                  </strong>
                                ))}.
                              </span>
                              <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                                Please adjust the width or split this work into separate entries for each road section.
                              </p>
                            </div>
                          </div>

                          {spanAnalysis.subSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleAutoSplitStretch(index, spanAnalysis.subSections)}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-extrabold shadow-xs transition-colors cursor-pointer self-start"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Split Stretch
                            </button>
                          )}
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

                        {(() => {
                          if (!stretch.dlp_till_date) return null;
                          const d = parseDateString(stretch.dlp_till_date);
                          if (!d) return null;
                          d.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (d.getTime() < today.getTime()) {
                            return (
                              <div className="sm:col-span-2 md:col-span-4 p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>
                                    DLP Expired on <strong>{formatDateIndian(stretch.dlp_till_date)}</strong> &bull; Automatically categorizes under <strong>No DLP (Annual Work)</strong> on save.
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-[10px] font-extrabold rounded-md uppercase tracking-wider shrink-0">
                                  Expired Warranty
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
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

                        {stretch.actual_completion_date && (
                          <div className="p-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>
                                Calculated DLP Expiry: <strong className="font-bold">{formatDateIndian(addYearsToDateString(stretch.actual_completion_date, stretch.dlp_period_years ?? 5))}</strong> ({stretch.dlp_period_years ?? 5} Years from Completion)
                              </span>
                            </div>
                            {Number(stretch.physical_progress_pct || 0) >= 100 && (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                Auto-Graduates to DLP
                              </span>
                            )}
                          </div>
                        )}
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
