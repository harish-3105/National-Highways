'use client';

import React from 'react';
import { DLPContractItem } from '@/app/dlp/page';
import { X, ShieldCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ViewDlpContractModalProps {
  contract: DLPContractItem | null;
  onClose: () => void;
}

export const ViewDlpContractModal: React.FC<ViewDlpContractModalProps> = ({ contract, onClose }) => {
  if (!contract) return null;

  const renderStatusBadge = (days: number) => {
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{days < 0 ? 'Expired' : `Expiring Soon (${days}d left)`}</span>
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-white font-extrabold text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Expiring Soon ({days}d left)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Active ({days}d left)</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-200 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Complete Excel Departmental Record Details
              </h3>
              <span className="text-xs text-amber-100">
                {contract.highway_code} &bull; {contract.division_name || 'General'} Division &bull; 100% Column Capture
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-100 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-xs">
                {contract.highway_code}
              </span>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg font-bold text-xs">
                {contract.division_name || 'General'} Division
              </span>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg font-bold text-xs">
                Primary Mode: {contract.contract_mode}
              </span>
            </div>
            {renderStatusBadge(contract.days_remaining)}
          </div>

          {/* Section 1: Stretch & Chainage Particulars */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Section 1 &ndash; Stretch & Chainage Particulars (Cols 0 to 5)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <strong className="text-slate-500 block">Stretch Name:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{contract.stretch_name}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Main Chainage Range:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Km {contract.from_km} to Km {contract.to_km}
                </span>
              </div>
              <div>
                <strong className="text-slate-500 block">Total Stretch Length:</strong>
                <span className="font-bold text-blue-600 dark:text-blue-400">{contract.length_km} km</span>
              </div>
            </div>
          </div>

          {/* Section 2: Complete Maintenance Category Breakdown */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Section 2 &ndash; Category Sub-Chainages & Expiry Dates (Cols 6 to 24)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DLP Breakdown (Cols 6, 7, 8, 9) */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
                  Under DLP Guarantee (Cols 6-9)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-slate-500">No. of Contracts:</strong> <span className="font-bold">{contract.dlp_contract_count ?? 0}</span></div>
                  <div><strong className="text-slate-500">Length under DLP:</strong> <span className="font-bold text-emerald-700">{contract.dlp_length_km ?? 0} km</span></div>
                </div>
                {contract.dlp_chainage && (
                  <div>
                    <strong className="text-slate-500 block">DLP Specific Chainages (Col 8):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.dlp_chainage}</span>
                  </div>
                )}
                <div>
                  <strong className="text-slate-500 block">DLP Till Date(s) (Col 9):</strong>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{contract.dlp_expiry_date || 'N/A'}</span>
                </div>
              </div>

              {/* STMC Breakdown (Cols 13, 14, 15, 16) */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-300 block text-xs">
                  Short-Term Maintenance (STMC) (Cols 13-16)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-slate-500">No. of Contracts:</strong> <span className="font-bold">{contract.stmc_contract_count ?? 0}</span></div>
                  <div><strong className="text-slate-500">Length under STMC:</strong> <span className="font-bold text-blue-700">{contract.stmc_length_km ?? 0} km</span></div>
                </div>
                {contract.stmc_chainage && (
                  <div>
                    <strong className="text-slate-500 block">STMC Specific Chainages (Col 15):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.stmc_chainage}</span>
                  </div>
                )}
                {contract.stmc_expiry_date && (
                  <div>
                    <strong className="text-slate-500 block">STMC Expiry / DLP Date(s) (Col 16):</strong>
                    <span className="font-bold text-blue-800 dark:text-blue-300">{contract.stmc_expiry_date}</span>
                  </div>
                )}
              </div>

              {/* PBMC Breakdown (Cols 17, 18, 19, 20) */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                <span className="font-bold text-purple-900 dark:text-purple-300 block text-xs">
                  Performance-Based Maintenance (PBMC) (Cols 17-20)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-slate-500">No. of Projects:</strong> <span className="font-bold">{contract.pbmc_project_count ?? 0}</span></div>
                  <div><strong className="text-slate-500">Length under PBMC:</strong> <span className="font-bold text-purple-700">{contract.pbmc_length_km ?? 0} km</span></div>
                </div>
                {contract.pbmc_chainage && (
                  <div>
                    <strong className="text-slate-500 block">PBMC Specific Chainages (Col 19):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.pbmc_chainage}</span>
                  </div>
                )}
                {contract.pbmc_expiry_date && (
                  <div>
                    <strong className="text-slate-500 block">PBMC Expiry Date(s) (Col 20):</strong>
                    <span className="font-bold text-purple-800 dark:text-purple-300">{contract.pbmc_expiry_date}</span>
                  </div>
                )}
              </div>

              {/* Construction Breakdown (Cols 10, 11, 12) */}
              <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 space-y-2">
                <span className="font-bold text-orange-900 dark:text-orange-300 block text-xs">
                  Under Construction / Tender (Cols 10-12)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-slate-500">No. of Projects:</strong> <span className="font-bold">{contract.construction_project_count ?? 0}</span></div>
                  <div><strong className="text-slate-500">Construction Length:</strong> <span className="font-bold text-orange-700">{contract.construction_length_km ?? 0} km</span></div>
                </div>
                {contract.construction_chainage && (
                  <div>
                    <strong className="text-slate-500 block">Construction Specific Chainages (Col 11):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.construction_chainage}</span>
                  </div>
                )}
              </div>

              {/* No DLP Breakdown (Cols 21, 22, 23) */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Length with No DLP (Cols 21-23)
                </span>
                <div><strong className="text-slate-500">Length as on date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{contract.no_dlp_length_km ?? 0} km</span></div>
                {contract.no_dlp_chainage && (
                  <div>
                    <strong className="text-slate-500 block">No DLP Specific Chainages (Col 22):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.no_dlp_chainage}</span>
                  </div>
                )}
                {contract.no_dlp_expiry_date && (
                  <div>
                    <strong className="text-slate-500 block">Date of Expiry of DLP (Col 23):</strong>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{contract.no_dlp_expiry_date}</span>
                  </div>
                )}
              </div>

              {/* Uncontracted Breakdown (Col 24) */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-300 block text-xs">
                  Additional Length Required (DLP Expires Before 31.03.2027) (Col 24)
                </span>
                <div><strong className="text-slate-500">Uncontracted Length:</strong> <span className="font-bold text-amber-700 text-sm">{contract.uncontracted_after_2027_km ?? 0} km</span></div>
              </div>
            </div>
          </div>

          {/* Section 3: Departmental Remarks & Proposals (Col 25) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Section 3 &ndash; Departmental Remarks & Work Proposals (Col 25)
            </h4>
            <p className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
              {contract.work_description || 'No departmental remarks recorded.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDlpContractModal;
