'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Route,
  AlertCircle,
  FileText,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
  Check,
  Compass,
} from 'lucide-react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { HighwayMasterData } from '@/app/api/highways/master-data/route';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { useAuth } from '@/lib/auth/useAuth';

interface HighwayEntryFormProps {
  initialData?: Partial<HighwayCorridor>;
  masterData?: HighwayMasterData;
  onSave: (formData: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
}

type HighwayStageType =
  | 'identity_designations'
  | 'geographic_termini'
  | 'multilane_breakdown'
  | 'georeferencing_inventory';

interface StageDefinition {
  id: HighwayStageType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'identity_designations',
    label: 'Corridor Identity',
    step: 'Stage 1',
    subtitle: 'Corridor code, gazetted new & old NH numbers, corridor title',
    icon: FileText,
  },
  {
    id: 'geographic_termini',
    label: 'Termini & Chainages',
    step: 'Stage 2',
    subtitle: 'Geographic endpoints, chainage boundaries and verified corridor length',
    icon: MapPin,
  },
  {
    id: 'multilane_breakdown',
    label: 'Carriageway Breakdown',
    step: 'Stage 3',
    subtitle: 'Multi-lane lane distribution lengths and checksum verification',
    icon: Layers,
  },
  {
    id: 'georeferencing_inventory',
    label: 'Georeferencing & Notes',
    step: 'Stage 4',
    subtitle: 'Spatial coordinates, GPS markers and inventory remarks',
    icon: Compass,
  },
];

