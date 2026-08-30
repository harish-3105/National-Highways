'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LegalCaseData } from '@/types/legal';
import CaseEntryForm from './CaseEntryForm';
import CaseViewModal from './CaseViewModal';
import DeleteLegalCaseModal from './DeleteLegalCaseModal';
import LegalMasterDataModal from './LegalMasterDataModal';
import { LegalMasterData } from '@/app/api/legal/master-data/route';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Archive,
  SlidersHorizontal,
  Scale,
  Sparkles,
  FileText,
  Gavel,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const LegalDashboard: React.FC = () => {
  const [cases, setCases] = useState<LegalCaseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState<LegalCaseData | null>(null);
  const [selectedCaseForView, setSelectedCaseForView] = useState<LegalCaseData | null>(null);
  const [selectedCaseForDelete, setSelectedCaseForDelete] = useState<LegalCaseData | null>(null);

  // Master Data Configuration State (100% loaded from database)
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<LegalMasterData>({
    rawItems: [],
    circles: [],
    divisions: [],
    caseTypes: [],
    caseStatuses: [],
    casePertainsTo: [],
    natureOfCases: [],
    courtNames: [],
    lawOfficers: [],
    petitionTypes: [],
    convertedCategories: [],
    appealCaseTypes: [],
    appellateCourts: [],
    condonationOfDelays: [],
    presentStages: [],
    gpOpinions: [],
    complianceStatuses: [],
  });

  const fetchMasterData = useCallback(async () => {
    try {
      const res = await fetch('/api/legal/master-data');
      const data = await res.json();
      if (data && Array.isArray(data.caseTypes)) {
        setMasterData(data);
      }
    } catch (err) {
      console.warn('Legal master data fetch note:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/legal/master-data');
        const data = await res.json();
        if (isMounted && data && Array.isArray(data.caseTypes)) {
          setMasterData(data);
        }
      } catch (err) {
        console.warn('Legal master data fetch note:', err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCircle, setFilterCircle] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterCounterStatus, setFilterCounterStatus] = useState('');
  const [filterCurrentStatus, setFilterCurrentStatus] = useState('');
  const [filterComplianceDueOnly, setFilterComplianceDueOnly] = useState(false);
  const [filterDisposedOnly, setFilterDisposedOnly] = useState(false);
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
    let isMounted = true;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (filterCircle) params.set('circle', filterCircle);
        if (filterDivision) params.set('division', filterDivision);
        if (filterClassification) params.set('classification', filterClassification);
        if (filterCurrentStatus) params.set('status', filterCurrentStatus);
        if (searchTerm) params.set('search', searchTerm);
        if (showArchived) params.set('includeDeleted', 'true');

        const res = await fetch(`/api/legal?${params.toString()}`);
        const data = await res.json();
        if (isMounted && data.success && data.cases) {
          setCases(data.cases);
        }
      } catch (err) {
        console.error('Failed to fetch legal cases:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [filterCircle, filterDivision, filterClassification, filterCurrentStatus, searchTerm, showArchived]);

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
        await fetchCases();
        setUiMode('LIST');
        setSelectedCaseForEdit(null);
      } else {
        alert('Database / Save Error: ' + (data.error || data.message || 'Failed to save case.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to save case:', err);
      alert('Error connecting to server: ' + msg);
    }
  };

  // Save current case AND immediately open a pre-filled Appeal Case form
  const handleSaveAndCreateAppeal = async (savedData: LegalCaseData) => {
    try {
      // 1. Save lower case
      const res = await fetch('/api/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedData),
      });
      const data = await res.json();
      if (!data.success) {
        alert('Database / Save Error: ' + (data.error || data.message || 'Failed to save base case before creating appeal.'));
        return;
      }

      // 2. Prepare pre-filled Appeal Case (unforced dropdowns so user selects)
      const appealCaseInit: Partial<LegalCaseData> = {
        caseClassification: 'Appeal Case',
        appealInfo: {
          appealCaseDetails: '',
          appellateCourt: '',
          appealFilingDate: savedData.appealFiledDate || '',
          limitationDueDate: '',
          delayInFilingAppeal: 'No',
          delayPeriodDays: 0,
          condonationOfDelay: '',
        },
        circle: savedData.circle || '',
        division: savedData.division || '',
        caseDetails: '',
        appealCaseDetails: '',
        nameOfCourt: '',
        petitionerNames: savedData.respondentNames || '',
        respondentNames: savedData.petitionerNames || '',
        casePertainsTo: savedData.casePertainsTo || '',
        natureOfCase: savedData.natureOfCase || '',
        briefOfPrayer: `Appeal in ${savedData.caseDetails || 'case'}: ${savedData.briefOfPrayer}`,
        baseCircle: savedData.circle || '',
        baseDivision: savedData.division || '',
        baseCourtName: savedData.nameOfCourt || '',
        baseCaseDetails: savedData.caseDetails || '',
        basePetitionerNames: savedData.petitionerNames || '',
        baseRespondentNames: savedData.respondentNames || '',
        baseCasePertainsTo: savedData.casePertainsTo || '',
        baseNatureOfCase: savedData.natureOfCase || '',
        baseBriefOfPrayer: savedData.briefOfPrayer || '',
        linkedBaseCaseId: savedData.id || '',
        presentStage: '',
        currentStatus: '',
        caRequired: '',
        caFiled: '',
        caDueDate: '',
        caFiledDate: '',
        complianceRequired: '',
        finalResult: '',
        adverseToDepartment: '',
        gpOpinion: '',
        appealFiled: '',
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
      if (filterComplianceDueOnly && !(c.complianceRequired === 'Yes' && c.complianceStatus === 'Pending')) return false;
      if (filterDisposedOnly && !(c.currentStatus === 'Disposed' || c.finalResult === 'Yes')) return false;
      return true;
    });
  }, [cases, filterCounterStatus, filterComplianceDueOnly, filterDisposedOnly]);

  // Executive KPI summary calculations
  const kpiStats = useMemo(() => {
    const total = cases.length;
    const normalCount = cases.filter((c) => c.caseClassification === 'Normal Case').length;
    const appealCount = cases.filter((c) => c.caseClassification === 'Appeal Case').length;
    const delayedAppealCount = cases.filter((c) => c.caseClassification === 'Appeal Case' && c.appealInfo?.delayInFilingAppeal === 'Yes').length;
    const counterPending = cases.filter((c) => c.caFiled === 'No' && c.caRequired === 'Yes').length;
    const counterFiledCount = cases.filter((c) => c.caFiled === 'Yes').length;
    const compliancePending = cases.filter((c) => c.complianceRequired === 'Yes' && c.complianceStatus === 'Pending').length;
    const complianceCompletedCount = cases.filter((c) => c.complianceRequired === 'Yes' && c.complianceStatus === 'Complied').length;
    const adverseCount = cases.filter((c) => c.adverseToDepartment === 'Yes').length;
    const disposedCount = cases.filter((c) => c.currentStatus === 'Disposed' || c.finalResult === 'Yes').length;
    const inFavourCount = cases.filter((c) => (c.currentStatus === 'Disposed' || c.finalResult === 'Yes') && c.adverseToDepartment === 'No').length;

    return {
      total,
      normalCount,
      appealCount,
      delayedAppealCount,
      counterPending,
      counterFiledCount,
      compliancePending,
      complianceCompletedCount,
      adverseCount,
      disposedCount,
      inFavourCount,
    };
  }, [cases]);

  const resetAllKpiFilters = () => {
    setFilterClassification('');
    setFilterCounterStatus('');
    setFilterComplianceDueOnly(false);
    setFilterDisposedOnly(false);
  };

  if (uiMode === 'FORM') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CaseEntryForm
          key={selectedCaseForEdit?.id || 'new-legal-case'}
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

  const isAllSelected = !filterClassification && !filterCounterStatus && !filterComplianceDueOnly && !filterDisposedOnly;

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

      {/* 6 EXECUTIVE KPI QUADRANT CARDS (3 Rows × 2 Columns with interactive filtering) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROW 1 - QUADRANT 1: Total Litigation Dockets */}
        <button
          type="button"
          onClick={resetAllKpiFilters}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            isAllSelected
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Total Litigation Dockets</span>
              {isAllSelected && (
                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {kpiStats.total} <span className="text-sm font-semibold text-slate-500 font-sans">Active Dockets</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            {kpiStats.normalCount} Normal Cases &bull; {kpiStats.appealCount} Appeal Proceedings
          </div>
        </button>

        {/* ROW 1 - QUADRANT 2: Normal Cases (Original Jurisdiction) */}
        <button
          type="button"
          onClick={() => {
            setFilterClassification((prev) => (prev === 'Normal Case' ? '' : 'Normal Case'));
            setFilterComplianceDueOnly(false);
            setFilterDisposedOnly(false);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            filterClassification === 'Normal Case'
              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Original Petitions & Suits</span>
              {filterClassification === 'Normal Case' && (
                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
              {kpiStats.normalCount} <span className="text-sm font-semibold text-slate-500 font-sans">Normal Cases</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            High Court, District Courts & Tribunals Original Track
          </div>
        </button>

        {/* ROW 2 - QUADRANT 3: Appellate Proceedings (WA / CMA / SLP) */}
        <button
          type="button"
          onClick={() => {
            setFilterClassification((prev) => (prev === 'Appeal Case' ? '' : 'Appeal Case'));
            setFilterComplianceDueOnly(false);
            setFilterDisposedOnly(false);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            filterClassification === 'Appeal Case'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Appellate Proceedings</span>
              {filterClassification === 'Appeal Case' && (
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-300">
              <Gavel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
              {kpiStats.appealCount} <span className="text-sm font-semibold text-slate-500 font-sans">Appeals Filed</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            {kpiStats.delayedAppealCount > 0 ? `⚠️ ${kpiStats.delayedAppealCount} With Limitation Overrun` : 'WA / CMA / SLP Forum Appeals'}
          </div>
        </button>

        {/* ROW 2 - QUADRANT 4: Counter Affidavit Pending */}
        <button
          type="button"
          onClick={() => {
            setFilterCounterStatus((prev) => (prev === 'No' ? '' : 'No'));
            setFilterComplianceDueOnly(false);
            setFilterDisposedOnly(false);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            filterCounterStatus === 'No'
              ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-orange-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Counter Affidavit Pending</span>
              {filterCounterStatus === 'No' && (
                <span className="text-[10px] font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/60 rounded-xl text-orange-700 dark:text-orange-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-orange-700 dark:text-orange-300 font-mono">
              {kpiStats.counterPending} <span className="text-sm font-semibold text-slate-500 font-sans">Pending CA</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-700 dark:text-orange-400 font-medium">
            {kpiStats.counterFiledCount} Counter Affidavits Filed & Up-to-date
          </div>
        </button>

        {/* ROW 3 - QUADRANT 5: Compliance Action Due */}
        <button
          type="button"
          onClick={() => {
            setFilterComplianceDueOnly((prev) => !prev);
            setFilterDisposedOnly(false);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            filterComplianceDueOnly
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Compliance Action Due</span>
              {filterComplianceDueOnly && (
                <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-700 dark:text-purple-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
              {kpiStats.compliancePending} <span className="text-sm font-semibold text-slate-500 font-sans">Pending Orders</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-700 dark:text-purple-400 font-medium">
            {kpiStats.complianceCompletedCount} Actions Complied &bull; Interim & Final Mandates
          </div>
        </button>

        {/* ROW 3 - QUADRANT 6: Disposed Cases & Adverse Outcomes */}
        <button
          type="button"
          onClick={() => {
            setFilterDisposedOnly((prev) => !prev);
            setFilterComplianceDueOnly(false);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            filterDisposedOnly
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Disposed & Final Orders</span>
              {filterDisposedOnly && (
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </span>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {kpiStats.disposedCount} <span className="text-sm font-semibold text-slate-500 font-sans">Concluded</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            {kpiStats.inFavourCount} In Favour &bull; {kpiStats.adverseCount} Adverse to Dept
          </div>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by case no, court, petitioner, prayer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Classification Filter */}
          <div>
            <SearchableSelect
              options={['All Classifications', 'Normal Case', 'Appeal Case']}
              value={filterClassification || 'All Classifications'}
              onChange={(val) => setFilterClassification(val === 'All Classifications' ? '' : val)}
            />
          </div>

          {/* Circle Filter */}
          <div>
            <SearchableSelect
              options={['All Circles', ...(masterData?.circles || [])]}
              value={filterCircle ? `${filterCircle}` : 'All Circles'}
              onChange={(val) => {
                setFilterCircle(val === 'All Circles' ? '' : val);
                setFilterDivision('');
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <SearchableSelect
              options={['All Statuses', ...(masterData?.caseStatuses || [])]}
              value={filterCurrentStatus || 'All Statuses'}
              onChange={(val) => setFilterCurrentStatus(val === 'All Statuses' ? '' : val)}
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
                          {item.caseDetails || '—'}
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
