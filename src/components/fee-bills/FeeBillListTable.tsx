'use client';

import React from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR, formatDateDMY } from '@/lib/feeBillMasterData';
import {
  Eye,
  Edit3,
  Trash2,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface FeeBillListTableProps {
  bills: FeeBillRecord[];
  loading: boolean;
  masterData: FeeBillMasterDataConfig;
  onView: (bill: FeeBillRecord) => void;
  onEdit: (bill: FeeBillRecord) => void;
  onAudit: (bill: FeeBillRecord) => void;
  onDelete: (bill: FeeBillRecord) => void;
  onRestore?: (bill: FeeBillRecord) => void;
}

export const FeeBillListTable: React.FC<FeeBillListTableProps> = ({
  bills,
  loading,
  onView,
  onEdit,
  onAudit,
  onDelete,
  onRestore,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Querying Fee Bill Ledger Records...</p>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Fee Bills Found</h3>
        <p className="text-xs text-slate-500 mt-1">No lawyer fee bills match your active search or circle/division filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-4">Fee Bill Ref & Date</th>
              <th className="py-3.5 px-4">Circle & Division</th>
              <th className="py-3.5 px-4">Lawyer / Advocate Details</th>
              <th className="py-3.5 px-4">Case Details</th>
              <th className="py-3.5 px-4 text-right">Total Claim (₹)</th>
              <th className="py-3.5 px-4">Settlement & Pendency Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {bills.map((item) => {
              const isArchived = item.isDeleted || item.delete_status === 'DELETED';

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isArchived
                      ? 'bg-red-50/40 dark:bg-red-950/20 text-slate-400 opacity-80'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <span className={isArchived ? 'line-through' : ''}>{item.feeBillNumber}</span>
                      {isArchived && (
                        <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-extrabold text-[10px] rounded">
                          SOFT DELETED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{formatDateDMY(item.feeBillDate)}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.division}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{item.circle} Circle</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.lawyerName}</div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{item.lawyerDesignation}</div>
                    {item.assistantName && (
                      <div className="mt-1 text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded w-fit font-semibold border border-indigo-200 dark:border-indigo-800">
                        Asst: {item.assistantName} {item.assistantDesignation ? `(${item.assistantDesignation})` : ''}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.caseNumber}</div>
                    <div className="text-[11px] text-slate-500">{item.caseType} ({item.casePertainsTo})</div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                    {formatINR(item.totalFeeAmount)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border w-fit ${
                          item.paymentStatus === 'Settled'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.paymentStatus === 'Settled' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.paymentStatus}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.currentPendency}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Inspect Voucher & Print Letterhead"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!isArchived ? (
                        <>
                          <button
                            onClick={() => onAudit(item)}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors cursor-pointer"
                            title="Audit & Sanction Status"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        onRestore && (
                          <button
                            onClick={() => onRestore(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200 rounded-md transition-colors font-bold text-xs cursor-pointer"
                            title="Restore Soft Deleted Record"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
