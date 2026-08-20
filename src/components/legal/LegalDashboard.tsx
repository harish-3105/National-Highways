'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CaseEntryFormData } from '@/types/legal';
import CaseEntryForm from './CaseEntryForm';
import CaseViewModal from './CaseViewModal';
import DeleteLegalCaseModal from './DeleteLegalCaseModal';
import LegalMasterDataModal from './LegalMasterDataModal';
import { LegalMasterData } from '@/app/api/legal/master-data/route';
import {
  Search,
  Plus,
  FileText,
  Gavel,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Archive,
  SlidersHorizontal,
} from 'lucide-react';
import { CIRCLE_OPTIONS, CIRCLE_DIVISION_MAP } from '@/lib/legal/masterData';

export const LegalDashboard: React.FC = () => {
  const [cases, setCases] = useState<CaseEntryFormData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState<CaseEntryFormData | null>(null);
  const [selectedCaseForView, setSelectedCaseForView] = useState<CaseEntryFormData | null>(null);
  const [selectedCaseForDelete, setSelectedCaseForDelete] = useState<CaseEntryFormData | null>(null);

  // Master Data Configuration State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<LegalMasterData>({
    rawItems: [],
    circles: ['Chennai', 'Madurai', 'Salem', 'Coimbatore', 'Tirunelveli', 'Villupuram'],
    divisions: ['Chennai City Division', 'Chengalpattu Division', 'Tiruvallur Division', 'Madurai Division', 'Dindigul Division', 'Theni Division', 'Salem Division', 'Namakkal Division', 'Dharmapuri Division'],
    caseTypes: ['Writ Petition (WP)', 'Writ Appeal (WA)', 'Civil Revision Petition (CRP)', 'Original Side Appeal (OSA)', 'Special Leave Petition (SLP)', 'Contempt Petition'],
    caseStatuses: ['Pending', 'Disposed', 'Stay Granted', 'Interim Order', 'Dismissed', 'Allowed'],
    casePertainsTo: ['GOTN', 'MoRTH', 'Both', 'NHAI'],
    natureOfCases: ['Work', 'Tender', 'Land Acquisition', 'Encroachment', 'Arbitration', 'Service Matter', 'Other'],
    courtNames: ['High Court of Madras (Principal Seat, Chennai)', 'High Court of Madras (Madurai Bench)', 'Supreme Court of India (New Delhi)', 'District Court Complex'],
    lawOfficers: ['Advocate General of Tamil Nadu', 'Additional Advocate General', 'Special Government Pleader (Highways)', 'Additional Government Pleader', 'Government Advocate (Civil Side)'],
  });

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/legal/master-data');
      const data = await res.json();
      if (data && Array.isArray(data.caseTypes)) {
        setMasterData(data);
      }
    } catch (err) {
      console.warn('Legal master data fetch note:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCircle, setFilterCircle] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterCounterStatus, setFilterCounterStatus] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCircle) params.set('circle', filterCircle);
      if (filterDivision) params.set('division', filterDivision);
      if (searchTerm) params.set('search', searchTerm);
      if (showArchived) params.set('includeDeleted', 'true');

      const res = await fetch(`/api/legal?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.cases) {
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Failed to fetch legal cases:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCircle, filterDivision, searchTerm, showArchived]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateNew = () => {
    setSelectedCaseForEdit(null);
    setUiMode('FORM');
  };

  const handleEdit = (caseItem: CaseEntryFormData) => {
    setSelectedCaseForEdit(caseItem);
    setUiMode('FORM');
  };

  const handleSaveForm = async (formData: CaseEntryFormData) => {
    try {
      const res = await fetch('/api/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        fetchCases();
      }
    } catch (err) {
      console.error('Failed to save case:', err);
    } finally {
      setUiMode('LIST');
      setSelectedCaseForEdit(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterCounterStatus && c.counterAffidavitFiled !== filterCounterStatus) return false;
    return true;
  });

  const divisionOptions = filterCircle ? CIRCLE_DIVISION_MAP[filterCircle] || [] : [];

  if (uiMode === 'FORM') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CaseEntryForm
          initialData={selectedCaseForEdit || undefined}
          masterData={masterData}
          onSave={handleSaveForm}
          onCancel={() => {
            setUiMode('LIST');
            setSelectedCaseForEdit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Gavel className="w-6 h-6 text-blue-600" />
            Legal & Litigation Management Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Madras High Court, NGT, and Arbitral Tribunal litigation case records, counter-affidavits, and hearing calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCases()}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            title="Refresh Cases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsMasterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Configure Legal Cases Dropdown Options"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Master Config</span>
          </button>

          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showArchived
                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={showArchived ? 'Hide Deleted Cases' : 'Show Deleted Cases'}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Legal Case
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search case no, court, respondent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Circle Filter */}
          <select
            value={filterCircle}
            onChange={(e) => {
              setFilterCircle(e.target.value);
              setFilterDivision('');
            }}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Circles</option>
            {CIRCLE_OPTIONS.map((c) => (
              <option key={c} value={c}>{c} Circle</option>
            ))}
          </select>

          {/* Division Filter */}
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            disabled={!filterCircle}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Divisions</option>
            {divisionOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Counter Affidavit Status Filter */}
          <select
            value={filterCounterStatus}
            onChange={(e) => setFilterCounterStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Affidavit Statuses</option>
            <option value="Yes">Counter Filed</option>
            <option value="No">Counter Pending</option>
          </select>
        </div>
      </div>

      {/* Legal Cases Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Case No & Year</th>
                <th className="py-4 px-6">Circle / Division</th>
                <th className="py-4 px-6">Court & Respondent</th>
                <th className="py-4 px-6">Nature of Case</th>
                <th className="py-4 px-6">Counter Affidavit</th>
                <th className="py-4 px-6">Next Hearing</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="font-semibold text-sm">Loading legal case records...</p>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">No legal cases match the current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-blue-600 flex items-center gap-1.5">
                        <span>{item.caseNumber}</span>
                        {item.convertedCase?.enabled && (
                          <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] rounded border border-purple-200 dark:border-purple-800">
                            Converted Petition
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] font-semibold">Year {item.caseYear}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.circle} Circle</div>
                      <div className="text-slate-500 text-[11px]">{item.division}</div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.nameOfCourt}</div>
                      <div className="text-slate-500 text-[11px] truncate">{item.nameOfRespondent}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 font-bold rounded-md text-slate-700 dark:text-slate-300">
                        {item.natureOfCase}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {item.counterAffidavitFiled === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md border border-emerald-200 dark:border-emerald-800 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Filed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
                          <AlertCircle className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {item.counterAffidavitData?.nextHearingDate || 'Not Scheduled'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => setSelectedCaseForView(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                        title="View Record Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors cursor-pointer"
                        title="Edit Case Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedCaseForDelete(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                        title="Archive Case Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {selectedCaseForView && (
        <CaseViewModal
          caseData={selectedCaseForView}
          onClose={() => setSelectedCaseForView(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteLegalCaseModal
        caseData={selectedCaseForDelete}
        isOpen={!!selectedCaseForDelete}
        onClose={() => setSelectedCaseForDelete(null)}
        onSuccess={() => fetchCases()}
      />

      {/* Master Data Configuration Modal */}
      <LegalMasterDataModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterData={masterData}
        onRefresh={() => {
          fetchMasterData();
          fetchCases();
        }}
      />
    </div>
  );
};

export default LegalDashboard;

