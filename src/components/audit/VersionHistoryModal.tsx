'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  User,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Phone,
} from 'lucide-react';

interface FieldDiff {
  field: string;
  label: string;
  old_value: any;
  new_value: any;
}

interface AuditLogEntry {
  id: string;
  user_phone: string;
  user_name: string;
  user_role: string;
  user_jurisdiction: string;
  module: string;
  action: string;
  entity_id: string;
  entity_title?: string;
  changes_summary?: string;
  field_changes: FieldDiff[];
  snapshot_before?: any;
  snapshot_after?: any;
  created_at: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityTitle: string;
  module: string;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  entityId,
  entityTitle,
  module,
}: VersionHistoryModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !entityId) return;

    async function fetchHistory() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/audit?entityId=${encodeURIComponent(entityId)}&module=${encodeURIComponent(module)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load version history.');

        setLogs(data.logs || []);
        setSelectedLogIndex(0);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching revision history.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [isOpen, entityId, module]);

  if (!isOpen) return null;

  const selectedLog = logs[selectedLogIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Version & Change History
                </h3>
                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                  Google Sheets Grade
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xl">
                {entityTitle || entityId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-bold">Loading Audit Trail...</p>
            </div>
          ) : errorMsg ? (
            <div className="w-full p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-xs font-bold text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="w-full p-12 flex flex-col items-center justify-center text-center text-slate-400">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Historical Changes Found</h4>
              <p className="text-[11px] text-slate-400 mt-1">This record has not undergone any mutations since creation.</p>
            </div>
          ) : (
            <>
              {/* Left Column: Revision Timeline Sidebar */}
              <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 mb-1">
                  Revisions ({logs.length})
                </div>

                {logs.map((log, index) => {
                  const isSelected = index === selectedLogIndex;
                  const date = new Date(log.created_at);
                  const dateFormatted = date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeFormatted = date.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <button
                      key={log.id || index}
                      type="button"
                      onClick={() => setSelectedLogIndex(index)}
                      className={`w-full text-left p-2.5 rounded-xs transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          {dateFormatted}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {timeFormatted}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                        {log.user_name}
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">{log.user_role}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {log.field_changes?.length || 0} fields
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Selected Revision Red/Green Diff Inspector */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedLog && (
                  <>
                    {/* Revision Meta Passport */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xs flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Editor Identity
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
                          <span>{selectedLog.user_name}</span>
                          <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {selectedLog.user_role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 font-mono">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            +91 {selectedLog.user_phone}
                          </span>
                          <span>•</span>
                          <span>{selectedLog.user_jurisdiction}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Action & Timestamp
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {selectedLog.action}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(selectedLog.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedLog.changes_summary && (
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xs border border-blue-200 dark:border-blue-900/50">
                        <strong>Change Summary:</strong> {selectedLog.changes_summary}
                      </div>
                    )}

                    {/* Field-by-Field Red -> Green Diffs */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                        Modified Fields ({selectedLog.field_changes?.length || 0})
                      </h4>

                      {(!selectedLog.field_changes || selectedLog.field_changes.length === 0) ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xs text-center text-xs text-slate-400">
                          No granular field changes recorded for this event.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedLog.field_changes.map((diff, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xs"
                            >
                              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                                {diff.label || diff.field}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                {/* Previous Value (Red Strikethrough) */}
                                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xs">
                                  <div className="text-[9.5px] font-bold uppercase text-red-600 dark:text-red-400 mb-1">
                                    Previous Value
                                  </div>
                                  <div className="text-xs font-mono font-medium text-red-800 dark:text-red-300 break-words line-through opacity-80">
                                    {diff.old_value !== null && diff.old_value !== undefined && diff.old_value !== ''
                                      ? String(diff.old_value)
                                      : '<Empty / Unset>'}
                                  </div>
                                </div>

                                {/* New Value (Green) */}
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xs">
                                  <div className="text-[9.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                                    Updated Value
                                  </div>
                                  <div className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 break-words">
                                    {diff.new_value !== null && diff.new_value !== undefined && diff.new_value !== ''
                                      ? String(diff.new_value)
                                      : '<Empty / Cleared>'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
