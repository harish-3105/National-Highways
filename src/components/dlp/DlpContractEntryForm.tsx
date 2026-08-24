'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  AlertCircle,
  FileText,
  MapPin,
  Layers,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
  Check,
  Briefcase,
} from 'lucide-react';
import { DLPContractItem, DLPSubContract } from '@/app/dlp/page';
import { DlpMasterData } from '@/app/api/dlp/master-data/route';
import {
  DLP_CIRCLE_OPTIONS,
  DLP_CIRCLE_DIVISION_MAP,
  getCircleForDivision,
} from '@/lib/dlp/masterData';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface DlpContractEntryFormProps {
  initialData?: Partial<DLPContractItem>;
  masterData?: DlpMasterData;
  onSave: (contractData: Partial<DLPContractItem>) => Promise<void> | void;
  onCancel: () => void;
}

type DlpStageType =
  | 'corridor_jurisdiction'
  | 'execution_terms'
  | 'category_breakdown'
  | 'child_subcontracts';

interface StageDefinition {
  id: DlpStageType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'corridor_jurisdiction',
    label: 'Corridor & Jurisdiction',
    step: 'Stage 1',
    subtitle: 'Corridor code, administrative circle, division and chainage boundaries',
    icon: MapPin,
  },
  {
    id: 'execution_terms',
    label: 'Execution & Terms',
    step: 'Stage 2',
    subtitle: 'Contractor agency, procurement mode, DOC date and DLP guarantee expiry',
    icon: Briefcase,
  },
  {
    id: 'category_breakdown',
    label: 'Category Breakdown',
    step: 'Stage 3',
    subtitle: 'Breakdown of DLP, STMC, PBMC, construction and uncontracted stretches',
    icon: Layers,
  },
  {
    id: 'child_subcontracts',
    label: 'Child Sub-Contracts',
    step: 'Stage 4',
    subtitle: 'Granular 1-to-N child packages, contractor assignments and validity',
    icon: ShieldCheck,
  },
];

