'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HighwayCorridor } from '@/app/api/highways/route';
import { SubChainageStretch } from '@/app/api/sub-chainages/route';
import {
  X,
  Eye,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Ruler,
  Layers,
  MapPin,
  Activity,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  BarChart2,
  GitCommit,
  Archive,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

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
  const [subChainages, setSubChainages] = useState<SubChainageStretch[]>([]);
  const [loadingSub, setLoadingSub] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'MACRO_PCU' | 'MICRO_LANE'>('MACRO_PCU');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Form states for adding/editing a sub-stretch
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subFromKm, setSubFromKm] = useState<string>('');
  const [subToKm, setSubToKm] = useState<string>('');
  const [subLaneConfig, setSubLaneConfig] = useState<string>('2-Lane');
  const [subPcu, setSubPcu] = useState<string>('0');
  const [subDivision, setSubDivision] = useState<string>('');
  const [subDpr, setSubDpr] = useState<string>('');
  const [subTown, setSubTown] = useState<string>('');
  const [subRowWidth, setSubRowWidth] = useState<string>('');
  const [subCarriagewayWidth, setSubCarriagewayWidth] = useState<string>('');
  const [subFormError, setSubFormError] = useState<string>('');
  const [subFormLoading, setSubFormLoading] = useState<boolean>(false);

  // Soft Delete Modal State
  const [deletingSub, setDeletingSub] = useState<SubChainageStretch | null>(null);
  const [softDeleteLoading, setSoftDeleteLoading] = useState<boolean>(false);

  const fetchSubChainages = useCallback(async () => {
    if (!highway) return;
    try {
      setLoadingSub(true);
      const res = await fetch(
        `/api/sub-chainages?code=${encodeURIComponent(highway.road_code)}&type=${activeTab}&includeDeleted=${showArchived}`
      );
      const data = await res.json();
      if (data.success) {
        setSubChainages(data.subChainages || []);
      }
    } catch (err) {
      console.error('Failed to fetch sub-chainages:', err);
    } finally {
      setLoadingSub(false);
    }
  }, [highway, activeTab, showArchived]);

  useEffect(() => {
    if (isOpen && highway) {
      fetchSubChainages();
      setIsFormOpen(false);
      setEditingSubId(null);
      setDeletingSub(null);
    }
  }, [isOpen, highway, fetchSubChainages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (deletingSub) {
          setDeletingSub(null);
        } else if (isFormOpen) {
          setIsFormOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormOpen, deletingSub, onClose]);

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

  const getPcuBadge = (pcu: number) => {
    if (!pcu || pcu <= 0) {
      return {
        label: 'Unmeasured',
        style: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };
    }
    if (pcu < 5000) {
      return {
        label: `Normal (${pcu.toLocaleString()} PCU)`,
        style: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (pcu <= 15000) {
      return {
        label: `Moderate (${pcu.toLocaleString()} PCU)`,
        style: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    return {
      label: `High Congestion (${pcu.toLocaleString()} PCU)`,
      style: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 font-bold',
    };
  };

  const handleOpenAddSubForm = () => {
    if (isFormOpen && editingSubId === null) {
      setIsFormOpen(false);
      return;
    }
    setEditingSubId(null);
    setSubFromKm('');
    setSubToKm('');
    setSubLaneConfig(activeTab === 'MICRO_LANE' ? '2-Lane' : 'Primary');
    setSubPcu('0');
    setSubDivision('');
    setSubDpr('');
    setSubTown('');
    setSubRowWidth('');
    setSubCarriagewayWidth('');
    setSubFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditSubForm = (sub: SubChainageStretch) => {
    if (isFormOpen && editingSubId === sub.id) {
      setIsFormOpen(false);
      setEditingSubId(null);
      return;
    }
    setEditingSubId(sub.id);
    setSubFromKm(String(sub.from_km));
    setSubToKm(String(sub.to_km));
    setSubLaneConfig(sub.lane_configuration || '2-Lane');
    setSubPcu(String(sub.pcu_count || 0));
    setSubDivision(sub.division_name || '');
    setSubDpr(sub.dpr_status || '');
    setSubTown(sub.important_town || '');
    setSubRowWidth(sub.row_width || '');
    setSubCarriagewayWidth(sub.carriageway_width || '');
    setSubFormError('');
    setIsFormOpen(true);
  };

  const handleSaveSubForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubFormError('');

    const fromNum = parseFloat(subFromKm);
    const toNum = parseFloat(subToKm);

    if (isNaN(fromNum) || isNaN(toNum) || toNum <= fromNum) {
      setSubFormError('Valid chainage range (To Km > From Km) is required.');
      return;
    }

    try {
      setSubFormLoading(true);
      const res = await fetch('/api/sub-chainages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubId || undefined,
          highway_code: highway.road_code,
          breakdown_type: activeTab,
          division_name: subDivision,
          from_km: fromNum,
          to_km: toNum,
          length_km: Math.round((toNum - fromNum) * 1000) / 1000,
          lane_configuration: subLaneConfig,
          pcu_count: Number(subPcu) || 0,
          dpr_status: subDpr,
          important_town: subTown,
          row_width: subRowWidth,
          carriageway_width: subCarriagewayWidth,
          delete_status: 'ACTIVE',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsFormOpen(false);
        setEditingSubId(null);
        fetchSubChainages();
      } else {
        setSubFormError(data.message || 'Failed to save sub-stretch.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubFormError(`Server error: ${msg}`);
    } finally {
      setSubFormLoading(false);
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deletingSub) return;
    try {
      setSoftDeleteLoading(true);
      const res = await fetch(`/api/sub-chainages?id=${deletingSub.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeletingSub(null);
        fetchSubChainages();
      }
    } catch (err) {
      console.error('Failed to soft delete sub-chainage:', err);
    } finally {
      setSoftDeleteLoading(false);
    }
  };

  const handleRestoreSub = async (sub: SubChainageStretch) => {
    try {
      const res = await fetch('/api/sub-chainages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sub,
          delete_status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubChainages();
      }
    } catch (err) {
      console.error('Failed to restore sub-chainage:', err);
    }
  };

  const renderSubForm = (isInline = false) => (
    <form
      onSubmit={handleSaveSubForm}
      className={`p-4 bg-slate-100 dark:bg-slate-800/90 rounded-xl border space-y-3 animate-in fade-in duration-200 ${
        isInline
          ? 'border-blue-500/80 dark:border-blue-500/80 ring-2 ring-blue-500/20 shadow-md my-2'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isInline ? 'bg-blue-500' : 'bg-emerald-500'}`} />
          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            {editingSubId
              ? `Edit ${activeTab === 'MACRO_PCU' ? 'Traffic Census' : 'Lane Geometry'} Stretch`
              : `Add New ${activeTab === 'MACRO_PCU' ? 'Traffic Census' : 'Lane Geometry'} Stretch`}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            setEditingSubId(null);
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
          title="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {subFormError && (
        <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded text-xs flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{subFormError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">From Km</label>
          <input
            type="number"
            step="0.001"
            placeholder="0.0"
            value={subFromKm}
            onChange={(e) => setSubFromKm(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">To Km</label>
          <input
            type="number"
            step="0.001"
            placeholder="22.0"
            value={subToKm}
            onChange={(e) => setSubToKm(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Lane Status</label>
          <SearchableSelect
            options={['2-Lane', '2L+PS', '4-Lane', '4L+PS', '6-Lane', '<2-Lane', 'Primary']}
            value={subLaneConfig}
            onChange={setSubLaneConfig}
            placeholder="Select Lane Config..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Traffic PCU Count</label>
          <input
            type="number"
            placeholder="e.g. 57428"
            value={subPcu}
            onChange={(e) => setSubPcu(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Important Town / Landmark</label>
          <input
            type="text"
            placeholder="e.g. Kurinjipadi, Virudhachalam"
            value={subTown}
            onChange={(e) => setSubTown(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">ROW Width (Right of Way)</label>
          <input
            type="text"
            placeholder="e.g. 24m-28m or 18m"
            value={subRowWidth}
            onChange={(e) => setSubRowWidth(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Carriageway Width Detail</label>
          <input
            type="text"
            placeholder="e.g. 7m, 10m, 14m, 15.6m"
            value={subCarriagewayWidth}
            onChange={(e) => setSubCarriagewayWidth(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">Division Name</label>
          <input
            type="text"
            placeholder="e.g. Coimbatore"
            value={subDivision}
            onChange={(e) => setSubDivision(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">DPR Status / Remarks</label>
          <input
            type="text"
            placeholder="e.g. DPR for 4-laning proposed..."
            value={subDpr}
            onChange={(e) => setSubDpr(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            setEditingSubId(null);
          }}
          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={subFormLoading}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
        >
          {subFormLoading ? 'Saving...' : editingSubId ? 'Update Stretch' : 'Save Stretch'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
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
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                {highway.road_name}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(highway);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Edit Master Highway"
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

        {/* Modal Body - Natural Scrolling Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs md:text-sm">
          {/* SECTION 1: LEVEL 1 MASTER SUMMARY CARDS */}
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
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {lLess2l} km <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">({pLess2l}%)</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">2-Lane</span>
                <span className="font-bold text-amber-800 dark:text-amber-200">
                  {l2l} km <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">({p2l}%)</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">2L + Paved Sh.</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {l2lPs} km <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">({p2lPs}%)</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">4-Lane</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {l4l} km <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">({p4l}%)</span>
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">6-Lane</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {l6l} km <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">({p6l}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: LEVEL 2 DUAL-SHEET SUB-CHAINAGE & PCU BREAKDOWN ADDON */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Level 2: Sub-Chainages & Traffic PCU Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Select view mode to switch between macro traffic census ranges and micro lane geometry
                </p>
              </div>

              {/* View Mode Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('MACRO_PCU')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'MACRO_PCU'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Macro Traffic Census</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('MICRO_LANE')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'MICRO_LANE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Micro Lane Geometry</span>
                </button>
              </div>
            </div>

            {/* Sub-Header Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'MACRO_PCU' ? (
                  <span>Sheet &apos;PCU &apos;: Executive Traffic Census Ranges &amp; DPR Widening Proposals</span>
                ) : (
                  <span>Sheet &apos;NH&apos;: Granular Carriageway Lane-Width Geometry Breakdown</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View SLD Diagram Button */}
                <Link
                  href={`/highways/${encodeURIComponent(highway.road_code)}/sld`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Open Web Interactive Straight-Line Diagram (SLD)"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>View SLD Timeline</span>
                </Link>

                {/* Archive Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    showArchived
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
                </button>

                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-800">
                  {subChainages.length} Stretches
                </span>

                <button
                  onClick={handleOpenAddSubForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stretch
                </button>
              </div>
            </div>

            {/* Quick Add Form Overlay on top (Only rendered when adding a new stretch) */}
            {isFormOpen && editingSubId === null && renderSubForm(false)}

            {/* Sub-chainage Stretches List */}
            {loadingSub ? (
              <div className="p-6 text-center text-slate-500">
                <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Loading Level 2 Sub-Chainage Breakdown...</p>
              </div>
            ) : subChainages.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No {activeTab === 'MACRO_PCU' ? 'Macro Traffic Census' : 'Micro Lane Geometry'} Stretches Found
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                  Upload <code className="text-blue-600 font-mono">Lane wise PCU Details.xlsx</code> in the Data Ingestion Engine or click <strong>&quot;+ Add Stretch&quot;</strong> above to start adding granular chainage stretches.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {subChainages.map((sub, idx) => {
                  const isDeleted = sub.delete_status === 'DELETED' || sub.delete_status === 'SOFT_DELETE';
                  const isEditingThis = isFormOpen && editingSubId === sub.id;
                  const pcuBadge = getPcuBadge(sub.pcu_count);
                  return (
                    <React.Fragment key={sub.id || idx}>
                      <div
                        className={`p-3 border rounded-xl transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isEditingThis
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                            : isDeleted
                            ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 opacity-75'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {/* Left: Chainage Span, Length, Lane, Town, ROW & Division */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                                isDeleted
                                  ? 'bg-red-100 text-red-700 border-red-300 line-through'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              Km {sub.from_km} → Km {sub.to_km}
                            </span>

                            <span className={`font-extrabold text-xs ${isDeleted ? 'text-red-700 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                              ({sub.length_km} km)
                            </span>

                            {isDeleted && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-600 text-white uppercase tracking-wider">
                                Soft Deleted
                              </span>
                            )}

                            {sub.lane_configuration && sub.lane_configuration !== 'Primary' && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {sub.lane_configuration}
                              </span>
                            )}

                            {sub.important_town && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                📍 {sub.important_town}
                              </span>
                            )}

                            {sub.row_width && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                ROW: {sub.row_width}
                              </span>
                            )}

                            {sub.carriageway_width && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Width: {sub.carriageway_width}
                              </span>
                            )}

                            {sub.division_name && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Div: {sub.division_name}
                              </span>
                            )}
                          </div>

                          {/* DPR Remarks */}
                          {sub.dpr_status && (
                            <p className={`text-[11px] line-clamp-3 italic ${isDeleted ? 'text-red-600/70' : 'text-slate-600 dark:text-slate-400'}`}>
                              &quot;{sub.dpr_status}&quot;
                            </p>
                          )}
                        </div>

                        {/* Right: Traffic PCU Badge & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${pcuBadge.style}`}>
                            {pcuBadge.label}
                          </span>

                          <div className="flex items-center gap-1">
                            {isDeleted ? (
                              <button
                                onClick={() => handleRestoreSub(sub)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg cursor-pointer"
                                title="Restore Stretch to Active View"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenEditSubForm(sub)}
                                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                    isEditingThis
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60'
                                  }`}
                                  title={isEditingThis ? 'Close Edit Form' : 'Edit Stretch'}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingSub(sub)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer transition-colors"
                                  title="Soft Delete Stretch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inline Edit Form directly beneath the active stretch */}
                      {isEditingThis && (
                        <div className="pl-2 sm:pl-3 border-l-2 border-blue-500 my-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          {renderSubForm(true)}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs text-slate-400 font-mono">
            Tamil Nadu National Highways Dept &bull; Level 1 Catalog &amp; Level 2 Dual-Sheet Breakdown
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Passport Card
          </button>
        </div>

        {/* MODERN SOFT DELETE CONFIRMATION OVERLAY MODAL */}
        {deletingSub && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Confirm Soft Delete
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This sub-stretch will be marked as <code className="text-red-600 font-bold bg-red-50 dark:bg-red-950/60 px-1 py-0.5 rounded">DELETED</code> in Supabase.
                  </p>
                </div>
              </div>

              {/* Stretch Details Preview Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span className="font-mono text-blue-700 dark:text-blue-300">
                    Km {deletingSub.from_km} → Km {deletingSub.to_km} ({deletingSub.length_km} km)
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">
                    {deletingSub.lane_configuration || '2-Lane'}
                  </span>
                </div>
                {deletingSub.division_name && (
                  <div className="text-slate-500 font-semibold">
                    Division: {deletingSub.division_name}
                  </div>
                )}
                {deletingSub.dpr_status && (
                  <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2">
                    &quot;{deletingSub.dpr_status}&quot;
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Soft Delete Protocol</strong>: The data remains safely preserved in your database for audit logs. You can toggle <em>&quot;Show Archived&quot;</em> anytime to restore it.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingSub(null)}
                  disabled={softDeleteLoading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSoftDelete}
                  disabled={softDeleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{softDeleteLoading ? 'Soft Deleting...' : 'Confirm Soft Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