function parseChainageValue(val: string): number | null {
  if (!val || !val.trim()) return null;
  const cleaned = val.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const km = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    if (!isNaN(km) && !isNaN(m)) {
      return km + m / 1000;
    }
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

const DEFAULT_CONFIG_OPTIONS = [
  '2-Lane',
  '2-Lane with Paved Shoulder',
  '4-Lane',
  '6-Lane',
  'Intermediate Lane',
  'Single Lane',
  'Mixed Configuration',
];

export const HighwayEntryForm: React.FC<HighwayEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onCancel,
}) => {
  const auth = useAuth();
  const effectiveCanBypassValidation = Boolean(auth.canBypassValidation || auth.isSuperAdmin);

  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Stage 1: Identity & Designations
  const [roadCode, setRoadCode] = useState<string>(initialData?.road_code || '');
  const [oldNhNo, setOldNhNo] = useState<string>(initialData?.old_nh_no || '');
  const [newNhNo, setNewNhNo] = useState<string>(initialData?.new_nh_no || '');
  const [roadName, setRoadName] = useState<string>(initialData?.road_name || '');
  const [configuration, setConfiguration] = useState<string>(initialData?.configuration || '');

  // Stage 2: Geographic Termini & Chainages
  const [fromLocation, setFromLocation] = useState<string>(initialData?.from_location || '');
  const [toLocation, setToLocation] = useState<string>(initialData?.to_location || '');
  const [fromChainage, setFromChainage] = useState<string>(
    initialData?.from_chainage !== undefined && initialData?.from_chainage !== null
      ? String(initialData.from_chainage)
      : '0'
  );
  const [toChainage, setToChainage] = useState<string>(
    initialData?.to_chainage !== undefined && initialData?.to_chainage !== null
      ? String(initialData.to_chainage)
      : ''
  );
  const [lengthKm, setLengthKm] = useState<string>(
    initialData?.length_km !== undefined && initialData?.length_km !== null
      ? String(initialData.length_km)
      : ''
  );

  // Stage 3: Multi-Lane Breakdowns
  const [lengthLessThan2l, setLengthLessThan2l] = useState<string>(
    initialData?.length_less_than_2l !== undefined && initialData?.length_less_than_2l !== null
      ? String(initialData.length_less_than_2l)
      : '0'
  );
  const [length2l, setLength2l] = useState<string>(
    initialData?.length_2l !== undefined && initialData?.length_2l !== null
      ? String(initialData.length_2l)
      : '0'
  );
  const [length2lPs, setLength2lPs] = useState<string>(
    initialData?.length_2l_ps !== undefined && initialData?.length_2l_ps !== null
      ? String(initialData.length_2l_ps)
      : '0'
  );
  const [length4l, setLength4l] = useState<string>(
    initialData?.length_4l !== undefined && initialData?.length_4l !== null
      ? String(initialData.length_4l)
      : '0'
  );
  const [length6l, setLength6l] = useState<string>(
    initialData?.length_6l !== undefined && initialData?.length_6l !== null
      ? String(initialData.length_6l)
      : '0'
  );

  // Stage 4: Georeferencing & Spatial Details
  const [startLatitude, setStartLatitude] = useState<string>(
    initialData?.start_latitude !== undefined && initialData?.start_latitude !== null
      ? String(initialData.start_latitude)
      : ''
  );
  const [startLongitude, setStartLongitude] = useState<string>(
    initialData?.start_longitude !== undefined && initialData?.start_longitude !== null
      ? String(initialData.start_longitude)
      : ''
  );
  const [endLatitude, setEndLatitude] = useState<string>(
    initialData?.end_latitude !== undefined && initialData?.end_latitude !== null
      ? String(initialData.end_latitude)
      : ''
  );
  const [endLongitude, setEndLongitude] = useState<string>(
    initialData?.end_longitude !== undefined && initialData?.end_longitude !== null
      ? String(initialData.end_longitude)
      : ''
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const configOptions = masterData?.configurations && masterData.configurations.length > 0
    ? masterData.configurations
    : DEFAULT_CONFIG_OPTIONS;

  // Auto calculate length from chainages
  const handleFromChainageChange = (val: string) => {
    setFromChainage(val);
    const startNum = parseChainageValue(val);
    const endNum = parseChainageValue(toChainage);
    if (startNum !== null && endNum !== null && endNum >= startNum) {
      const calculated = Math.round((endNum - startNum) * 1000) / 1000;
      if (calculated >= 0) setLengthKm(String(calculated));
    }
  };

  const handleToChainageChange = (val: string) => {
    setToChainage(val);
    const startNum = parseChainageValue(fromChainage);
    const endNum = parseChainageValue(val);
    if (startNum !== null && endNum !== null && endNum >= startNum) {
      const calculated = Math.round((endNum - startNum) * 1000) / 1000;
      if (calculated >= 0) setLengthKm(String(calculated));
    }
  };

  const handleLengthChange = (val: string) => {
    setLengthKm(val);
    const lenNum = parseFloat(val);
    const startNum = parseChainageValue(fromChainage);
    if (!isNaN(lenNum) && lenNum > 0 && startNum !== null) {
      const calculatedEnd = Math.round((startNum + lenNum) * 1000) / 1000;
      setToChainage(String(calculatedEnd));
    }
  };

  // Lane Summation Checksum
  const laneSum = useMemo(() => {
    const l1 = parseFloat(lengthLessThan2l) || 0;
    const l2 = parseFloat(length2l) || 0;
    const l2ps = parseFloat(length2lPs) || 0;
    const l4 = parseFloat(length4l) || 0;
    const l6 = parseFloat(length6l) || 0;
    return Math.round((l1 + l2 + l2ps + l4 + l6) * 1000) / 1000;
  }, [lengthLessThan2l, length2l, length2lPs, length4l, length6l]);

  const targetLength = parseFloat(lengthKm) || 0;
  const isChecksumMatch = targetLength > 0 && Math.abs(laneSum - targetLength) < 0.05;

  // -------------------------------------------------------------
  // STAGE-GATED VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Identity & Classification (Baseline)
      if (!roadCode.trim()) {
        stageErrors.roadCode = 'Unique Road / Corridor Code is required (Stage 1).';
      }
      if (!roadName.trim()) {
        stageErrors.roadName = 'Corridor Name is required (Stage 1).';
      }
      if (!newNhNo.trim() && !oldNhNo.trim()) {
        stageErrors.nhNo = 'At least New NH No or Old NH No must be provided (Stage 1).';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Termini & Chainages
      const startNum = parseChainageValue(fromChainage);
      const endNum = parseChainageValue(toChainage);
      if (startNum === null) stageErrors.fromChainage = 'Valid Starting Chainage is required (Stage 2).';
      if (endNum === null) stageErrors.toChainage = 'Valid Ending Chainage is required (Stage 2).';
      if (startNum !== null && endNum !== null && endNum < startNum) {
        stageErrors.toChainage = 'Ending Chainage cannot be less than Starting Chainage (Stage 2).';
      }
      const len = parseFloat(lengthKm);
      if (isNaN(len) || len <= 0) {
        stageErrors.lengthKm = 'Valid positive Total Length (Km) is required (Stage 2).';
      }
    } else if (stageIdx === 2) {
      // Stage 3: Multi-Lane Breakdown
      if (lengthLessThan2l && (isNaN(Number(lengthLessThan2l)) || Number(lengthLessThan2l) < 0)) {
        stageErrors.lengthLessThan2l = '< 2-Lane length must be a non-negative number.';
      }
      if (length2l && (isNaN(Number(length2l)) || Number(length2l) < 0)) {
        stageErrors.length2l = '2-Lane length must be a non-negative number.';
      }
      if (length2lPs && (isNaN(Number(length2lPs)) || Number(length2lPs) < 0)) {
        stageErrors.length2lPs = '2-Lane + PS length must be a non-negative number.';
      }
      if (length4l && (isNaN(Number(length4l)) || Number(length4l) < 0)) {
        stageErrors.length4l = '4-Lane length must be a non-negative number.';
      }
      if (length6l && (isNaN(Number(length6l)) || Number(length6l) < 0)) {
        stageErrors.length6l = '6-Lane length must be a non-negative number.';
      }
    } else if (stageIdx === 3) {
      // Stage 4: Georeferencing
      if (startLatitude && (isNaN(Number(startLatitude)) || Number(startLatitude) < -90 || Number(startLatitude) > 90)) {
        stageErrors.startLatitude = 'Start Latitude must be between -90 and 90.';
      }
      if (startLongitude && (isNaN(Number(startLongitude)) || Number(startLongitude) < -180 || Number(startLongitude) > 180)) {
        stageErrors.startLongitude = 'Start Longitude must be between -180 and 180.';
      }
      if (endLatitude && (isNaN(Number(endLatitude)) || Number(endLatitude) < -90 || Number(endLatitude) > 90)) {
        stageErrors.endLatitude = 'End Latitude must be between -90 and 90.';
      }
      if (endLongitude && (isNaN(Number(endLongitude)) || Number(endLongitude) < -180 || Number(endLongitude) > 180)) {
        stageErrors.endLongitude = 'End Longitude must be between -180 and 180.';
      }
    }

    return stageErrors;
  };

  const isStageAccessible = (targetStageIdx: number): boolean => {
    if (effectiveCanBypassValidation) return true;
    if (targetStageIdx === 0) return true;
    for (let i = 0; i < targetStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      if (Object.keys(stageErrs).length > 0) return false;
    }
    return true;
  };

  const isStageCompleted = (stageIdx: number): boolean => {
    if (stageIdx === 0) {
      return Boolean(roadCode.trim() && roadName.trim() && (newNhNo.trim() || oldNhNo.trim()) && Object.keys(validateSingleStage(0)).length === 0);
    }
    if (stageIdx === 1) {
      return Boolean(fromChainage && toChainage && lengthKm && Object.keys(validateSingleStage(1)).length === 0);
    }
    if (stageIdx === 2) {
      return Boolean(isChecksumMatch && Object.keys(validateSingleStage(2)).length === 0);
    }
    if (stageIdx === 3) {
      return Boolean(startLatitude || startLongitude);
    }
    return false;
  };

  const validateUpToStage = (maxStageIdx: number): boolean => {
    const combinedErrors: Record<string, string> = {};
    for (let i = 0; i <= maxStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      Object.assign(combinedErrors, stageErrs);
    }
    setErrors(combinedErrors);
    return Object.keys(combinedErrors).length === 0;
  };

  const handleStageTabClick = (idx: number) => {
    if (effectiveCanBypassValidation || isStageAccessible(idx)) {
      setErrors({});
      setActiveStageIndex(idx);
    } else {
      validateUpToStage(activeStageIndex);
    }
  };

  const handleNextStage = () => {
    if (effectiveCanBypassValidation || validateUpToStage(activeStageIndex)) {
      if (activeStageIndex < STAGES.length - 1) {
        setActiveStageIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCanBypassValidation) {
      if (!validateUpToStage(activeStageIndex)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      road_code: roadCode.trim().toUpperCase(),
      old_nh_no: oldNhNo.trim() || null,
      new_nh_no: newNhNo.trim() || null,
      road_name: roadName.trim(),
      from_location: fromLocation.trim() || null,
      to_location: toLocation.trim() || null,
      from_chainage: parseChainageValue(fromChainage) ?? 0,
      to_chainage: parseChainageValue(toChainage) ?? 0,
      length_km: parseFloat(lengthKm) || 0,
      length_less_than_2l: parseFloat(lengthLessThan2l) || 0,
      length_2l: parseFloat(length2l) || 0,
      length_2l_ps: parseFloat(length2lPs) || 0,
      length_4l: parseFloat(length4l) || 0,
      length_6l: parseFloat(length6l) || 0,
      configuration: configuration || '2-Lane',
      status: initialData?.status || 'ACTIVE',
      start_latitude: startLatitude ? parseFloat(startLatitude) : null,
      start_longitude: startLongitude ? parseFloat(startLongitude) : null,
      end_latitude: endLatitude ? parseFloat(endLatitude) : null,
      end_longitude: endLongitude ? parseFloat(endLongitude) : null,
    };

    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <Route className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Highway Corridor Inventory' : 'New National Highway Corridor Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Master Database &bull; Straight-Line Linear Reference & Multi-Lane Configuration
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Corridor...' : `Save Progress (${currentStage.step})`}
        </button>
      </div>

      {/* 4-STAGE LIFECYCLE SUB-NAVIGATION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStageIndex === idx;
            const accessible = isStageAccessible(idx);
            const completed = isStageCompleted(idx);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageTabClick(idx)}
                disabled={!accessible}
                className={`flex flex-col items-start p-3 rounded-xl text-left transition-all border relative cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                    : accessible
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : completed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stage.step}
                  </span>
                  {completed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : !accessible ? (
                    <LockKeyhole className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  )}
                </div>
                <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate w-full mt-0.5">{stage.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Diagnostic Alert Banner */}
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

      {/* STAGE CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Stage Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(currentStage.icon, { className: 'w-5 h-5 text-blue-300' })}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                {currentStage.step}: {currentStage.label}
              </h3>
              <span className="text-xs text-blue-200">{currentStage.subtitle}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ========================================================= */}
          {/* STAGE 1: Corridor Identity & Classification */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unique Road / Corridor Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roadCode}
                    onChange={(e) => {
                      setRoadCode(e.target.value);
                      if (errors.roadCode) setErrors((prev) => ({ ...prev, roadCode: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.roadCode && <p className="text-[11px] text-rose-500 mt-1">{errors.roadCode}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New NH Number (Gazetted)
                  </label>
                  <input
                    type="text"
                    value={newNhNo}
                    onChange={(e) => {
                      setNewNhNo(e.target.value);
                      if (errors.nhNo) setErrors((prev) => ({ ...prev, nhNo: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Old NH Number (Pre-2010)
                  </label>
                  <input
                    type="text"
                    value={oldNhNo}
                    onChange={(e) => {
                      setOldNhNo(e.target.value);
                      if (errors.nhNo) setErrors((prev) => ({ ...prev, nhNo: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {errors.nhNo && <p className="text-[11px] text-rose-500 mt-0">{errors.nhNo}</p>}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corridor / Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => {
                    setRoadName(e.target.value);
                    if (errors.roadName) setErrors((prev) => ({ ...prev, roadName: '' }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.roadName && <p className="text-[11px] text-rose-500 mt-1">{errors.roadName}</p>}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Carriageway Configuration
                </label>
                <SearchableSelect
                  options={configOptions}
                  value={configuration}
                  onChange={setConfiguration}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Geographic Termini & Chainages */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Origin / Starting Point (From)
                  </label>
                  <input
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination / Terminus (To)
                  </label>
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Starting Chainage <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fromChainage}
                    onChange={(e) => handleFromChainageChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.fromChainage && <p className="text-[11px] text-rose-500 mt-1">{errors.fromChainage}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ending Chainage <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={toChainage}
                    onChange={(e) => handleToChainageChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.toChainage && <p className="text-[11px] text-rose-500 mt-1">{errors.toChainage}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Verified Length (Km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={lengthKm}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.lengthKm && <p className="text-[11px] text-rose-500 mt-1">{errors.lengthKm}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Multi-Lane Carriageway Breakdown */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Lane Summation Checksum Validator
                  </span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Lane Segments Sum: <strong className="font-mono text-blue-600">{laneSum.toFixed(3)} Km</strong> / Corridor Target: <strong className="font-mono">{targetLength.toFixed(3)} Km</strong>
                  </div>
                </div>
                <div>
                  {isChecksumMatch ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                      <Check className="w-4 h-4" /> Checksum Matches (100%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4" /> Δ {(targetLength - laneSum).toFixed(3)} Km Discrepancy
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    &lt; 2-Lane (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={lengthLessThan2l}
                    onChange={(e) => setLengthLessThan2l(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2-Lane Regular (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={length2l}
                    onChange={(e) => setLength2l(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2-Lane + PS (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={length2lPs}
                    onChange={(e) => setLength2lPs(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4-Lane Divided (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={length4l}
                    onChange={(e) => setLength4l(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    6-Lane Expressway (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={length6l}
                    onChange={(e) => setLength6l(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: Georeferencing & Spatial Details */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Starting GPS Coordinates
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Start Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={startLatitude}
                        onChange={(e) => setStartLatitude(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Start Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={startLongitude}
                        onChange={(e) => setStartLongitude(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Terminating GPS Coordinates
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">End Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={endLatitude}
                        onChange={(e) => setEndLatitude(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">End Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={endLongitude}
                        onChange={(e) => setEndLongitude(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStage}
            disabled={activeStageIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Stage
          </button>

          <button
            type="button"
            onClick={handleNextStage}
            disabled={activeStageIndex === STAGES.length - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Stage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default HighwayEntryForm;
