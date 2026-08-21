'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  TrendingUp,
  Activity,
  IndianRupee,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MajorProject, MajorProjectSnapshot } from '@/app/api/major-projects/route';

interface ProjectHistoryModalProps {
  project: MajorProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [snapshots, setSnapshots] = useState<MajorProjectSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !project) return;

    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/major-projects/snapshots?projectId=${project.id}`);
        const data = await res.json();
        if (data.success && data.snapshots && data.snapshots.length > 0) {
          setSnapshots(data.snapshots);
        } else {
          // If no historical snapshots exist yet, synthesize initial baseline + current state
          const cost = Number(project.revised_cost_cr || project.project_cost_cr || 0);
          const exp = Number(project.cumm_financial_expenditure_cr || 0);
          const finPercent = cost > 0 ? Math.min(100, Math.round((exp / cost) * 100 * 10) / 10) : 0;

          const synthesized: MajorProjectSnapshot[] = [
            {
              id: 'initial',
              project_id: project.id,
              snapshot_date: project.sanction_date || project.created_at || new Date().toISOString(),
              action_source: 'MANUAL_ADD',
              progress_percent: 0,
              financial_progress_percent: 0,
              cumm_financial_expenditure_cr: 0,
              contract_cum_expenditure_cr: 0,
              progress_remarks: 'Project sanction / baseline creation',
              full_snapshot: project,
            },
            {
              id: 'current',
              project_id: project.id,
              snapshot_date: project.updated_at || new Date().toISOString(),
              action_source: 'MANUAL_EDIT',
              progress_percent: project.progress_percent || 0,
              financial_progress_percent: finPercent,
              cumm_financial_expenditure_cr: project.cumm_financial_expenditure_cr || 0,
              contract_cum_expenditure_cr: project.contract_cum_expenditure_cr || 0,
              progress_remarks: project.progress_remarks || project.stage_remarks,
              issue_land: project.issue_land,
              issue_forest: project.issue_forest,
              issue_utility: project.issue_utility,
              issue_railways: project.issue_railways,
              issue_others: project.issue_others,
              full_snapshot: project,
            },
          ];
          setSnapshots(synthesized);
        }
      } catch (err) {
        console.error('Failed to load project snapshots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Chart coordinate calculations
  const chartPoints = useMemo(() => {
    if (snapshots.length === 0) return { phyPoints: '', finPoints: '', items: [] };

    const width = 800;
    const height = 240;
    const padding = { top: 30, right: 40, bottom: 40, left: 50 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const items = snapshots.map((s, idx) => {
      const x =
        snapshots.length === 1
          ? padding.left + plotW / 2
          : padding.left + (idx / (snapshots.length - 1)) * plotW;

      const pPhy = Math.min(100, Math.max(0, Number(s.progress_percent || 0)));
      const pFin = Math.min(100, Math.max(0, Number(s.financial_progress_percent || 0)));

      const yPhy = padding.top + plotH - (pPhy / 100) * plotH;
      const yFin = padding.top + plotH - (pFin / 100) * plotH;

      // Delta compared to previous snapshot
      const prev = idx > 0 ? snapshots[idx - 1] : null;
      const deltaPhy = prev ? pPhy - Number(prev.progress_percent || 0) : 0;
      const deltaFin = prev ? pFin - Number(prev.financial_progress_percent || 0) : 0;

      return {
        ...s,
        x,
        yPhy,
        yFin,
        pPhy,
        pFin,
        deltaPhy,
        deltaFin,
      };
    });

    const phyPoints = items.map((it) => `${it.x},${it.yPhy}`).join(' ');
    const finPoints = items.map((it) => `${it.x},${it.yFin}`).join(' ');

    return { phyPoints, finPoints, items, width, height, padding, plotW, plotH };
  }, [snapshots]);

  const handleExportCSV = () => {
    if (snapshots.length === 0) return;
    const headers = [
      'Snapshot Date',
      'Action Source',
      'Physical Progress (%)',
      'Financial Progress (%)',
      'Cumulative Exp (Cr)',
      'Contract Exp (Cr)',
      'Progress Remarks',
      'Land Acquisition Issues',
      'Forest Clearance',
      'Utility Shifting',
      'Railways Clearance',
      'Other Remarks',
    ];

    const rows = snapshots.map((s) => [
      `"${s.snapshot_date ? new Date(s.snapshot_date).toLocaleDateString('en-IN') : ''}"`,
      `"${s.action_source || 'UPDATE'}"`,
      s.progress_percent || 0,
      s.financial_progress_percent || 0,
      s.cumm_financial_expenditure_cr || 0,
      s.contract_cum_expenditure_cr || 0,
      `"${(s.progress_remarks || s.stage_remarks || '').replace(/"/g, '""')}"`,
      `"${(s.issue_land || '').replace(/"/g, '""')}"`,
      `"${(s.issue_forest || '').replace(/"/g, '""')}"`,
      `"${(s.issue_utility || '').replace(/"/g, '""')}"`,
      `"${(s.issue_railways || '').replace(/"/g, '""')}"`,
      `"${(s.issue_others || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Project_${project.s_no}_History_Snapshots.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/80 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded-md">
                #{project.s_no}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-md">
                {project.division} Division
              </span>
              <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-md">
                {project.scheme}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-blue-500" /> Historical Snapshot Timeline
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
              {project.name_of_work}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Export Snapshot History CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section A: Trading-Style Progress Trendline Chart */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide text-white">
                  Physical vs. Financial Progress Time Series
                </h3>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-emerald-300 font-mono">Physical Progress (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-blue-300 font-mono">Financial Progress (%)</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 800 240" className="w-full h-56 min-w-[600px]">
                {/* Horizontal Grid lines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 30 + (240 - 70) - (pct / 100) * (240 - 70);
                  return (
                    <g key={pct}>
                      <line
                        x1="50"
                        y1={y}
                        x2="760"
                        y2={y}
                        stroke="#334155"
                        strokeDasharray={pct === 0 || pct === 100 ? '0' : '4 4'}
                        strokeWidth="1"
                      />
                      <text
                        x="42"
                        y={y + 3}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Financial Progress Line (Blue) */}
                {chartPoints.finPoints && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints.finPoints}
                  />
                )}

                {/* Physical Progress Line (Emerald) */}
                {chartPoints.phyPoints && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints.phyPoints}
                  />
                )}

                {/* Interactive Points on Trendlines */}
                {chartPoints.items.map((it, idx) => (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer transition-transform"
                  >
                    {/* Financial Marker */}
                    <circle
                      cx={it.x}
                      cy={it.yFin}
                      r={hoveredIndex === idx ? 7 : 5}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Physical Marker */}
                    <circle
                      cx={it.x}
                      cy={it.yPhy}
                      r={hoveredIndex === idx ? 7 : 5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* X-Axis Date label */}
                    <text
                      x={it.x}
                      y={240 - 10}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {it.snapshot_date
                        ? new Date(it.snapshot_date).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: '2-digit',
                          })
                        : `#${idx + 1}`}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Hovered Snapshot Tooltip Card */}
            {hoveredIndex !== null && chartPoints.items[hoveredIndex] && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      📅{' '}
                      {chartPoints.items[hoveredIndex].snapshot_date
                        ? new Date(chartPoints.items[hoveredIndex].snapshot_date).toLocaleDateString(
                            'en-IN',
                            { day: '2-digit', month: 'short', year: 'numeric' }
                          )
                        : `Snapshot #${hoveredIndex + 1}`}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md text-[10px] font-mono font-bold">
                      Source: {chartPoints.items[hoveredIndex].action_source || 'MANUAL'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] italic">
                    "{chartPoints.items[hoveredIndex].progress_remarks || 'No progress remarks recorded'}"
                  </p>
                </div>

                <div className="flex items-center gap-4 font-mono font-bold text-xs shrink-0">
                  <div className="text-emerald-400">
                    Physical: {chartPoints.items[hoveredIndex].pPhy}%
                    {chartPoints.items[hoveredIndex].deltaPhy !== 0 && (
                      <span className="text-[10px] ml-1 text-emerald-300">
                        ({chartPoints.items[hoveredIndex].deltaPhy > 0 ? '+' : ''}
                        {chartPoints.items[hoveredIndex].deltaPhy.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  <div className="text-blue-400">
                    Financial: {chartPoints.items[hoveredIndex].pFin}%
                    {chartPoints.items[hoveredIndex].deltaFin !== 0 && (
                      <span className="text-[10px] ml-1 text-blue-300">
                        ({chartPoints.items[hoveredIndex].deltaFin > 0 ? '+' : ''}
                        {chartPoints.items[hoveredIndex].deltaFin.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Historical Snapshot Data Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Historical Mutation Snapshots ({snapshots.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Chronological Audit Register
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Physical %</th>
                    <th className="py-2.5 px-3 text-right">Financial %</th>
                    <th className="py-2.5 px-3 text-right">Cumm Exp (Cr)</th>
                    <th className="py-2.5 px-3 text-right">Contract Exp (Cr)</th>
                    <th className="py-2.5 px-3">Progress Remarks / Bottlenecks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {snapshots.map((s, idx) => {
                    const prev = idx > 0 ? snapshots[idx - 1] : null;
                    const pPhy = Number(s.progress_percent || 0);
                    const prevPhy = prev ? Number(prev.progress_percent || 0) : 0;
                    const deltaPhy = prev ? pPhy - prevPhy : 0;

                    return (
                      <tr
                        key={s.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          📅{' '}
                          {s.snapshot_date
                            ? new Date(s.snapshot_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : `Record #${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${
                              s.action_source === 'EXCEL_UPLOAD'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : s.action_source === 'MANUAL_ADD'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {s.action_source || 'MANUAL'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {pPhy}%
                          {deltaPhy !== 0 && (
                            <span className="text-[10px] ml-1 font-semibold text-emerald-500">
                              (+{deltaPhy.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          {s.financial_progress_percent || 0}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          ₹{Number(s.cumm_financial_expenditure_cr || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                          ₹{Number(s.contract_cum_expenditure_cr || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate text-[11px]">
                          {s.progress_remarks || s.stage_remarks || s.detailed_stage_status || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Highways Project Time-Series Engine &bull; Mutation Audit
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHistoryModal;
