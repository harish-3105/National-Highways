'use client';

import React, { useState, useEffect } from 'react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { X, Edit3, AlertCircle, Save } from 'lucide-react';

interface EditHighwayModalProps {
  highway: HighwayCorridor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function parseChainageValue(val: string): number | null {
  if (!val || !val.trim()) return null;
  const cleaned = val.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const km = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    if (!isNaN(km) && !isNaN(m)) {
      return km + (m >= 100 ? m / 1000 : m / 10);
    }
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export const EditHighwayModal: React.FC<EditHighwayModalProps> = ({
  highway,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [roadName, setRoadName] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromChainage, setFromChainage] = useState('0');
  const [toChainage, setToChainage] = useState('');
  const [lengthKm, setLengthKm] = useState('');
  const [configuration, setConfiguration] = useState('2-Lane');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (highway && isOpen) {
      setRoadName(highway.road_name || '');
      setFromLocation(highway.from_location || '');
      setToLocation(highway.to_location || '');
      setFromChainage(highway.from_chainage || '0');
      setToChainage(highway.to_chainage || String(highway.length_km || ''));
      setLengthKm(String(highway.length_km || ''));
      setConfiguration(highway.configuration || '2-Lane');
      setErrorMsg('');
    }
  }, [highway, isOpen]);

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

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !highway) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roadName.trim()) {
      setErrorMsg('Road Name / Section Title cannot be empty.');
      return;
    }

    const numLength = parseFloat(lengthKm);
    if (isNaN(numLength) || numLength <= 0) {
      setErrorMsg('Length in km must be a valid positive number.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/highways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: highway.id,
          road_name: roadName,
          from_location: fromLocation,
          to_location: toLocation,
          from_chainage: fromChainage,
          to_chainage: toChainage || String(numLength),
          length_km: numLength,
          configuration,
          status: highway.status || 'ACTIVE',
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || 'Failed to update highway corridor.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Server error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Edit Highway Details
                </h3>
                <span className="px-2 py-0.5 bg-blue-900 text-white rounded font-extrabold text-xs">
                  {highway.road_code}
                </span>
              </div>
              <p className="text-xs text-slate-500">Update section title, endpoints, and configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Read-Only Road Code Badge & Lane Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Road Code <span className="text-xs font-normal text-slate-400">(Read-Only)</span>
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-blue-900 dark:text-blue-300 cursor-not-allowed">
                {highway.road_code}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lane Configuration
              </label>
              <select
                value={configuration}
                onChange={(e) => setConfiguration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2-Lane">2-Lane</option>
                <option value="2-Lane (Paved Shoulder)">2-Lane (Paved Shoulder)</option>
                <option value="4-Lane">4-Lane</option>
                <option value="6-Lane">6-Lane</option>
              </select>
            </div>
          </div>

          {/* Row 2: Road Name / Section Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corridor Section Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roadName}
              onChange={(e) => setRoadName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Row 3: From & To Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Location
              </label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Location
              </label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Distance Length (km) & Chainage Spans */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Length (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={lengthKm}
                onChange={(e) => handleLengthChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Chainage
              </label>
              <input
                type="text"
                value={fromChainage}
                onChange={(e) => handleFromChainageChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Chainage
              </label>
              <input
                type="text"
                value={toChainage}
                onChange={(e) => handleToChainageChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
