'use client';

import React, { useState, useEffect } from 'react';
import { CaseEntryFormData } from '@/types/legal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteLegalCaseModalProps {
  caseData: CaseEntryFormData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteLegalCaseModal: React.FC<DeleteLegalCaseModalProps> = ({
  caseData,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  if (!isOpen || !caseData) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch(`/api/legal?id=${encodeURIComponent(caseData.id || '')}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to soft-delete legal case record.');
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
            Archive Legal Case Record?
          </h3>

          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-900 text-white rounded font-extrabold text-xs">
                {caseData.caseNumber}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ({caseData.caseYear})
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              {caseData.circle} Circle &bull; {caseData.division}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
              {caseData.nameOfCourt} &bull; {caseData.respondentNames || 'Highways Department'}
            </p>
          </div>

          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            This action will soft-delete the legal case from the active portal view. Ground-truth historical data will remain archived in PostgreSQL for audit purposes.
          </p>

          {errorMsg && (
            <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Soft-Delete Legal Case</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteLegalCaseModal;
