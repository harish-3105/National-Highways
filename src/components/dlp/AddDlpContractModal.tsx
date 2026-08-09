'use client';

import React, { useState, useEffect } from 'react';
import { DLPContractItem } from '@/app/dlp/page';
import { ShieldCheck, X, Plus } from 'lucide-react';

interface AddDlpContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DIVISION_OPTIONS = [
  'Vellore',
  'Villupuram',
  'Madurai',
  'Trichy',
  'Salem',
  'Coimbatore',
  'Gobichettipalayam',
  'Chennai',
  'Kanchipuram',
  'Tirunelveli',
];

const CONTRACT_MODES = ['EPC', 'STMC', 'PBMC', 'BOT', 'HAM', 'Annual Plan', 'Special Repairs'];

export const AddDlpContractModal: React.FC<AddDlpContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [highwayCode, setHighwayCode] = useState('');
  const [divisionName, setDivisionName] = useState('Vellore');
  const [stretchName, setStretchName] = useState('');
  const [fromKm, setFromKm] = useState<number | ''>(0);
  const [toKm, setToKm] = useState<number | ''>(10);
  const [contractorName, setContractorName] = useState('');
  const [contractMode, setContractMode] = useState('EPC');
  const [workDescription, setWorkDescription] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dlpExpiryDate, setDlpExpiryDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('Highway code is required (e.g. NH-44)');
      return;
    }
    if (!dlpExpiryDate) {
      setErrorMsg('DLP Expiry Date is required');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const autoStretchName =
        stretchName.trim() ||
        `${divisionName} Division - ${highwayCode.toUpperCase().startsWith('NH') ? highwayCode.toUpperCase() : 'NH-' + highwayCode.toUpperCase()} (Km ${fromKm} to ${toKm})`;

      const payload: Partial<DLPContractItem> = {
        highway_code: highwayCode.toUpperCase().startsWith('NH') ? highwayCode.toUpperCase() : `NH-${highwayCode.toUpperCase()}`,
        division_name: divisionName,
        stretch_name: autoStretchName,
        from_km: Number(fromKm || 0),
        to_km: Number(toKm || 0),
        length_km: calculatedLength,
        contractor_name: contractorName.trim() || `${divisionName} Division (Contractor DLP)`,
        contract_mode: contractMode,
        work_description: workDescription.trim() || `Maintenance & DLP period under ${divisionName} Division (${contractMode})`,
        doc_date: docDate || undefined,
        dlp_expiry_date: dlpExpiryDate,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-200 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">Add DLP Contract Record</h3>
              <p className="text-xs text-amber-100">Create a new Defect Liability Period maintenance log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-amber-100 hover:text-white rounded-lg transition-colors cursor-pointer"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highway Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NH-179A or 44"
                value={highwayCode}
                onChange={(e) => setHighwayCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highways Division <span className="text-red-500">*</span>
              </label>
              <select
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Division
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Stretch Title / Section Description
            </label>
            <input
              type="text"
              placeholder="e.g. Vellore Division - NH-179A (Km 80/0 to 120/0)"
              value={stretchName}
              onChange={(e) => setStretchName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">To Km</label>
              <input
                type="number"
                step="0.001"
                value={toKm}
                onChange={(e) => setToKm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Calculated Length</label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-extrabold">
                {calculatedLength} km
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contractor / Agency Name</label>
              <input
                type="text"
                placeholder="e.g. Vellore Division (Contractor DLP) or L&T Const."
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contract Maintenance Mode</label>
              <select
                value={contractMode}
                onChange={(e) => setContractMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CONTRACT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">DOC Date (Commencement)</label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                DLP Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dlpExpiryDate}
                onChange={(e) => setDlpExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Description & Remarks</label>
            <textarea
              rows={3}
              placeholder="e.g. Under contractor DLP & Periodical maintenance carried over by contractor as per contractual obligation..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create DLP Contract</span>
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
