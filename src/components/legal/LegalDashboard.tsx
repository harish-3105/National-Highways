'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LegalCaseData, CaseEntryFormData } from '@/types/legal';
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
  Scale,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CIRCLE_OPTIONS, CIRCLE_DIVISION_MAP } from '@/lib/legal/masterData';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const LegalDashboard: React.FC = () => {
  const [cases, setCases] = useState<LegalCaseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState<LegalCaseData | null>(null);
  const [selectedCaseForView, setSelectedCaseForView] = useState<LegalCaseData | null>(null);
  const [selectedCaseForDelete, setSelectedCaseForDelete] = useState<LegalCaseData | null>(null);

  // Master Data Configuration State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<LegalMasterData>({
    rawItems: [],
    circles: ['Chennai', 'Madurai', 'Salem', 'Coimbatore', 'Tirunelveli', 'Villupuram'],
    divisions: [
      'Chennai City Division',
      'Chengalpattu Division',
      'Tiruvallur Division',
      'Madurai Division',
      'Dindigul Division',
      'Theni Division',
      'Salem Division',
      'Namakkal Division',
      'Dharmapuri Division',
    ],
    categories: ['Filed Against Department', 'Filed By Department'],
    caseTypes: [
      'Writ Petition (WP)',
      'Writ Appeal (WA)',
      'Civil Revision Petition (CRP)',
      'Original Side Appeal (OSA)',
      'Special Leave Petition (SLP)',
      'Contempt Petition',
      'Civil Miscellaneous Petition (CMP)',
      'Original Suit (OS)',
    ],
    caseStatuses: ['Pending', 'Disposed', 'Stay Granted', 'Interim Order Issued', 'Dismissed', 'Allowed in Favour', 'Allowed Adverse to Dept'],
    casePertainsTo: ['GOTN', 'MoRTH', 'Both', 'NHAI'],
    natureOfCases: ['Work', 'Tender', 'Land Acquisition', 'Encroachment', 'Arbitration / Dispute', 'Service Matter / Service Rights', 'Other'],
    courtNames: [
      'High Court of Madras (Principal Seat, Chennai)',
      'High Court of Madras (Madurai Bench)',
      'Supreme Court of India (New Delhi)',
      'City Civil Court Complex, Chennai',
      'District & Sessions Court',
    ],
    lawOfficers: ['Advocate General of Tamil Nadu', 'Additional Advocate General', 'Special Government Pleader (Highways)'],
    petitionTypes: ['Review Petition', 'Contempt Petition', 'Execution Petition', 'Special Leave Petition (SLP)', 'Writ Appeal (WA)'],
    convertedCategories: ['Appealed by Department', 'Appealed by Other Party'],
    appealLevels: ['Single Bench to Division Bench (High Court)', 'District / Sub Court to High Court', 'High Court to Supreme Court of India'],
    appealCaseTypes: ['Writ Appeal (WA)', 'Civil Miscellaneous Appeal (CMA)', 'Appeal Suit (AS)', 'Special Leave Petition (SLP)'],
    appellateCourts: ['High Court of Madras (Division Bench, Principal Seat, Chennai)', 'High Court of Madras (Madurai Bench)', 'Supreme Court of India (New Delhi)'],
    condonationOfDelays: ['Pending', 'Allowed / Condoned', 'Dismissed / Rejected', 'Not Applicable / Filed In Time'],
    presentStages: ['Notice / Admission', 'Counter Affidavit Pending', 'Interim Stay / Direction in Operation', 'Arguments in Progress', 'Disposed / Final Order Issued'],
    gpOpinions: ['Pending', 'Not Recommended', 'Recommended', 'Not Required'],
    complianceStatuses: ['Complied', 'Pending'],
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
  const [filterClassification, setFilterClassification] = useState('');
  const [filterCounterStatus, setFilterCounterStatus] = useState('');
  const [filterCurrentStatus, setFilterCurrentStatus] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCircle) params.set('circle', filterCircle);
      if (filterDivision) params.set('division', filterDivision);
      if (filterClassification) params.set('classification', filterClassification);
      if (filterCurrentStatus) params.set('status', filterCurrentStatus);
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
  }, [filterCircle, filterDivision, filterClassification, filterCurrentStatus, searchTerm, showArchived]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateNew = () => {
    setSelectedCaseForEdit(null);
    setUiMode('FORM');
  };

  const handleEdit = (caseItem: LegalCaseData) => {
    setSelectedCaseForEdit(caseItem);
    setUiMode('FORM');
  };

  const handleSaveForm = async (formData: LegalCaseData) => {
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

  // Save current case AND immediately open a pre-filled Appeal Case form
  const handleSaveAndCreateAppeal = async (savedData: LegalCaseData) => {
    try {
      // 1. Save lower case
      await fetch('/api/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedData),
      });

      // 2. Prepare pre-filled Appeal Case
      const appealCaseInit: Partial<LegalCaseData> = {
        caseClassification: 'Appeal Case',
        appealInfo: {
          appealLevel: 'Single Bench to Division Bench (High Court)',
          appealCaseType: 'Writ Appeal (WA)',
          appealCaseNumber: '',
          appealYear: String(new Date().getFullYear()),
          appellateCourt: 'High Court of Madras (Division Bench, Principal Seat, Chennai)',
          appealFilingDate: savedData.appealFiledDate || '',
          limitationDueDate: '',
          delayInFilingAppeal: 'No',
          delayPeriodDays: 0,
          condonationOfDelay: 'Pending',
        },
        caseType: 'Writ Appeal (WA)',
        circle: savedData.circle,
        division: savedData.division,
        caseNumber: '',
        caseYear: String(new Date().getFullYear()),
        category: 'Filed By Department',
        nameOfCourt: 'High Court of Madras (Division Bench, Principal Seat, Chennai)',
        petitionerNames: savedData.category === 'Filed Against Department' ? savedData.respondentNames : savedData.petitionerNames,
        respondentNames: savedData.category === 'Filed Against Department' ? savedData.petitionerNames : savedData.respondentNames,
        casePertainsTo: savedData.casePertainsTo,
        natureOfCase: savedData.natureOfCase,
        briefOfPrayer: `Writ Appeal against final order dated ${savedData.finalOrderDate || 'N/A'} in ${savedData.caseNumber}: ${savedData.briefOfPrayer}`,
        presentStage: 'Notice / Admission',
        currentStatus: 'Pending',
        caRequired: 'Yes',
        caFiled: 'No',
        caDueDate: '',
        caFiledDate: '',
        complianceRequired: 'No',
        finalResult: 'No',
        adverseToDepartment: 'No',
        gpOpinion: 'Pending',
        appealFiled: 'No',
      };

      setSelectedCaseForEdit(appealCaseInit as LegalCaseData);
      setUiMode('FORM');
      fetchCases();
    } catch (err) {
      console.error('Failed to create linked appeal case:', err);
    }
  };

  // Client-side filtering
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (filterCounterStatus && c.caFiled !== filterCounterStatus) return false;
      return true;
    });
  }, [cases, filterCounterStatus]);

  // Executive KPI summary calculations
  const kpiStats = useMemo(() => {
    const total = cases.length;
    const normalCount = cases.filter((c) => c.caseClassification === 'Normal Case').length;
    const appealCount = cases.filter((c) => c.caseClassification === 'Appeal Case').length;
    const counterPending = cases.filter((c) => c.caFiled === 'No' && c.caRequired === 'Yes').length;
    const compliancePending = cases.filter((c) => c.complianceRequired === 'Yes' && c.complianceStatus === 'Pending').length;
    const adverseCount = cases.filter((c) => c.adverseToDepartment === 'Yes').length;
    const disposedCount = cases.filter((c) => c.currentStatus === 'Disposed' || c.finalResult === 'Yes').length;

    return { total, normalCount, appealCount, counterPending, compliancePending, adverseCount, disposedCount };
  }, [cases]);

  const divisionOptions = filterCircle ? CIRCLE_DIVISION_MAP[filterCircle] || [] : [];

  if (uiMode === 'FORM') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CaseEntryForm
          initialData={selectedCaseForEdit || undefined}
          masterData={masterData}
          onSave={handleSaveForm}
          onSaveAndCreateAppeal={handleSaveAndCreateAppeal}
          onCancel={() => {
            setUiMode('LIST');
            setSelectedCaseForEdit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Scale className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Legal Cases & Court Proceedings Portal</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Madras High Court, Appellate Division, NGT, and Subordinate Courts Litigation Docket & Compliance Tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            title="Configure Dropdown Master Options"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Master Config</span>
          </button>

          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showArchived
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={showArchived ? 'Hide Deleted Cases' : 'Show Deleted Cases'}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Case</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI QUADRANT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Cases */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Dockets</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{kpiStats.total}</div>
          <span className="text-[10px] text-slate-500 font-semibold">{kpiStats.normalCount} Normal &bull; {kpiStats.appealCount} Appeals</span>
        </div>

        {/* Normal Cases */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Normal Cases</span>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">{kpiStats.normalCount}</div>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-semibold">Original Petitions / Suits</span>
        </div>

        {/* Appeal Cases */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Appeal Cases</span>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">{kpiStats.appealCount}</div>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold">WA / CMA / SLP</span>
        </div>

        {/* Counter Pending */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Counter Pending</span>
          <div className="text-xl font-black text-amber-600 mt-1">{kpiStats.counterPending}</div>
          <span className="text-[10px] text-amber-500 font-semibold">Action Required</span>
        </div>

        {/* Compliance Pending */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Compliance Due</span>
          <div className="text-xl font-black text-purple-600 mt-1">{kpiStats.compliancePending}</div>
          <span className="text-[10px] text-purple-500 font-semibold">Interim / Final</span>
        </div>

        {/* Disposed / Concluded */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Disposed</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{kpiStats.disposedCount}</div>
          <span className="text-[10px] text-emerald-500 font-semibold">{kpiStats.adverseCount} Adverse Orders</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search case no, court, petitioner, prayer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Classification Filter */}
          <div>
            <SearchableSelect
              options={['All Classifications', 'Normal Case', 'Appeal Case']}
              value={filterClassification || 'All Classifications'}
              onChange={(val) => setFilterClassification(val === 'All Classifications' ? '' : val)}
              placeholder="Classification..."
            />
          </div>

          {/* Circle Filter */}
          <div>
            <SearchableSelect
              options={['All Circles', ...CIRCLE_OPTIONS]}
              value={filterCircle ? `${filterCircle}` : 'All Circles'}
              onChange={(val) => {
                setFilterCircle(val === 'All Circles' ? '' : val);
                setFilterDivision('');
              }}
              placeholder="Circle..."
            />
          </div>

          {/* Counter Status Filter */}
          <div>
            <SearchableSelect
              options={['All CA Statuses', 'CA Filed (Yes)', 'CA Pending (No)']}
              value={
                filterCounterStatus === 'Yes'
                  ? 'CA Filed (Yes)'
                  : filterCounterStatus === 'No'
                  ? 'CA Pending (No)'
                  : 'All CA Statuses'
              }
              onChange={(val) => {
                if (val.includes('Yes')) setFilterCounterStatus('Yes');
                else if (val.includes('No')) setFilterCounterStatus('No');
                else setFilterCounterStatus('');
              }}
              placeholder="Counter Status..."
            />
          </div>
        </div>
      </div>

      {/* LEGAL CASES DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Case No & Type</th>
                <th className="py-3.5 px-5">Jurisdiction</th>
                <th className="py-3.5 px-5">Parties & Prayer</th>
                <th className="py-3.5 px-5">Stage & Status</th>
                <th className="py-3.5 px-5">Counter Affidavit</th>
                <th className="py-3.5 px-5">Disposal & Appeal</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
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
                    <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">No legal cases match the current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => {
                  const isAppeal = item.caseClassification === 'Appeal Case';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Case No & Type */}
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                          {item.caseNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${
                              isAppeal
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            }`}
                          >
                            {item.caseClassification}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">Yr {item.caseYear}</span>
                        </div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.circle} Circle</div>
                        <div className="text-slate-500 text-[11px]">{item.division}</div>
                        <div className="text-slate-400 text-[10px] truncate max-w-[160px] mt-0.5">{item.nameOfCourt}</div>
                      </td>

                      {/* Parties & Prayer */}
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          vs. {item.petitionerNames || 'Petitioner'}
                        </div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                          {item.briefOfPrayer || 'Prayer brief not provided'}
                        </div>
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[10px] text-slate-600 dark:text-slate-400">
                            {item.natureOfCase}
                          </span>
                        </div>
                      </td>

                      {/* Stage & Status */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.presentStage}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.currentStatus === 'Disposed'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                          }`}
                        >
                          {item.currentStatus}
                        </span>
                      </td>

                      {/* Counter Affidavit */}
                      <td className="py-3.5 px-5">
                        {item.caFiled === 'Yes' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md border border-emerald-200 dark:border-emerald-800 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Filed {item.caFiledDate ? `(${item.caFiledDate})` : ''}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending {item.caDueDate ? `Due: ${item.caDueDate}` : ''}</span>
                          </span>
                        )}
                      </td>

                      {/* Disposal & Appeal */}
                      <td className="py-3.5 px-5">
                        {item.finalResult === 'Yes' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold text-[10px]">
                              Final Order Issued
                            </span>
                            {item.appealFiled === 'Yes' && (
                              <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                <Gavel className="w-3 h-3" /> Appeal Filed
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending Disposal</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
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

                        {/* If lower court case has appeal filed, allow 1-click appeal launch */}
                        {item.appealFiled === 'Yes' && item.caseClassification === 'Normal Case' && (
                          <button
                            onClick={() => handleSaveAndCreateAppeal(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors cursor-pointer"
                            title="Open New Appeal Case for this record"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedCaseForDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                          title="Archive Case Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          onEdit={(c) => {
            setSelectedCaseForView(null);
            handleEdit(c);
          }}
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
