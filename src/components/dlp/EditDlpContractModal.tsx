'use client';

import React, { useState, useEffect } from 'react';
import { DLPContractItem } from '@/app/dlp/page';
import { Edit3, X, Save } from 'lucide-react';

interface EditDlpContractModalProps {
  contract: DLPContractItem | null;
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

export const EditDlpContractModal: React.FC<EditDlpContractModalProps> = ({
  contract,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [highwayCode, setHighwayCode] = useState('');
  const [divisionName, setDivisionName] = useState('Vellore');
  const [stretchName, setStretchName] = useState('');
  const [fromKm, setFromKm] = useState<number | ''>(0);
  const [toKm, setToKm] = useState<number | ''>(0);
  const [contractorName, setContractorName] = useState('');
  const [contractMode, setContractMode] = useState('EPC');
  const [workDescription, setWorkDescription] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dlpExpiryDate, setDlpExpiryDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (contract) {
      setHighwayCode(contract.highway_code || '');
      setDivisionName(contract.division_name || 'Vellore');
      setStretchName(contract.stretch_name || '');
      setFromKm(contract.from_km ?? 0);
      setToKm(contract.to_km ?? 0);
      setContractorName(contract.contractor_name || '');
      setContractMode(contract.contract_mode || 'EPC');
      setWorkDescription(contract.work_description || '');
      setDocDate(contract.doc_date || '');
      setDlpExpiryDate(contract.dlp_expiry_date || '');
    }
  }, [contract]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !contract) return null;

  const calculatedLength =
    fromKm !== '' && toKm !== '' ? Math.max(0, Math.round((Number(toKm) - Number(fromKm)) * 1000) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!highwayCode.trim()) {
      setErrorMsg('Highway code is required');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        id: contract.id,
        highway_code: highwayCode.toUpperCase().startsWith('NH') ? highwayCode.toUpperCase() : `NH-${highwayCode.toUpperCase()}`,
        division_name: divisionName,
        stretch_name: stretchName.trim() || `${divisionName} Division - ${highwayCode} (Km ${fromKm} to ${toKm})`,
        from_km: Number(fromKm || 0),
        to_km: Number(toKm || 0),
        length_km: calculatedLength,
        contractor_name: contractorName.trim() || `${divisionName} Division Contractor`,
        contract_mode: contractMode,
        work_description: workDescription.trim(),
        doc_date: docDate || undefined,
        dlp_expiry_date: dlpExpiryDate || undefined,
      };

      const res = await fetch('/api/dlp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to update DLP contract.');
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
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">Edit DLP Contract Record</h3>
              <p className="text-xs text-blue-200">
                Editing Record #{contract.highway_code} ({contract.division_name || 'General'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
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
                value={highwayCode}
                onChange={(e) => setHighwayCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highways Division <span className="text-red-500">*</span>
              </label>
              <select
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
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
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contract Maintenance Mode</label>
              <select
                value={contractMode}
                onChange={(e) => setContractMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">DLP Expiry Date</label>
              <input
                type="date"
                value={dlpExpiryDate}
                onChange={(e) => setDlpExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Description & Remarks</label>
            <textarea
              rows={3}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
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

export default EditDlpContractModal;
