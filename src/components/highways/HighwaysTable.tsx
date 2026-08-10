'use client';

import React from 'react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { ArrowRight, MapPin, ShieldCheck, Edit3, Trash2, Eye } from 'lucide-react';

interface HighwaysTableProps {
  corridors: HighwayCorridor[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onView?: (highway: HighwayCorridor) => void;
  onEdit: (highway: HighwayCorridor) => void;
  onDelete: (highway: HighwayCorridor) => void;
}

export const HighwaysTable: React.FC<HighwaysTableProps> = ({
  corridors,
  loading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
}) => {
  const getBadgeStyle = (config: string) => {
    const c = config?.toLowerCase() || '';
    if (c.includes('6-lane') || c.includes('6l')) {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    if (c.includes('4-lane') || c.includes('4l')) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (c.includes('paved') || c.includes('2l+ps')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  };

  const isAllSelected =
    corridors.length > 0 && corridors.every((c) => selectedIds.includes(c.id));

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center shadow-sm">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Querying Master Highway Catalog from PostgreSQL...</p>
      </div>
    );
  }

  if (corridors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Highways Found</h3>
        <p className="text-sm text-slate-500 mt-1">
          No corridors match your active search or configuration filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-4 w-10 text-center print:hidden">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title={isAllSelected ? 'Deselect All' : 'Select All'}
                />
              </th>
              <th className="py-3.5 px-4 font-semibold">NH Numbers / Code</th>
              <th className="py-3.5 px-4 font-semibold">Corridor Title / Section</th>
              <th className="py-3.5 px-4 font-semibold">Route Endpoints</th>
              <th className="py-3.5 px-4 font-semibold">Chainage Span</th>
              <th className="py-3.5 px-4 font-semibold">Total Length</th>
              <th className="py-3.5 px-4 font-semibold">Multi-Lane Breakdown</th>
              <th className="py-3.5 px-4 font-semibold">DLP Coverage</th>
              <th className="py-3.5 px-4 font-semibold text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {corridors.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const oldNh = item.old_nh_no && item.old_nh_no !== '-' ? item.old_nh_no : null;
              const newNh = item.new_nh_no || item.road_code.replace(/^NH-?/, '');

              return (
                <tr
                  key={item.id || item.road_code}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50/80'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-4 text-center print:hidden">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* NH Numbers / Code */}
                  <td className="py-3.5 px-4 font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 print:hidden" title="Active Corridor" />
                        <span className="font-extrabold text-sm">{item.road_code}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        {oldNh && (
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Old NH {oldNh}
                          </span>
                        )}
                        <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          New NH {newNh}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Corridor Title */}
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate" title={item.road_name}>
                    {item.road_name}
                  </td>

                  {/* Route Endpoints */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.from_location || 'Start'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.to_location || 'End'}</span>
                    </div>
                  </td>

                  {/* Chainage Span */}
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                    Km {item.from_chainage || '0'} → Km {item.to_chainage || '0'}
                  </td>

                  {/* Length */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {item.length_km} km
                    </span>
                  </td>

                  {/* Multi-Lane Breakdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-[11px]">
                      {Number(item.length_less_than_2l) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 font-medium">
                          &lt;2L: {item.length_less_than_2l}km
                        </span>
                      )}
                      {Number(item.length_2l) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 font-medium">
                          2L: {item.length_2l}km
                        </span>
                      )}
                      {Number(item.length_2l_ps) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 font-medium">
                          2L+PS: {item.length_2l_ps}km
                        </span>
                      )}
                      {Number(item.length_4l) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 font-bold">
                          4L: {item.length_4l}km
                        </span>
                      )}
                      {Number(item.length_6l) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 font-bold">
                          6L: {item.length_6l}km
                        </span>
                      )}
                      {(!item.length_less_than_2l && !item.length_2l && !item.length_2l_ps && !item.length_4l && !item.length_6l) && (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getBadgeStyle(item.configuration)}`}>
                          {item.configuration}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DLP Coverage */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {(item.dlp_count || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        {item.dlp_count} Stretches
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Active DLP</span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap print:hidden">
                    <div className="flex items-center justify-end gap-1.5">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="View Passport Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer"
                        title="Edit Corridor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                        title="Soft-Delete Corridor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
