'use client';

import React, { useEffect } from 'react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { X, Eye, Printer, Edit3, ArrowRight, ShieldCheck, Ruler, Layers, MapPin } from 'lucide-react';

interface ViewHighwayModalProps {
  highway: HighwayCorridor | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (highway: HighwayCorridor) => void;
}

export const ViewHighwayModal: React.FC<ViewHighwayModalProps> = ({
  highway,
  isOpen,
  onClose,
  onEdit,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !highway) return null;

  const totalLen = highway.length_km || 1;
  const lLess2l = Number(highway.length_less_than_2l) || 0;
  const l2l = Number(highway.length_2l) || 0;
  const l2lPs = Number(highway.length_2l_ps) || 0;
  const l4l = Number(highway.length_4l) || 0;
  const l6l = Number(highway.length_6l) || 0;

  const pLess2l = Math.round((lLess2l / totalLen) * 100);
  const p2l = Math.round((l2l / totalLen) * 100);
  const p2lPs = Math.round((l2lPs / totalLen) * 100);
  const p4l = Math.round((l4l / totalLen) * 100);
  const p6l = Math.round((l6l / totalLen) * 100);

  const oldNh = highway.old_nh_no && highway.old_nh_no !== '-' ? highway.old_nh_no : null;
  const newNh = highway.new_nh_no || highway.road_code.replace(/^NH-?/, '');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 print:bg-white print:border-b-2 print:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 print:hidden">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-900 text-white rounded-lg font-extrabold text-sm tracking-wide">
                  {highway.road_code}
                </span>
                {oldNh && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium text-xs border border-slate-200 dark:border-slate-700">
                    Old NH: {oldNh}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded font-bold text-xs border border-blue-200 dark:border-blue-800">
                  New NH: {newNh}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 print:text-lg">
                {highway.road_name}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Print Highway Passport"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Print</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(highway);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Edit Highway"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 print:overflow-visible">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Length</span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                <Ruler className="w-4 h-4 text-emerald-500" />
                {highway.length_km} km
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Chainage Bounds</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                Km {highway.from_chainage || '0'} → {highway.to_chainage || '0'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Primary Config</span>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1.5">
                {highway.configuration}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">DLP Warranty</span>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {highway.dlp_count || 0} Active Stretches
              </div>
            </div>
          </div>

          {/* Route Termini Visual */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl">
            <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Route Endpoints
            </h4>
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-200">
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {highway.from_location || 'Start'}
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 shrink-0 mx-2" />
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {highway.to_location || 'End'}
              </div>
            </div>
          </div>

          {/* Multi-Lane Configuration Breakdown Visual Bar */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" /> Multi-Lane Breakdown Distribution
              </h4>
              <span className="text-xs font-mono font-bold text-slate-500">Total: {highway.length_km} km</span>
            </div>

            {/* Proportion Progress Bar */}
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
              {lLess2l > 0 && (
                <div style={{ width: `${Math.max(pLess2l, 5)}%` }} className="bg-amber-400 h-full" title={`<2L: ${lLess2l}km (${pLess2l}%)`} />
              )}
              {l2l > 0 && (
                <div style={{ width: `${Math.max(p2l, 5)}%` }} className="bg-amber-500 h-full" title={`2L: ${l2l}km (${p2l}%)`} />
              )}
              {l2lPs > 0 && (
                <div style={{ width: `${Math.max(p2lPs, 5)}%` }} className="bg-emerald-500 h-full" title={`2L+PS: ${l2lPs}km (${p2lPs}%)`} />
              )}
              {l4l > 0 && (
                <div style={{ width: `${Math.max(p4l, 5)}%` }} className="bg-blue-600 h-full" title={`4L: ${l4l}km (${p4l}%)`} />
              )}
              {l6l > 0 && (
                <div style={{ width: `${Math.max(p6l, 5)}%` }} className="bg-purple-600 h-full" title={`6L: ${l6l}km (${p6l}%)`} />
              )}
            </div>

            {/* Breakdown Detail Table */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">&lt; 2-Lane</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">{lLess2l} km</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">2-Lane</span>
                <span className="font-bold text-amber-800 dark:text-amber-200">{l2l} km</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">2L + Paved Sh.</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{l2lPs} km</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">4-Lane</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{l4l} km</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">6-Lane</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{l6l} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 print:hidden">
          <span className="text-xs text-slate-400 font-mono">
            Tamil Nadu National Highways Dept &bull; Level 1 Catalog
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Passport Card
          </button>
        </div>
      </div>
    </div>
  );
};
