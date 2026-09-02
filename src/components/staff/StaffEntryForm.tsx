'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Users,
  AlertCircle,
  Briefcase,
  Building,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
  Check,
  Shield,
  KeyRound,
} from 'lucide-react';
import { StaffMember, StaffMasterConfig } from './StaffTypes';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  getCascadingDivisions,
  getCascadingSubDivisions,
  getCascadingSections,
  getCascadingSubSections,
} from '@/lib/staff/masterData';

interface StaffEntryFormProps {
  initialData?: Partial<StaffMember>;
  masterConfig: StaffMasterConfig;
  onSave: (staffData: Partial<StaffMember> & { role_id?: string }) => Promise<void> | void;
  onCancel: () => void;
}

type StaffStageType = 'identity_contact' | 'posting_hierarchy';

interface StageDefinition {
  id: StaffStageType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'identity_contact',
    label: 'Personnel & Contact Details',
    step: 'Stage 1',
    subtitle: 'Officer full name, designation cadre, mobile phone & departmental email',
    icon: Briefcase,
  },
  {
    id: 'posting_hierarchy',
    label: 'Organizational Posting',
    step: 'Stage 2',
    subtitle: '6-tier departmental hierarchy from headquarters down to sub-sections',
    icon: Building,
  },
];

export const StaffEntryForm: React.FC<StaffEntryFormProps> = ({
  initialData,
  masterConfig,
  onSave,
  onCancel,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Stage 1: Personnel Identity & Contact Information
  const [name, setName] = useState<string>(initialData?.name || '');
  const [designation, setDesignation] = useState<string>(initialData?.designation || '');
  const [contactNo, setContactNo] = useState<string>(initialData?.contact_no || '');
  const [emailId, setEmailId] = useState<string>(initialData?.emailid || '');
  const [roles, setRoles] = useState<Array<{ id: string; name: string; position: number }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialData?.user_profile?.role_id || '');

  // Stage 2: 6-Tier Hierarchy
  const [office, setOffice] = useState<string>(initialData?.office || '');
  const [circle, setCircle] = useState<string>(initialData?.circle || '');
  const [division, setDivision] = useState<string>(initialData?.division || '');
  const [subDivision, setSubDivision] = useState<string>(initialData?.sub_division || '');
  const [section, setSection] = useState<string>(initialData?.section || '');
  const [subSection, setSubSection] = useState<string>(initialData?.sub_section || '');

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch('/api/roles');
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles || []);
          if (!selectedRoleId && data.roles && data.roles.length > 0) {
            const viewer = data.roles.find((r: any) => r.position === 0);
            if (viewer) setSelectedRoleId(viewer.id);
          }
        }
      } catch (err) {
        console.error('Error fetching roles in staff entry form:', err);
      }
    }
    loadRoles();
  }, []);

  // -------------------------------------------------------------
  // DYNAMIC SMART CASCADING OPTIONS
  // -------------------------------------------------------------
  const availableDivisions = useMemo(() => {
    return getCascadingDivisions(circle, masterConfig.rawItems || [], masterConfig.divisions || []);
  }, [circle, masterConfig.rawItems, masterConfig.divisions]);

  const availableSubDivisions = useMemo(() => {
    return getCascadingSubDivisions(division, masterConfig.rawItems || [], masterConfig.sub_divisions || []);
  }, [division, masterConfig.rawItems, masterConfig.sub_divisions]);

  const availableSections = useMemo(() => {
    return getCascadingSections(subDivision, masterConfig.rawItems || [], masterConfig.sections || []);
  }, [subDivision, masterConfig.rawItems, masterConfig.sections]);

  const availableSubSections = useMemo(() => {
    return getCascadingSubSections(section, masterConfig.rawItems || [], masterConfig.sub_sections || []);
  }, [section, masterConfig.rawItems, masterConfig.sub_sections]);

  // Handlers with smart cascading auto-resets
  const handleCircleChange = (newCircle: string) => {
    setCircle(newCircle);
    if (division) {
      const validDivs = getCascadingDivisions(newCircle, masterConfig.rawItems || [], masterConfig.divisions || []);
      if (!validDivs.includes(division)) {
        setDivision('');
        setSubDivision('');
        setSection('');
        setSubSection('');
      }
    }
  };

  const handleDivisionChange = (newDivision: string) => {
    setDivision(newDivision);
    if (subDivision) {
      const validSubDivs = getCascadingSubDivisions(newDivision, masterConfig.rawItems || [], masterConfig.sub_divisions || []);
      if (!validSubDivs.includes(subDivision)) {
        setSubDivision('');
        setSection('');
        setSubSection('');
      }
    }
  };

  const handleSubDivisionChange = (newSubDivision: string) => {
    setSubDivision(newSubDivision);
    if (section) {
      const validSecs = getCascadingSections(newSubDivision, masterConfig.rawItems || [], masterConfig.sections || []);
      if (!validSecs.includes(section)) {
        setSection('');
        setSubSection('');
      }
    }
  };

  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    if (subSection) {
      const validSubSecs = getCascadingSubSections(newSection, masterConfig.rawItems || [], masterConfig.sub_sections || []);
      if (!validSubSecs.includes(subSection)) {
        setSubSection('');
      }
    }
  };

  // -------------------------------------------------------------
  // STAGE-GATED VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Personnel Identity & Contact Details (Baseline)
      if (!name.trim()) {
        stageErrors.name = 'Full Officer Name is required (Stage 1).';
      }
      if (emailId.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
        stageErrors.emailId = 'Please enter a valid email address.';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Organizational Posting
      // Non-blocking recommendations
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
      return Boolean(name.trim() && Object.keys(validateSingleStage(0)).length === 0);
    }
    if (stageIdx === 1) {
      return Boolean(office || circle || division || subDivision || section || subSection);
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

    const payload: Partial<StaffMember> & { role_id?: string } = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      designation: designation || null,
      office: office || null,
      circle: circle || null,
      division: division || null,
      sub_division: subDivision || null,
      section: section || null,
      sub_section: subSection || null,
      contact_no: contactNo.trim() || null,
      emailid: emailId.trim() || null,
      role_id: selectedRoleId || undefined,
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
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Department Staff Profile' : 'New Staff Officer Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Personnel Portal &bull; Identity, Contact & 6-Tier Posting Hierarchy
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Profile...' : `Save Progress (${currentStage.step})`}
        </button>
      </div>

      {/* 2-STAGE LIFECYCLE SUB-NAVIGATION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className={`flex flex-col items-start p-3.5 rounded-xl text-left transition-all border relative cursor-pointer disabled:cursor-not-allowed ${
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

      {/* Validation Diagnostic Banner */}
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
          {/* STAGE 1: Personnel Identity & Contact Details */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Officer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Cadre / Designation
                  </label>
                  <SearchableSelect
                    options={masterConfig.designations || []}
                    value={designation}
                    onChange={setDesignation}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Mobile Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departmental Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={emailId}
                      onChange={(e) => {
                        setEmailId(e.target.value);
                        if (errors.emailId) setErrors((prev) => ({ ...prev, emailId: '' }));
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {errors.emailId && <p className="text-[11px] text-rose-500 mt-1">{errors.emailId}</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Portal Access Role</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    All staff can log in with mobile number by default
                  </span>
                </div>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {roles.length === 0 ? (
                    <option value="">Viewer (Default)</option>
                  ) : (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Position {r.position})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Controls module edit/create permissions according to Discord-style role position hierarchy.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: 6-Tier Organizational Posting */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Office
                  </label>
                  <SearchableSelect
                    options={masterConfig.offices || []}
                    value={office}
                    onChange={setOffice}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Circle Jurisdiction
                  </label>
                  <SearchableSelect
                    options={masterConfig.circles || []}
                    value={circle}
                    onChange={handleCircleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Division Jurisdiction {circle && <span className="text-blue-600 dark:text-blue-400 font-normal">({circle})</span>}
                  </label>
                  <SearchableSelect
                    options={availableDivisions}
                    value={division}
                    onChange={handleDivisionChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Sub-Division Unit {division && <span className="text-blue-600 dark:text-blue-400 font-normal">({division})</span>}
                  </label>
                  <SearchableSelect
                    options={availableSubDivisions}
                    value={subDivision}
                    onChange={handleSubDivisionChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    5. Section Level {subDivision && <span className="text-blue-600 dark:text-blue-400 font-normal">({subDivision})</span>}
                  </label>
                  <SearchableSelect
                    options={availableSections}
                    value={section}
                    onChange={handleSectionChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    6. Sub-Section Field Unit {section && <span className="text-blue-600 dark:text-blue-400 font-normal">({section})</span>}
                  </label>
                  <SearchableSelect
                    options={availableSubSections}
                    value={subSection}
                    onChange={setSubSection}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStage}
            disabled={activeStageIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Stage
          </button>

          <button
            type="button"
            onClick={handleNextStage}
            disabled={activeStageIndex === STAGES.length - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Stage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default StaffEntryForm;
