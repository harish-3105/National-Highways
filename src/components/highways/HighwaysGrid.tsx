'use client';

import React from 'react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { ArrowRight, MapPin, ShieldCheck, Ruler, Edit3, Trash2 } from 'lucide-react';

interface HighwaysGridProps {
  corridors: HighwayCorridor[];
  loading: boolean;
  onEdit: (highway: HighwayCorridor) => void;
  onDelete: (highway: HighwayCorridor) => void;
}

export const HighwaysGrid: React.FC<HighwaysGridProps> = ({
  corridors,
  loading,
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (corridors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Highways Found</h3>
        <p className="text-sm text-slate-500 mt-1">No corridors match your active search or configuration filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {corridors.map((item) => (
        <div
          key={item.id || item.road_code}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            {/* Top Header: Road Code & Lane Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-900 text-white dark:bg-blue-600 rounded-lg font-extrabold text-xs tracking-wide">
                {item.road_code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getBadgeStyle(item.configuration)}`}>
                {item.configuration}
              </span>
            </div>

            {/* Road Name */}
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mb-3" title={item.road_name}>
              {item.road_name}
            </h3>

            {/* Route Endpoints Visual */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span>{item.from_location || 'Start'}</span>
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>{item.to_location || 'End'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.length_km} km</span>
            </div>

            <div className="flex items-center gap-2">
              {(item.dlp_count || 0) > 0 && (
                <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 mr-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {item.dlp_count}
                </span>
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
          </div>
        </div>
      ))}
    </div>
  );
};
