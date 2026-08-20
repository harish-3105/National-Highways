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
} from 'lucide-react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { HighwayMasterData } from '@/app/api/highways/master-data/route';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface HighwayEntryFormProps {
  initialData?: Partial<HighwayCorridor>;
  masterData?: HighwayMasterData;
  onSave: (formData: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
}

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

const CONFIG_OPTIONS = [
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
  const [roadCode, setRoadCode] = useState<string>(initialData?.road_code || '');
  const [oldNhNo, setOldNhNo] = useState<string>(initialData?.old_nh_no || '');
  const [newNhNo, setNewNhNo] = useState<string>(initialData?.new_nh_no || '');
  const [roadName, setRoadName] = useState<string>(initialData?.road_name || '');
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

  // Multi-Lane Breakdowns
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
  const [configuration, setConfiguration] = useState<string>(
    initialData?.configuration || ''
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const isChecksumMatch = Math.abs(laneSum - targetLength) < 0.05;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!roadCode.trim()) newErrors.roadCode = 'Unique Road / Corridor Code is required.';
    if (!roadName.trim()) newErrors.roadName = 'Corridor Name is required.';
    if (!newNhNo.trim() && !oldNhNo.trim()) {
      newErrors.nhNo = 'At least New NH No or Old NH No must be provided.';
    }

    const startNum = parseChainageValue(fromChainage);
    const endNum = parseChainageValue(toChainage);
    if (startNum === null) newErrors.fromChainage = 'Valid Starting Chainage is required.';
    if (endNum === null) newErrors.toChainage = 'Valid Ending Chainage is required.';
    if (startNum !== null && endNum !== null && endNum < startNum) {
      newErrors.chainage = 'Ending Chainage cannot be less than Starting Chainage.';
    }

    const len = parseFloat(lengthKm);
    if (isNaN(len) || len <= 0) {
      newErrors.lengthKm = 'Valid positive Total Length (Km) is required.';
    }

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

    const payload: Record<string, unknown> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      road_code: roadCode.trim().toUpperCase(),
      old_nh_no: oldNhNo.trim() || null,
      new_nh_no: newNhNo.trim() || null,
      road_name: roadName.trim(),
      from_location: fromLocation.trim() || null,
      to_location: toLocation.trim() || null,
      from_chainage: parseFloat(fromChainage) || 0,
      to_chainage: parseFloat(toChainage) || 0,
      length_km: parseFloat(lengthKm) || 0,
      length_less_than_2l: parseFloat(lengthLessThan2l) || 0,
      length_2l: parseFloat(length2l) || 0,
      length_2l_ps: parseFloat(length2lPs) || 0,
      length_4l: parseFloat(length4l) || 0,
      length_6l: parseFloat(length6l) || 0,
      configuration: configuration || '2-Lane',
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
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Highway Corridor Inventory Record' : 'New Highway Corridor Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Corridors Catalog &bull; Level 1 Verified Inventory & Multi-Lane Carriageway Breakdown
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
            <Save className="w-4 h-4" /> {loading ? 'Saving Corridor...' : 'Save Corridor Record'}
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

      {/* MODULE 1: Administrative Identity & Designations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 1: Corridor Identity & Administrative Classification
            </h3>
            <span className="text-xs text-blue-200">
              Primary road identifiers, national highway numbers, and official corridor name
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Road / Corridor Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roadCode}
                onChange={(e) => {
                  setRoadCode(e.target.value);
                  if (errors.roadCode) setErrors((prev) => ({ ...prev, roadCode: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NH-44-TN"
                required
              />
              {errors.roadCode && <p className="text-[11px] text-rose-500 mt-1">{errors.roadCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New NH Number <span className="text-slate-400 font-normal">(Post-2010 Gazetted)</span>
              </label>
              <input
                type="text"
                value={newNhNo}
                onChange={(e) => {
                  setNewNhNo(e.target.value);
                  if (errors.nhNo) setErrors((prev) => ({ ...prev, nhNo: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NH 44"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Old NH Number <span className="text-slate-400 font-normal">(Pre-2010 Historical)</span>
              </label>
              <input
                type="text"
                value={oldNhNo}
                onChange={(e) => {
                  setOldNhNo(e.target.value);
                  if (errors.nhNo) setErrors((prev) => ({ ...prev, nhNo: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NH 7"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official Corridor Name / Section <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={roadName}
              onChange={(e) => {
                setRoadName(e.target.value);
                if (errors.roadName) setErrors((prev) => ({ ...prev, roadName: '' }));
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Hosur - Krishnagiri - Dharmapuri - Salem Section"
              required
            />
            {errors.roadName && <p className="text-[11px] text-rose-500 mt-1">{errors.roadName}</p>}
          </div>
        </div>
      </div>

      {/* MODULE 2: Geographic Extents & Chainage Bounds */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4 text-white flex items-center gap-3">
          <MapPin className="w-5 h-5 text-indigo-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 2: Geographic Termini & Linear Chainage Bounds
            </h3>
            <span className="text-xs text-indigo-200">
              Starting and terminating locations, kilometer stone benchmarks, and verified corridor length
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                From Location (Starting Point)
              </label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Tamil Nadu / Karnataka Border (Hosur)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                To Location (Terminating Point)
              </label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Salem City Outer Ring Junction"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                From Chainage (Km / Km+m) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fromChainage}
                onChange={(e) => handleFromChainageChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 0 or 33/200"
                required
              />
              {errors.fromChainage && <p className="text-[11px] text-rose-500 mt-1">{errors.fromChainage}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                To Chainage (Km / Km+m) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={toChainage}
                onChange={(e) => handleToChainageChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 142.500"
                required
              />
              {errors.toChainage && <p className="text-[11px] text-rose-500 mt-1">{errors.toChainage}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Corridor Length (Km) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={lengthKm}
                onChange={(e) => handleLengthChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 142.500"
                required
              />
              {errors.lengthKm && <p className="text-[11px] text-rose-500 mt-1">{errors.lengthKm}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: Multi-Lane Carriageway Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                MODULE 3: Multi-Lane Carriageway Breakdown
              </h3>
              <span className="text-xs text-emerald-200">
                Segmented kilometer lengths across lane configurations and checksum validation
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              isChecksumMatch
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
            }`}
          >
            {isChecksumMatch ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lane Sum Matches ({laneSum} Km)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Lane Sum: {laneSum} / {targetLength || 0} Km</span>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                &lt; 2-Lane (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={lengthLessThan2l}
                onChange={(e) => setLengthLessThan2l(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                2-Lane (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={length2l}
                onChange={(e) => setLength2l(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                2-Lane + PS (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={length2lPs}
                onChange={(e) => setLength2lPs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                4-Lane (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={length4l}
                onChange={(e) => setLength4l(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                6-Lane (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={length6l}
                onChange={(e) => setLength6l(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Predominant Carriageway Configuration
              </label>
              <SearchableSelect
                options={
                  masterData?.configurations && masterData.configurations.length > 0
                    ? masterData.configurations
                    : CONFIG_OPTIONS
                }
                value={configuration}
                onChange={setConfiguration}
                placeholder="Select Configuration..."
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                The sum of the lane lengths represents the linear distribution of the carriageway across the entire corridor stretch.
              </span>
            </div>
          </div>
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
          <Save className="w-4 h-4" /> {loading ? 'Saving Corridor...' : 'Save Complete Corridor Record'}
        </button>
      </div>
    </form>
  );
};

export default HighwayEntryForm;
