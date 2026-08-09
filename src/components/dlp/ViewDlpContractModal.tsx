'use client';

import React from 'react';
import { DLPContractItem } from '@/app/dlp/page';
import { X, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

interface ViewDlpContractModalProps {
  contract: DLPContractItem | null;
  onClose: () => void;
}

export const ViewDlpContractModal: React.FC<ViewDlpContractModalProps> = ({ contract, onClose }) => {
  if (!contract) return null;

  const renderStatusBadge = (days?: number) => {
    if (days === undefined || days === null) {
      return (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
          Ongoing / N/A
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-[11px]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{days < 0 ? 'Expired' : `${days}d left`}</span>
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[11px]">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{days}d left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800 text-[11px]">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span>{days}d left</span>
      </span>
    );
  };

  const renderTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DLP':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">DLP</span>;
      case 'STMC':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-[11px]">STMC</span>;
      case 'PBMC':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold text-[11px]">PBMC</span>;
      case 'CONSTRUCTION':
        return <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-extrabold text-[11px]">Construction</span>;
      case 'NO_DLP':
        return <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[11px]">No DLP</span>;
      case 'UNCONTRACTED':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[11px]">Uncontracted</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">{type}</span>;
    }
  };

  const subContracts = contract.sub_contracts || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Complete Departmental Stretch Record & Granular Sub-Contracts
              </h3>
              <span className="text-xs text-slate-300">
                {contract.highway_code} &bull; {contract.division_name || 'General'} Division &bull; 1-to-N Sub-Contract Model
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-xs">
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
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
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
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Section 2 &ndash; Category Breakdown Summary (Cols 6 to 24)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DLP Breakdown */}
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

              {/* STMC Breakdown */}
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
                    <strong className="text-slate-500 block">STMC Expiry Date(s) (Col 16):</strong>
                    <span className="font-bold text-blue-800 dark:text-blue-300">{contract.stmc_expiry_date}</span>
                  </div>
                )}
              </div>

              {/* PBMC Breakdown */}
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

              {/* Construction Breakdown */}
              <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 space-y-2">
                <span className="font-bold text-orange-900 dark:text-orange-300 block text-xs">
                  Under Construction / Tender Projects (Cols 10-12)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-slate-500">No. of Projects:</strong> <span className="font-bold">{contract.construction_project_count ?? 0}</span></div>
                  <div><strong className="text-slate-500">Length in km:</strong> <span className="font-bold text-orange-700">{contract.construction_length_km ?? 0} km</span></div>
                </div>
                {contract.construction_chainage && (
                  <div>
                    <strong className="text-slate-500 block">Construction Chainages (Col 11):</strong>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.construction_chainage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Granular Sub-Contracts Relational Table */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50/20 dark:bg-blue-950/10">
            <h4 className="font-bold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Section 3 &ndash; Individual Sub-Contracts ({subContracts.length} Extracted Sub-Stretches)
            </h4>

            {subContracts.length === 0 ? (
              <p className="text-slate-500 italic text-xs">No individual sub-contracts recorded.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Sub-Stretch Title / Chainages</th>
                      <th className="px-3 py-2">Length</th>
                      <th className="px-3 py-2">Contractor / Agency</th>
                      <th className="px-3 py-2">Expiry Date</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subContracts.map((sub, idx) => (
                      <tr key={sub.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 whitespace-nowrap">{renderTypeBadge(sub.maintenance_type)}</td>
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{sub.sub_stretch_title}</td>
                        <td className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400">{sub.length_km ?? 0} km</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{sub.contractor_name || 'N/A'}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{sub.expiry_date || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{renderStatusBadge(sub.days_remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Departmental Remarks & Proposals (Col 25) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Section 4 &ndash; Departmental Remarks & Work Proposals (Col 25)
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDlpContractModal;