export const DlpContractEntryForm: React.FC<DlpContractEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onCancel,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  const initialCircle = (initialData?.division_name
    ? getCircleForDivision(initialData.division_name)
    : '') || '';

  // Stage 1: Corridor & Jurisdiction
  const [highwayCode, setHighwayCode] = useState<string>(initialData?.highway_code || '');
  const [circleName, setCircleName] = useState<string>(initialCircle);
  const [divisionName, setDivisionName] = useState<string>(initialData?.division_name || '');
  const [stretchName, setStretchName] = useState<string>(initialData?.stretch_name || '');
  const [fromKm, setFromKm] = useState<string>(
    initialData?.from_km !== undefined && initialData?.from_km !== null ? String(initialData.from_km) : ''
  );
  const [toKm, setToKm] = useState<string>(
    initialData?.to_km !== undefined && initialData?.to_km !== null ? String(initialData.to_km) : ''
  );

  // Stage 2: Primary Execution Contract & Terms
  const [contractorName, setContractorName] = useState<string>(initialData?.contractor_name || '');
  const [contractMode, setContractMode] = useState<string>(initialData?.contract_mode || '');
  const [workDescription, setWorkDescription] = useState<string>(initialData?.work_description || '');
  const [docDate, setDocDate] = useState<string>(initialData?.doc_date || '');
  const [dlpExpiryDate, setDlpExpiryDate] = useState<string>(initialData?.dlp_expiry_date || '');

  // Stage 3: Complete Breakdown Category Inputs
  const [dlpContractCount, setDlpContractCount] = useState<string>(
    initialData?.dlp_contract_count !== undefined ? String(initialData.dlp_contract_count) : '0'
  );
  const [dlpLengthKm, setDlpLengthKm] = useState<string>(
    initialData?.dlp_length_km !== undefined ? String(initialData.dlp_length_km) : '0'
  );
  const [dlpChainage, setDlpChainage] = useState<string>(initialData?.dlp_chainage || '');

  const [stmcContractCount, setStmcContractCount] = useState<string>(
    initialData?.stmc_contract_count !== undefined ? String(initialData.stmc_contract_count) : '0'
  );
  const [stmcLengthKm, setStmcLengthKm] = useState<string>(
    initialData?.stmc_length_km !== undefined ? String(initialData.stmc_length_km) : '0'
  );
  const [stmcChainage, setStmcChainage] = useState<string>(initialData?.stmc_chainage || '');
  const [stmcExpiryDate, setStmcExpiryDate] = useState<string>(initialData?.stmc_expiry_date || '');

  const [constructionProjectCount, setConstructionProjectCount] = useState<string>(
    initialData?.construction_project_count !== undefined
      ? String(initialData.construction_project_count)
      : '0'
  );
  const [constructionLengthKm, setConstructionLengthKm] = useState<string>(
    initialData?.construction_length_km !== undefined
      ? String(initialData.construction_length_km)
      : '0'
  );
  const [constructionChainage, setConstructionChainage] = useState<string>(
    initialData?.construction_chainage || ''
  );

  const [pbmcProjectCount, setPbmcProjectCount] = useState<string>(
    initialData?.pbmc_project_count !== undefined ? String(initialData.pbmc_project_count) : '0'
  );
  const [pbmcLengthKm, setPbmcLengthKm] = useState<string>(
    initialData?.pbmc_length_km !== undefined ? String(initialData.pbmc_length_km) : '0'
  );
  const [pbmcChainage, setPbmcChainage] = useState<string>(initialData?.pbmc_chainage || '');
  const [pbmcExpiryDate, setPbmcExpiryDate] = useState<string>(initialData?.pbmc_expiry_date || '');

  const [noDlpLengthKm, setNoDlpLengthKm] = useState<string>(
    initialData?.no_dlp_length_km !== undefined ? String(initialData.no_dlp_length_km) : '0'
  );
  const [noDlpChainage, setNoDlpChainage] = useState<string>(initialData?.no_dlp_chainage || '');
  const [noDlpExpiryDate, setNoDlpExpiryDate] = useState<string>(initialData?.no_dlp_expiry_date || '');

  const [uncontractedAfter2027Km, setUncontractedAfter2027Km] = useState<string>(
    initialData?.uncontracted_after_2027_km !== undefined
      ? String(initialData.uncontracted_after_2027_km)
      : '0'
  );

  // Stage 4: 1-to-N Granular Child Sub-Contracts Dynamic Repeater List
  const [subContracts, setSubContracts] = useState<DLPSubContract[]>(
    initialData?.sub_contracts || []
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const circleOptions = masterData?.circles && masterData.circles.length > 0
    ? masterData.circles
    : DLP_CIRCLE_OPTIONS;

  const divisionOptions = circleName
    ? (DLP_CIRCLE_DIVISION_MAP[circleName] || masterData?.divisions || [])
    : (masterData?.divisions && masterData.divisions.length > 0 ? masterData.divisions : Object.values(DLP_CIRCLE_DIVISION_MAP).flat());

  const contractModes = masterData?.contractModes && masterData.contractModes.length > 0
    ? masterData.contractModes
    : ['EPC', 'STMC', 'PBMC', 'BOT', 'HAM', 'Annual Plan', 'Special Repairs', 'Departmental'];

  const maintenanceTypes = masterData?.maintenanceTypes && masterData.maintenanceTypes.length > 0
    ? masterData.maintenanceTypes
    : ['DLP', 'STMC', 'PBMC', 'CONSTRUCTION', 'NO_DLP', 'UNCONTRACTED'];

  const handleCircleChange = (c: string) => {
    setCircleName(c);
    setDivisionName('');
    if (errors.circleName) setErrors((prev) => ({ ...prev, circleName: '' }));
  };

  const handleAddSubContract = () => {
    const newSub: DLPSubContract = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      maintenance_type: 'DLP',
      sub_stretch_title: '',
      from_km: 0,
      to_km: 0,
      length_km: 0,
      contractor_name: contractorName || '',
      expiry_date: dlpExpiryDate || '',
      remarks: '',
    };
    setSubContracts((prev) => [...prev, newSub]);
  };

  const handleRemoveSubContract = (index: number) => {
    setSubContracts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSubContract = (index: number, field: keyof DLPSubContract, value: unknown) => {
    setSubContracts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'from_km' || field === 'to_km') {
        const f = Number(field === 'from_km' ? value : updated[index].from_km) || 0;
        const t = Number(field === 'to_km' ? value : updated[index].to_km) || 0;
        updated[index].length_km = Math.max(0, Math.round((t - f) * 1000) / 1000);
      }
      return updated;
    });
  };

  const calculatedLength =
    fromKm !== '' && toKm !== '' ? Math.max(0, Math.round((Number(toKm) - Number(fromKm)) * 1000) / 1000) : 0;

  // -------------------------------------------------------------
  // STAGE-GATED VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Corridor & Jurisdiction (Baseline)
      if (!highwayCode.trim()) {
        stageErrors.highwayCode = 'Highway Code is required (Stage 1).';
      }
      if (!circleName.trim()) {
        stageErrors.circleName = 'Circle selection is required (Stage 1).';
      }
      if (!divisionName.trim()) {
        stageErrors.divisionName = 'Division selection is required (Stage 1).';
      }
      if (fromKm === '' || isNaN(Number(fromKm)) || Number(fromKm) < 0) {
        stageErrors.fromKm = 'Valid From Km is required (Stage 1).';
      }
      if (toKm === '' || isNaN(Number(toKm))) {
        stageErrors.toKm = 'Valid To Km is required (Stage 1).';
      } else if (Number(toKm) < Number(fromKm)) {
        stageErrors.toKm = 'To Km cannot be less than From Km (Stage 1).';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Execution Contract & Terms
      if (!contractorName.trim()) {
        stageErrors.contractorName = 'Contractor Name is required (Stage 2).';
      }
      if (!contractMode.trim()) {
        stageErrors.contractMode = 'Contract Mode is required (Stage 2).';
      }
      if (!docDate) {
        stageErrors.docDate = 'Date of Commencement (DOC) is required (Stage 2).';
      }
      if (!dlpExpiryDate) {
        stageErrors.dlpExpiryDate = 'DLP Expiry Date is required (Stage 2).';
      }
    } else if (stageIdx === 2) {
      // Stage 3: Breakdown Categories
      if (dlpLengthKm && (isNaN(Number(dlpLengthKm)) || Number(dlpLengthKm) < 0)) {
        stageErrors.dlpLengthKm = 'DLP Length must be a non-negative number.';
      }
      if (stmcLengthKm && (isNaN(Number(stmcLengthKm)) || Number(stmcLengthKm) < 0)) {
        stageErrors.stmcLengthKm = 'STMC Length must be a non-negative number.';
      }
      if (constructionLengthKm && (isNaN(Number(constructionLengthKm)) || Number(constructionLengthKm) < 0)) {
        stageErrors.constructionLengthKm = 'Construction Length must be a non-negative number.';
      }
      if (pbmcLengthKm && (isNaN(Number(pbmcLengthKm)) || Number(pbmcLengthKm) < 0)) {
        stageErrors.pbmcLengthKm = 'PBMC Length must be a non-negative number.';
      }
      if (noDlpLengthKm && (isNaN(Number(noDlpLengthKm)) || Number(noDlpLengthKm) < 0)) {
        stageErrors.noDlpLengthKm = 'Non-DLP Length must be a non-negative number.';
      }
      if (uncontractedAfter2027Km && (isNaN(Number(uncontractedAfter2027Km)) || Number(uncontractedAfter2027Km) < 0)) {
        stageErrors.uncontractedAfter2027Km = 'Uncontracted Length must be a non-negative number.';
      }
    } else if (stageIdx === 3) {
      // Stage 4: Sub-contracts row validations
      subContracts.forEach((sub, idx) => {
        if (!sub.sub_stretch_title.trim()) {
          stageErrors[`sub_${idx}_title`] = `Sub-Contract #${idx + 1}: Package Title is required.`;
        }
        if (sub.from_km !== undefined && sub.to_km !== undefined && Number(sub.to_km) < Number(sub.from_km)) {
          stageErrors[`sub_${idx}_km`] = `Sub-Contract #${idx + 1}: To Km cannot be less than From Km.`;
        }
      });
    }

    return stageErrors;
  };

  const isStageAccessible = (targetStageIdx: number): boolean => {
    if (targetStageIdx === 0) return true;
    for (let i = 0; i < targetStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      if (Object.keys(stageErrs).length > 0) return false;
    }
    return true;
  };

  const isStageCompleted = (stageIdx: number): boolean => {
    if (stageIdx === 0) {
      return Boolean(highwayCode.trim() && circleName.trim() && divisionName.trim() && fromKm !== '' && toKm !== '' && Number(toKm) >= Number(fromKm) && Object.keys(validateSingleStage(0)).length === 0);
    }
    if (stageIdx === 1) {
      return Boolean(contractorName.trim() && contractMode.trim() && docDate && dlpExpiryDate && Object.keys(validateSingleStage(1)).length === 0);
    }
    if (stageIdx === 2) {
      return Boolean((dlpLengthKm || stmcLengthKm || constructionLengthKm || pbmcLengthKm || noDlpLengthKm) && Object.keys(validateSingleStage(2)).length === 0);
    }
    if (stageIdx === 3) {
      return Boolean(subContracts.length > 0 && Object.keys(validateSingleStage(3)).length === 0);
    }
    return false;
  };

  const validateUpToStage = (maxStageIdx: number): boolean => {
    const combinedErrors: Record<string, string> = {};
    for (let i = 0; i <= maxStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      Object.assign(combinedErrors, stageErrs);
    }
    setErrors(combinedErrors);
    return Object.keys(combinedErrors).length === 0;
  };

  const handleStageTabClick = (idx: number) => {
    if (isStageAccessible(idx)) {
      setErrors({});
      setActiveStageIndex(idx);
    } else {
      validateUpToStage(activeStageIndex);
    }
  };

  const handleNextStage = () => {
    if (validateUpToStage(activeStageIndex)) {
      if (activeStageIndex < STAGES.length - 1) {
        setActiveStageIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpToStage(activeStageIndex)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const formattedHighwayCode = highwayCode.trim().toUpperCase();
    const finalStretchName =
      stretchName.trim() ||
      `${divisionName} Division - ${formattedHighwayCode} (Km ${fromKm} to ${toKm})`;

    const finalDocDate = docDate || new Date().toISOString().split('T')[0];
    const finalExpiryDate = dlpExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const today = new Date();
    const expiry = new Date(finalExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
    if (daysRemaining < 0) status = 'EXPIRED';
    else if (daysRemaining <= 90) status = 'EXPIRING_SOON';

    const payload: Partial<DLPContractItem> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      highway_code: formattedHighwayCode,
      division_name: divisionName,
      stretch_name: finalStretchName,
      from_km: parseFloat(fromKm) || 0,
      to_km: parseFloat(toKm) || 0,
      length_km: calculatedLength,

      dlp_contract_count: parseInt(dlpContractCount, 10) || 0,
      dlp_length_km: parseFloat(dlpLengthKm) || 0,
      dlp_chainage: dlpChainage.trim() || undefined,
      dlp_expiry_date: finalExpiryDate,

      construction_project_count: parseInt(constructionProjectCount, 10) || 0,
      construction_length_km: parseFloat(constructionLengthKm) || 0,
      construction_chainage: constructionChainage.trim() || undefined,

      stmc_contract_count: parseInt(stmcContractCount, 10) || 0,
      stmc_length_km: parseFloat(stmcLengthKm) || 0,
      stmc_chainage: stmcChainage.trim() || undefined,
      stmc_expiry_date: stmcExpiryDate.trim() || undefined,

      pbmc_project_count: parseInt(pbmcProjectCount, 10) || 0,
      pbmc_length_km: parseFloat(pbmcLengthKm) || 0,
      pbmc_chainage: pbmcChainage.trim() || undefined,
      pbmc_expiry_date: pbmcExpiryDate.trim() || undefined,

      no_dlp_length_km: parseFloat(noDlpLengthKm) || 0,
      no_dlp_chainage: noDlpChainage.trim() || undefined,
      no_dlp_expiry_date: noDlpExpiryDate.trim() || undefined,

      uncontracted_after_2027_km: parseFloat(uncontractedAfter2027Km) || 0,

      contractor_name: contractorName.trim() || `${divisionName} Division (Contractor DLP)`,
      contract_mode: contractMode.trim() || 'EPC',
      work_description:
        workDescription.trim() || `Maintenance & DLP period under ${divisionName} Division (${contractMode || 'EPC'})`,
      doc_date: finalDocDate,
      days_remaining: daysRemaining,
      status: initialData?.status === 'DELETED' ? 'DELETED' : status,

      sub_contracts: subContracts.map((s) => ({
        ...s,
        contractor_name: s.contractor_name || contractorName.trim() || `${divisionName} Division Contractor`,
        expiry_date: s.expiry_date || finalExpiryDate,
      })),
    };

    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to DLP Register
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit DLP Maintenance Contract' : 'New DLP Maintenance Contract Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Maintenance Portal &bull; Defect Liability Period & Multi-Stretch Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving Contract...' : `Save Progress (${currentStage.step})`}
          </button>
        </div>
      </div>

      {/* 4-STAGE LIFECYCLE SUB-NAVIGATION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStageIndex === idx;
            const accessible = isStageAccessible(idx);
            const completed = isStageCompleted(idx);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageTabClick(idx)}
                disabled={!accessible}
                className={`flex flex-col items-start p-3 rounded-xl text-left transition-all border relative cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                    : accessible
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : completed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stage.step}
                  </span>
                  {completed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : !accessible ? (
                    <LockKeyhole className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  )}
                </div>
                <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate w-full mt-0.5">{stage.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Diagnostic Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the following required fields ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STAGE CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Stage Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(currentStage.icon, { className: 'w-5 h-5 text-blue-300' })}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                {currentStage.step}: {currentStage.label}
              </h3>
              <span className="text-xs text-blue-200">{currentStage.subtitle}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ========================================================= */}
          {/* STAGE 1: Corridor & Jurisdiction */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Highway Corridor Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={highwayCode}
                    onChange={(e) => {
                      setHighwayCode(e.target.value);
                      if (errors.highwayCode) setErrors((prev) => ({ ...prev, highwayCode: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.highwayCode && <p className="text-[11px] text-rose-500 mt-1">{errors.highwayCode}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Circle <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={circleOptions}
                    value={circleName}
                    onChange={handleCircleChange}
                  />
                  {errors.circleName && <p className="text-[11px] text-rose-500 mt-1">{errors.circleName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Highway Division <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={divisionOptions}
                    value={divisionName}
                    onChange={(val) => {
                      setDivisionName(val);
                      if (errors.divisionName) setErrors((prev) => ({ ...prev, divisionName: '' }));
                    }}
                  />
                  {errors.divisionName && <p className="text-[11px] text-rose-500 mt-1">{errors.divisionName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Master Stretch Section Name
                </label>
                <input
                  type="text"
                  value={stretchName}
                  onChange={(e) => setStretchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    From Chainage (Km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={fromKm}
                    onChange={(e) => {
                      setFromKm(e.target.value);
                      if (errors.fromKm) setErrors((prev) => ({ ...prev, fromKm: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.fromKm && <p className="text-[11px] text-rose-500 mt-1">{errors.fromKm}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Chainage (Km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={toKm}
                    onChange={(e) => {
                      setToKm(e.target.value);
                      if (errors.toKm) setErrors((prev) => ({ ...prev, toKm: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.toKm && <p className="text-[11px] text-rose-500 mt-1">{errors.toKm}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Calculated Master Length (Km)
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {calculatedLength.toFixed(3)} Km
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Execution & Terms */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor / Execution Firm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => {
                      setContractorName(e.target.value);
                      if (errors.contractorName) setErrors((prev) => ({ ...prev, contractorName: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.contractorName && <p className="text-[11px] text-rose-500 mt-1">{errors.contractorName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Procurement Mode <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={contractModes}
                    value={contractMode}
                    onChange={(val) => {
                      setContractMode(val);
                      if (errors.contractMode) setErrors((prev) => ({ ...prev, contractMode: '' }));
                    }}
                  />
                  {errors.contractMode && <p className="text-[11px] text-rose-500 mt-1">{errors.contractMode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Commencement (DOC) <span className="text-rose-500">*</span>
                  </label>
                  <DatePickerInput
                    value={docDate}
                    onChange={(val) => {
                      setDocDate(val);
                      if (errors.docDate) setErrors((prev) => ({ ...prev, docDate: '' }));
                    }}
                  />
                  {errors.docDate && <p className="text-[11px] text-rose-500 mt-1">{errors.docDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary DLP Guarantee Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePickerInput
                    value={dlpExpiryDate}
                    onChange={(val) => {
                      setDlpExpiryDate(val);
                      if (errors.dlpExpiryDate) setErrors((prev) => ({ ...prev, dlpExpiryDate: '' }));
                    }}
                  />
                  {errors.dlpExpiryDate && <p className="text-[11px] text-rose-500 mt-1">{errors.dlpExpiryDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scope of Work & Maintenance Description
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Category Breakdown */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              {/* Category 1: DLP Warranty */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  1. Defect Liability Period (DLP) Stretches
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Contract Count</label>
                    <input
                      type="number"
                      value={dlpContractCount}
                      onChange={(e) => setDlpContractCount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={dlpLengthKm}
                      onChange={(e) => setDlpLengthKm(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chainage Bounds</label>
                    <input
                      type="text"
                      value={dlpChainage}
                      onChange={(e) => setDlpChainage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Active Construction */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  2. Active Construction Work Stretches
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Project Count</label>
                    <input
                      type="number"
                      value={constructionProjectCount}
                      onChange={(e) => setConstructionProjectCount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={constructionLengthKm}
                      onChange={(e) => setConstructionLengthKm(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chainage Bounds</label>
                    <input
                      type="text"
                      value={constructionChainage}
                      onChange={(e) => setConstructionChainage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Category 3: STMC Stretches */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  3. Short-Term Maintenance Contracts (STMC)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Contract Count</label>
                    <input
                      type="number"
                      value={stmcContractCount}
                      onChange={(e) => setStmcContractCount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={stmcLengthKm}
                      onChange={(e) => setStmcLengthKm(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chainage Bounds</label>
                    <input
                      type="text"
                      value={stmcChainage}
                      onChange={(e) => setStmcChainage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">STMC Expiry</label>
                    <DatePickerInput
                      value={stmcExpiryDate}
                      onChange={setStmcExpiryDate}
                    />
                  </div>
                </div>
              </div>

              {/* Category 4: PBMC Stretches */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  4. Performance-Based Maintenance (PBMC)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Project Count</label>
                    <input
                      type="number"
                      value={pbmcProjectCount}
                      onChange={(e) => setPbmcProjectCount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={pbmcLengthKm}
                      onChange={(e) => setPbmcLengthKm(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chainage Bounds</label>
                    <input
                      type="text"
                      value={pbmcChainage}
                      onChange={(e) => setPbmcChainage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">PBMC Expiry</label>
                    <DatePickerInput
                      value={pbmcExpiryDate}
                      onChange={setPbmcExpiryDate}
                    />
                  </div>
                </div>
              </div>

              {/* Category 5 & 6: Non-DLP and Uncontracted */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    5. Non-DLP / Uncontracted Stretches
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={noDlpLengthKm}
                        onChange={(e) => setNoDlpLengthKm(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Chainage Bounds</label>
                      <input
                        type="text"
                        value={noDlpChainage}
                        onChange={(e) => setNoDlpChainage(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Expiry Date</label>
                      <DatePickerInput
                        value={noDlpExpiryDate}
                        onChange={setNoDlpExpiryDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    6. Uncontracted Beyond 2027
                  </span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Length (Km)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={uncontractedAfter2027Km}
                      onChange={(e) => setUncontractedAfter2027Km(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: Child Sub-Contracts */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    1-to-N Child Packages & Sub-Contracts ({subContracts.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add discrete road stretches, contractor assignments, chainages, and warranties
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSubContract}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub-Contract</span>
                </button>
              </div>

              {subContracts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-500">No child sub-contracts registered.</p>
                  <button
                    type="button"
                    onClick={handleAddSubContract}
                    className="mt-3 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    + Add First Sub-Contract
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subContracts.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                            {idx + 1}
                          </span>
                          <span>{sub.sub_stretch_title || `Sub-Package #${idx + 1}`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubContract(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Package Title *</label>
                          <input
                            type="text"
                            value={sub.sub_stretch_title}
                            onChange={(e) => handleUpdateSubContract(idx, 'sub_stretch_title', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Type *</label>
                          <SearchableSelect
                            options={maintenanceTypes}
                            value={sub.maintenance_type}
                            onChange={(val) => handleUpdateSubContract(idx, 'maintenance_type', val)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">From Km *</label>
                          <input
                            type="number"
                            step="0.001"
                            value={sub.from_km ?? ''}
                            onChange={(e) => handleUpdateSubContract(idx, 'from_km', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">To Km *</label>
                          <input
                            type="number"
                            step="0.001"
                            value={sub.to_km ?? ''}
                            onChange={(e) => handleUpdateSubContract(idx, 'to_km', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Length (Km)</label>
                          <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-600">
                            {(sub.length_km ?? 0).toFixed(3)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Package Contractor</label>
                          <input
                            type="text"
                            value={sub.contractor_name || ''}
                            onChange={(e) => handleUpdateSubContract(idx, 'contractor_name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sub-Expiry Date</label>
                          <DatePickerInput
                            value={sub.expiry_date || ''}
                            onChange={(val) => handleUpdateSubContract(idx, 'expiry_date', val)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Remarks</label>
                          <input
                            type="text"
                            value={sub.remarks || ''}
                            onChange={(e) => handleUpdateSubContract(idx, 'remarks', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation & Save Action Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            {activeStageIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevStage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous: {STAGES[activeStageIndex - 1].label}
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeStageIndex < STAGES.length - 1 && (
              <button
                type="button"
                onClick={handleNextStage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
              >
                <span>Next: {STAGES[activeStageIndex + 1].label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Contract...' : `Save Progress (${currentStage.step})`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default DlpContractEntryForm;
