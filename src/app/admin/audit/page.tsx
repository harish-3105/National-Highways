'use client';

import React, { useState, useEffect } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import {
  History,
  Search,
  Filter,
  Download,
  Phone,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { VersionHistoryModal } from '@/components/audit/VersionHistoryModal';
import * as XLSX from 'xlsx';

interface AuditLogItem {
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
  field_changes: any[];
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 30;

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  // Selected Log for Inspector Modal
  const [inspectEntity, setInspectEntity] = useState<{ id: string; title: string; module: string } | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('userPhone', searchTerm);
      if (moduleFilter) params.set('module', moduleFilter);
      if (actionFilter) params.set('action', actionFilter);
      params.set('limit', String(limit));
      params.set('offset', String((page - 1) * limit));

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit trail.');

      setLogs(data.logs || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const exportToExcel = async () => {
    if (isExporting || totalCount === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    setErrorMsg('');

    try {
      const exportBatchSize = 1000;
      let offset = 0;
      let allLogs: AuditLogItem[] = [];
      let totalExpected = totalCount;

      while (true) {
        const params = new URLSearchParams();
        if (searchTerm) params.set('userPhone', searchTerm);
        if (moduleFilter) params.set('module', moduleFilter);
        if (actionFilter) params.set('action', actionFilter);
        params.set('limit', String(exportBatchSize));
        params.set('offset', String(offset));

        const res = await fetch(`/api/audit?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch audit records for export.');
        }

        const batch: AuditLogItem[] = data.logs || [];
        allLogs = allLogs.concat(batch);
        totalExpected = data.totalCount ?? totalExpected;
        setExportProgress(allLogs.length);

        if (batch.length === 0 || allLogs.length >= totalExpected) {
          break;
        }

        offset += exportBatchSize;
      }

      if (allLogs.length === 0) {
        throw new Error('No audit log records found to export.');
      }

      const rows = allLogs.map((l) => ({
        Timestamp: new Date(l.created_at).toLocaleString('en-IN'),
        'Officer Name': l.user_name,
        'Mobile Phone': l.user_phone,
        Role: l.user_role,
        Jurisdiction: l.user_jurisdiction,
        Module: l.module,
        Action: l.action,
        'Entity ID': l.entity_id,
        'Entity Name': l.entity_title || '',
        'Changes Summary': l.changes_summary || '',
        'Fields Modified Count': l.field_changes?.length || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Log');
      XLSX.writeFile(workbook, `TNHighways_Statewide_Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Audit export failed:', err);
      setErrorMsg(err.message || 'Audit export failed.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xs">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Statewide Vigilance & Audit Log
              </h1>
              <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                Immutable Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Tamper-proof chronological trail of all user mutations, logins, and field-level changes across all 8 modules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={isExporting}
              className="p-2 rounded-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              disabled={isExporting || totalCount === 0 || logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xs transition-colors cursor-pointer shadow-xs"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {exportProgress !== null
                      ? `Exporting... (${exportProgress}${totalCount > 0 ? ` / ${totalCount}` : ''} rows)`
                      : 'Exporting...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Audit (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs p-4 mb-6 shadow-xs flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[240px] flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Mobile Phone (e.g. 9840123456)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xs transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs"
            >
              <option value="">All Modules</option>
              <option value="ONGOING_WORKS">Ongoing Works</option>
              <option value="DLP">DLP Maintenance</option>
              <option value="LEGAL">Legal Cases</option>
              <option value="FEE_BILLS">Fee Bills</option>
              <option value="HIGHWAYS">Highways Catalog</option>
              <option value="STAFF">Staff Directory</option>
              <option value="ROLES">Roles & Permissions</option>
              <option value="SYSTEM">System & Lockdown</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="RESTORE">RESTORE</option>
              <option value="LOCKDOWN_TOGGLE">LOCKDOWN TOGGLE</option>
            </select>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xs text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff Officer</th>
                  <th className="py-3 px-4">Module & Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Change Summary</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading Audit Log...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      No audit log records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const date = new Date(log.created_at);
                    const formattedDate = date.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{formattedDate}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formattedTime}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{log.user_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                            <span>+91 {log.user_phone}</span>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{log.user_role}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {log.module}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-xs text-[9.5px] font-extrabold ${
                                log.action === 'CREATE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : log.action === 'DELETE'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : log.action === 'LOCKDOWN_TOGGLE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {log.action}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={log.entity_title || log.entity_id}>
                            {log.entity_title || log.entity_id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">ID: {log.entity_id}</div>
                        </td>

                        <td className="py-3 px-4 max-w-sm">
                          <div className="text-xs text-slate-600 dark:text-slate-300 truncate" title={log.changes_summary}>
                            {log.changes_summary || 'No summary'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {log.field_changes?.length || 0} fields modified
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setInspectEntity({
                                id: log.entity_id,
                                title: log.entity_title || log.entity_id,
                                module: log.module,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xs border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Diff</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
            <span>
              Showing {Math.min(logs.length, limit)} of {totalCount} log entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded-xs border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                Page {page} of {Math.max(1, Math.ceil(totalCount / limit))}
              </span>
              <button
                type="button"
                disabled={page * limit >= totalCount}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-xs border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* In-Modal Inspector */}
      {inspectEntity && (
        <VersionHistoryModal
          isOpen={true}
          onClose={() => setInspectEntity(null)}
          entityId={inspectEntity.id}
          entityTitle={inspectEntity.title}
          module={inspectEntity.module}
        />
      )}
    </div>
  );
}
