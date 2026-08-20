'use client';

import React, { useState } from 'react';
import {
  CaseEntryFormData,
  CategoryType,
  CasePertainsToType,
  NatureOfCaseType,
  ConvertedCaseProceedingsData,
  ConvertedCategoryType,
  PetitionType,
} from '@/types/legal';
import {
  CIRCLE_OPTIONS,
  CIRCLE_DIVISION_MAP,
  TN_DISTRICTS,
  DISTRICT_COURT_COMPLEX_MAP,
} from '@/lib/legal/masterData';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { LegalMasterData } from '@/app/api/legal/master-data/route';
import {
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Gavel,
} from 'lucide-react';

interface CaseEntryFormProps {
  initialData?: Partial<CaseEntryFormData>;
  masterData?: LegalMasterData;
  onSave: (data: CaseEntryFormData) => void;
  onCancel: () => void;
}

const initialFormState: CaseEntryFormData = {
  circle: '',
  division: '',
  caseNumber: '',
  caseYear: '',
  category: '' as any,
  nameOfCourt: '',
  nameOfRespondent: '',
  casePertainsTo: '' as any,
  natureOfCase: '' as any,
  specifyNatureOfCase: '',
  briefOfPrayer: '',
  caseDetailsPresentStatus: '',
  counterAffidavitFiled: 'No',
  counterAffidavitData: {
    dateOfFiling: '',
    details: '',
    lastHearingDate: '',
    nextHearingDate: '',
  },
  postHearingData: {
    actionBeforeNextHearing: '',
    interimOrFinalOrder: '',
    orderDate: '',
    compliancePeriod: '',
    endDateForCompliance: '',
    statusOfActionTakenForCompliance: '',
    eligibilityForAppeal: 'No',
    actionTakenForAppeal: '',
  },
  actionToTakeForCounterAffidavit: '',
  convertedCase: {
    enabled: false,
    category: '' as any,
    typeOfPetition: '' as any,
    specifyPetitionType: '',
    caseNumber: '',
    caseYear: '',
    state: 'Tamil Nadu',
    district: '',
    courtComplex: '',
    petitionerName: '',
    respondentName: '',
    briefOfPrayer: '',
    impugnedCaseNumber: '',
    orderIssued: '',
    orderDate: '',
    caseDetailsPresentStatus: '',
    counterAffidavitFiled: 'No',
    counterAffidavitData: {
      dateOfFiling: '',
      details: '',
      lastHearingDate: '',
      nextHearingDate: '',
    },
    postHearingData: {
      actionBeforeNextHearing: '',
      interimOrFinalOrder: '',
      orderDate: '',
      compliancePeriod: '',
      endDateForCompliance: '',
      statusOfActionTakenForCompliance: '',
    },
    actionToTakeForCounterAffidavit: '',
  },
};

export const CaseEntryForm: React.FC<CaseEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CaseEntryFormData>(() => {
    const base: CaseEntryFormData = {
      ...initialFormState,
      ...initialData,
      counterAffidavitData: {
        dateOfFiling: initialData?.counterAffidavitData?.dateOfFiling || '',
        details: initialData?.counterAffidavitData?.details || '',
        lastHearingDate: initialData?.counterAffidavitData?.lastHearingDate || '',
        nextHearingDate: initialData?.counterAffidavitData?.nextHearingDate || '',
      },
      postHearingData: {
        actionBeforeNextHearing: initialData?.postHearingData?.actionBeforeNextHearing || '',
        interimOrFinalOrder: initialData?.postHearingData?.interimOrFinalOrder || '',
        orderDate: initialData?.postHearingData?.orderDate || '',
        compliancePeriod: initialData?.postHearingData?.compliancePeriod || '',
        endDateForCompliance: initialData?.postHearingData?.endDateForCompliance || '',
        statusOfActionTakenForCompliance: initialData?.postHearingData?.statusOfActionTakenForCompliance || '',
        eligibilityForAppeal: initialData?.postHearingData?.eligibilityForAppeal || 'No',
        actionTakenForAppeal: initialData?.postHearingData?.actionTakenForAppeal || '',
      },
      convertedCase: {
        enabled: initialData?.convertedCase?.enabled || false,
        category: initialData?.convertedCase?.category || ('' as any),
        typeOfPetition: initialData?.convertedCase?.typeOfPetition || ('' as any),
        specifyPetitionType: initialData?.convertedCase?.specifyPetitionType || '',
        caseNumber: initialData?.convertedCase?.caseNumber || '',
        caseYear: initialData?.convertedCase?.caseYear || '',
        state: 'Tamil Nadu',
        district: initialData?.convertedCase?.district || '',
        courtComplex: initialData?.convertedCase?.courtComplex || '',
        petitionerName: initialData?.convertedCase?.petitionerName || '',
        respondentName: initialData?.convertedCase?.respondentName || '',
        briefOfPrayer: initialData?.convertedCase?.briefOfPrayer || '',
        impugnedCaseNumber: initialData?.convertedCase?.impugnedCaseNumber || '',
        orderIssued: initialData?.convertedCase?.orderIssued || '',
        orderDate: initialData?.convertedCase?.orderDate || '',
        caseDetailsPresentStatus: initialData?.convertedCase?.caseDetailsPresentStatus || '',
        counterAffidavitFiled: initialData?.convertedCase?.counterAffidavitFiled || 'No',
        counterAffidavitData: {
          dateOfFiling: initialData?.convertedCase?.counterAffidavitData?.dateOfFiling || '',
          details: initialData?.convertedCase?.counterAffidavitData?.details || '',
          lastHearingDate: initialData?.convertedCase?.counterAffidavitData?.lastHearingDate || '',
          nextHearingDate: initialData?.convertedCase?.counterAffidavitData?.nextHearingDate || '',
        },
        postHearingData: {
          actionBeforeNextHearing: initialData?.convertedCase?.postHearingData?.actionBeforeNextHearing || '',
          interimOrFinalOrder: initialData?.convertedCase?.postHearingData?.interimOrFinalOrder || '',
          orderDate: initialData?.convertedCase?.postHearingData?.orderDate || '',
          compliancePeriod: initialData?.convertedCase?.postHearingData?.compliancePeriod || '',
          endDateForCompliance: initialData?.convertedCase?.postHearingData?.endDateForCompliance || '',
          statusOfActionTakenForCompliance: initialData?.convertedCase?.postHearingData?.statusOfActionTakenForCompliance || '',
        },
        actionToTakeForCounterAffidavit: initialData?.convertedCase?.actionToTakeForCounterAffidavit || '',
      },
    };
    return base;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConvertedExpanded, setIsConvertedExpanded] = useState<boolean>(
    initialData?.convertedCase?.enabled || false
  );

  const circleOptions = masterData?.circles && masterData.circles.length > 0
    ? masterData.circles
    : Array.from(CIRCLE_OPTIONS);

  // Dynamic Division options based on Circle
  const divisionOptions = formData.circle
    ? (CIRCLE_DIVISION_MAP[formData.circle] || masterData?.divisions || [])
    : (masterData?.divisions || []);

  // Dynamic Court Complex options based on District for Module 2
  const courtComplexOptions = formData.convertedCase?.district
    ? DISTRICT_COURT_COMPLEX_MAP[formData.convertedCase.district] || []
    : [];

  const handleCircleChange = (circleVal: string) => {
    setFormData((prev) => {
      const validDivisions = CIRCLE_DIVISION_MAP[circleVal] || [];
      const newDivision = validDivisions.includes(prev.division) ? prev.division : '';
      return {
        ...prev,
        circle: circleVal,
        division: newDivision,
      };
    });
    if (errors['circle']) {
      setErrors((prev) => ({ ...prev, circle: '' }));
    }
  };

  const handleDistrictChange = (districtVal: string) => {
    setFormData((prev) => {
      const validComplexes = DISTRICT_COURT_COMPLEX_MAP[districtVal] || [];
      const currentConv = prev.convertedCase || initialFormState.convertedCase!;
      const newComplex = validComplexes.includes(currentConv.courtComplex) ? currentConv.courtComplex : '';
      return {
        ...prev,
        convertedCase: {
          ...currentConv,
          district: districtVal,
          courtComplex: newComplex,
        },
      };
    });
    if (errors['convertedCase.district']) {
      setErrors((prev) => ({ ...prev, 'convertedCase.district': '' }));
    }
  };

  const updateField = (field: keyof CaseEntryFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateNestedField = (section: 'counterAffidavitData' | 'postHearingData', field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    const errKey = `${section}.${field}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const updateConvertedField = (field: keyof ConvertedCaseProceedingsData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      convertedCase: {
        ...(prev.convertedCase || initialFormState.convertedCase!),
        [field]: value,
      },
    }));
    const errKey = `convertedCase.${field}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const updateConvertedNestedField = (section: 'counterAffidavitData' | 'postHearingData', field: string, value: unknown) => {
    setFormData((prev) => {
      const conv = prev.convertedCase || initialFormState.convertedCase!;
      return {
        ...prev,
        convertedCase: {
          ...conv,
          [section]: {
            ...conv[section],
            [field]: value,
          },
        },
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Module 1 Validations
    if (!formData.circle) newErrors['circle'] = 'Circle selection is required';
    if (!formData.division) newErrors['division'] = 'Division selection is required';
    if (!formData.caseNumber?.trim()) newErrors['caseNumber'] = 'Case Number is required';

    if (!formData.caseYear?.trim()) {
      newErrors['caseYear'] = 'Case Year is required';
    } else if (!/^\d{4}$/.test(formData.caseYear.trim())) {
      newErrors['caseYear'] = 'Case Year must be exactly 4 digits (e.g. 2024)';
    } else {
      const year = parseInt(formData.caseYear, 10);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear + 1) {
        newErrors['caseYear'] = `Year must be between 1950 and ${currentYear + 1}`;
      }
    }

    if (!formData.category) newErrors['category'] = 'Category is required';
    if (!formData.nameOfCourt?.trim()) newErrors['nameOfCourt'] = 'Name of Court is required';
    if (!formData.nameOfRespondent?.trim()) newErrors['nameOfRespondent'] = 'Name of Respondent is required';
    if (!formData.casePertainsTo) newErrors['casePertainsTo'] = 'Case Pertains To is required';
    if (!formData.natureOfCase) newErrors['natureOfCase'] = 'Nature of Case is required';

    if (formData.natureOfCase === 'Other' && !formData.specifyNatureOfCase?.trim()) {
      newErrors['specifyNatureOfCase'] = 'Please specify the Nature of Case';
    }

    if (!formData.briefOfPrayer?.trim()) newErrors['briefOfPrayer'] = 'Brief of Prayer is required';
    if (!formData.caseDetailsPresentStatus?.trim()) newErrors['caseDetailsPresentStatus'] = 'Case Details & Present Status is required';

    if (formData.counterAffidavitFiled === 'Yes') {
      if (!formData.counterAffidavitData?.dateOfFiling) {
        newErrors['counterAffidavitData.dateOfFiling'] = 'Filing date is required';
      } else {
        const filingDate = new Date(formData.counterAffidavitData.dateOfFiling);
        const today = new Date();
        if (filingDate > today) {
          newErrors['counterAffidavitData.dateOfFiling'] = 'Filing date cannot be in the future';
        }
      }
      if (!formData.counterAffidavitData?.details?.trim()) {
        newErrors['counterAffidavitData.details'] = 'Counter Affidavit details are required';
      }

      if (formData.postHearingData?.eligibilityForAppeal === 'Yes' && !formData.postHearingData?.actionTakenForAppeal?.trim()) {
        newErrors['postHearingData.actionTakenForAppeal'] = 'Action Taken for Appeal is required when eligible';
      }
    } else {
      if (!formData.actionToTakeForCounterAffidavit?.trim()) {
        newErrors['actionToTakeForCounterAffidavit'] = 'Action to be taken to file Counter Affidavit is required';
      }
    }

    // Module 2 Validations (if enabled)
    if (formData.convertedCase?.enabled) {
      const conv = formData.convertedCase;
      if (!conv.category) newErrors['convertedCase.category'] = 'Category is required for Converted Case';
      if (!conv.typeOfPetition) newErrors['convertedCase.typeOfPetition'] = 'Type of Petition is required';
      if (conv.typeOfPetition === 'Other' && !conv.specifyPetitionType?.trim()) {
        newErrors['convertedCase.specifyPetitionType'] = 'Please specify Petition Type';
      }
      if (!conv.caseNumber?.trim()) newErrors['convertedCase.caseNumber'] = 'Case Number is required';
      if (!conv.caseYear?.trim()) {
        newErrors['convertedCase.caseYear'] = 'Case Year is required';
      } else if (!/^\d{4}$/.test(conv.caseYear.trim())) {
        newErrors['convertedCase.caseYear'] = 'Case Year must be exactly 4 digits';
      }
      if (!conv.district) newErrors['convertedCase.district'] = 'District is required';
      if (!conv.courtComplex) newErrors['convertedCase.courtComplex'] = 'Court Complex is required';
      if (!conv.petitionerName?.trim()) newErrors['convertedCase.petitionerName'] = 'Petitioner Name is required';
      if (!conv.respondentName?.trim()) newErrors['convertedCase.respondentName'] = 'Respondent Name is required';
      if (!conv.briefOfPrayer?.trim()) newErrors['convertedCase.briefOfPrayer'] = 'Brief of Prayer is required';
      if (!conv.caseDetailsPresentStatus?.trim()) newErrors['convertedCase.caseDetailsPresentStatus'] = 'Case Details & Present Status is required';

      if (conv.counterAffidavitFiled === 'No' && !conv.actionToTakeForCounterAffidavit?.trim()) {
        newErrors['convertedCase.actionToTakeForCounterAffidavit'] = 'Action to be taken to file counter affidavit is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Buttons */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {initialData?.id ? 'Edit Legal Litigation Case Record' : 'New Legal Litigation Case Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Department Legal Cell &bull; Case Entry & Converted Proceedings
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Complete Case Entry
        </button>
      </div>

      {/* Error Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please correct the following errors before submitting ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 1: CASE ENTRY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Module Title Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-300" />
          <div>
            <h3 className="font-bold text-base text-white uppercase tracking-wider">
              MODULE 1: Case Entry
            </h3>
            <span className="text-xs text-blue-200">
              Primary case information and administrative circle/division assignment
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* SECTION 1: Administrative Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider border-b-2 border-blue-600 inline-block pb-1">
              Section 1 &ndash; Administrative Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchableSelect
                label="Circle"
                options={circleOptions}
                value={formData.circle}
                onChange={handleCircleChange}
                placeholder="Select Circle..."
                required
                error={errors['circle']}
                helpText="Selecting a Circle updates available Divisions"
              />

              <SearchableSelect
                label="Division"
                options={divisionOptions}
                value={formData.division}
                onChange={(val) => updateField('division', val)}
                placeholder={formData.circle ? "Select Division..." : "First select a Circle..."}
                required
                disabled={!formData.circle}
                error={errors['division']}
                helpText={!formData.circle ? "Select Circle first to populate Divisions" : `Showing divisions for ${formData.circle}`}
              />
            </div>
          </div>

          {/* SECTION 2: Case Information */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider border-b-2 border-blue-600 inline-block pb-1">
              Section 2 &ndash; Case Particulars
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. WP 14502/2024"
                  value={formData.caseNumber}
                  onChange={(e) => updateField('caseNumber', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    errors['caseNumber'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                {errors['caseNumber'] && <span className="text-[11px] font-semibold text-rose-500">{errors['caseNumber']}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="YYYY (e.g. 2024)"
                  value={formData.caseYear}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField('caseYear', val);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    errors['caseYear'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                {errors['caseYear'] && <span className="text-[11px] font-semibold text-rose-500">{errors['caseYear']}</span>}
              </div>

              <div>
                <SearchableSelect
                  label="Category"
                  options={['Filed Against Department', 'Filed By Department']}
                  value={formData.category}
                  onChange={(val) => updateField('category', val as CategoryType)}
                  placeholder="Select Category..."
                  required
                  error={errors['category']}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Name of Court <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Court of Madras / District Court"
                  value={formData.nameOfCourt}
                  onChange={(e) => updateField('nameOfCourt', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    errors['nameOfCourt'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                {errors['nameOfCourt'] && <span className="text-[11px] font-semibold text-rose-500">{errors['nameOfCourt']}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Name of Respondent <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Secretary to Govt, Highways Dept"
                  value={formData.nameOfRespondent}
                  onChange={(e) => updateField('nameOfRespondent', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    errors['nameOfRespondent'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
                {errors['nameOfRespondent'] && <span className="text-[11px] font-semibold text-rose-500">{errors['nameOfRespondent']}</span>}
              </div>

              <div>
                <SearchableSelect
                  label="Case Pertains To"
                  options={
                    masterData?.casePertainsTo && masterData.casePertainsTo.length > 0
                      ? masterData.casePertainsTo
                      : ['GOTN', 'MoRTH', 'Both', 'NHAI']
                  }
                  value={formData.casePertainsTo}
                  onChange={(val) => updateField('casePertainsTo', val as CasePertainsToType)}
                  placeholder="Select Pertains To..."
                  required
                  error={errors['casePertainsTo']}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <SearchableSelect
                  label="Nature of Case"
                  options={
                    masterData?.natureOfCases && masterData.natureOfCases.length > 0
                      ? masterData.natureOfCases
                      : ['Work', 'Tender', 'Land Acquisition', 'Encroachment', 'Arbitration', 'Service Matter', 'Other']
                  }
                  value={formData.natureOfCase}
                  onChange={(val) => updateField('natureOfCase', val as NatureOfCaseType)}
                  placeholder="Select Nature of Case..."
                  required
                  error={errors['natureOfCase']}
                />
              </div>

              {formData.natureOfCase === 'Other' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Specify Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter specific nature of case..."
                    value={formData.specifyNatureOfCase || ''}
                    onChange={(e) => updateField('specifyNatureOfCase', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      errors['specifyNatureOfCase'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  />
                  {errors['specifyNatureOfCase'] && <span className="text-[11px] font-semibold text-rose-500">{errors['specifyNatureOfCase']}</span>}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Brief of the Prayer <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter detailed summary of the prayer requested in the petition..."
                value={formData.briefOfPrayer}
                onChange={(e) => updateField('briefOfPrayer', e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  errors['briefOfPrayer'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              />
              {errors['briefOfPrayer'] && <span className="text-[11px] font-semibold text-rose-500">{errors['briefOfPrayer']}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Case Details & Present Status <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter current status, court proceedings, stay orders, or pending actions..."
                value={formData.caseDetailsPresentStatus}
                onChange={(e) => updateField('caseDetailsPresentStatus', e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  errors['caseDetailsPresentStatus'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              />
              {errors['caseDetailsPresentStatus'] && <span className="text-[11px] font-semibold text-rose-500">{errors['caseDetailsPresentStatus']}</span>}
            </div>

            {/* Counter Affidavit Filed Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                  Counter Affidavit Filed? <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Has the department submitted a counter affidavit in court?
                </p>
              </div>

              <div className="w-64">
                <SearchableSelect
                  options={['Yes', 'No']}
                  value={formData.counterAffidavitFiled}
                  onChange={(val) => updateField('counterAffidavitFiled', val as 'Yes' | 'No')}
                  placeholder="Select..."
                />
              </div>
            </div>

            {/* Branch 1: Counter Affidavit Filed = YES */}
            {formData.counterAffidavitFiled === 'Yes' && (
              <div className="space-y-4 pt-2">
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Counter Affidavit Details
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DatePickerInput
                      label="Date of Filing"
                      value={formData.counterAffidavitData?.dateOfFiling || ''}
                      onChange={(val) => updateNestedField('counterAffidavitData', 'dateOfFiling', val)}
                      required
                      maxToday
                      error={errors['counterAffidavitData.dateOfFiling']}
                      helpText="Date when counter affidavit was officially submitted"
                    />

                    <DatePickerInput
                      label="Last Hearing Date"
                      value={formData.counterAffidavitData?.lastHearingDate || ''}
                      onChange={(val) => updateNestedField('counterAffidavitData', 'lastHearingDate', val)}
                    />

                    <DatePickerInput
                      label="Next Hearing Date"
                      value={formData.counterAffidavitData?.nextHearingDate || ''}
                      onChange={(val) => updateNestedField('counterAffidavitData', 'nextHearingDate', val)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Counter Affidavit Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Summary of counter affidavit arguments, annexures, and defense submitted..."
                      value={formData.counterAffidavitData?.details || ''}
                      onChange={(e) => updateNestedField('counterAffidavitData', 'details', e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        errors['counterAffidavitData.details'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    />
                    {errors['counterAffidavitData.details'] && <span className="text-[11px] font-semibold text-rose-500">{errors['counterAffidavitData.details']}</span>}
                  </div>
                </div>

                {/* Post Hearing Details Card */}
                <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h5 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                      Post Hearing Details
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Action to be Taken Before Next Hearing Date (if any)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Additional documents, site inspection, compliance report..."
                        value={formData.postHearingData?.actionBeforeNextHearing || ''}
                        onChange={(e) => updateNestedField('postHearingData', 'actionBeforeNextHearing', e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Interim Order / Final Order
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Details of court orders issued..."
                        value={formData.postHearingData?.interimOrFinalOrder || ''}
                        onChange={(e) => updateNestedField('postHearingData', 'interimOrFinalOrder', e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DatePickerInput
                      label="Order Date"
                      value={formData.postHearingData?.orderDate || ''}
                      onChange={(val) => updateNestedField('postHearingData', 'orderDate', val)}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Compliance Period (if any)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4 Weeks / 30 Days"
                        value={formData.postHearingData?.compliancePeriod || ''}
                        onChange={(e) => updateNestedField('postHearingData', 'compliancePeriod', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>

                    <DatePickerInput
                      label="End Date for Compliance"
                      value={formData.postHearingData?.endDateForCompliance || ''}
                      onChange={(val) => updateNestedField('postHearingData', 'endDateForCompliance', val)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status of Action Taken for Compliance
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Status of departmental action taken towards order compliance..."
                      value={formData.postHearingData?.statusOfActionTakenForCompliance || ''}
                      onChange={(e) => updateNestedField('postHearingData', 'statusOfActionTakenForCompliance', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>

                  {/* Eligibility for Appeal */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                          Eligibility for Appeal (as advised by Government Pleader)
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Has the Government Pleader recommended filing an appeal?
                        </p>
                      </div>
                      <div className="w-56">
                        <SearchableSelect
                          options={['Yes', 'No']}
                          value={formData.postHearingData?.eligibilityForAppeal || 'No'}
                          onChange={(val) => updateNestedField('postHearingData', 'eligibilityForAppeal', val as 'Yes' | 'No')}
                          placeholder="Select..."
                        />
                      </div>
                    </div>

                    {formData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                      <div className="flex flex-col gap-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Action Taken for Appeal <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Details of appeal draft prepared, court fee paid, or petition filing status..."
                          value={formData.postHearingData?.actionTakenForAppeal || ''}
                          onChange={(e) => updateNestedField('postHearingData', 'actionTakenForAppeal', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                            errors['postHearingData.actionTakenForAppeal'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        />
                        {errors['postHearingData.actionTakenForAppeal'] && (
                          <span className="text-[11px] font-semibold text-rose-500">{errors['postHearingData.actionTakenForAppeal']}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Branch 2: Counter Affidavit Filed = NO */}
            {formData.counterAffidavitFiled === 'No' && (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h5 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Action Required: Pending Counter Affidavit
                  </h5>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Action to be Taken to File Counter Affidavit <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify action steps, responsible officers, drafting progress, and timeline to file counter affidavit..."
                    value={formData.actionToTakeForCounterAffidavit || ''}
                    onChange={(e) => updateField('actionToTakeForCounterAffidavit', e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      errors['actionToTakeForCounterAffidavit'] ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  />
                  {errors['actionToTakeForCounterAffidavit'] && (
                    <span className="text-[11px] font-semibold text-rose-500">{errors['actionToTakeForCounterAffidavit']}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODULE 2: CONVERTED CASE PROCEEDINGS (COLLAPSIBLE ACCORDION SECTION) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Module Header & Toggle Button */}
        <div
          onClick={() => {
            const nextState = !isConvertedExpanded;
            setIsConvertedExpanded(nextState);
            updateConvertedField('enabled', nextState);
          }}
          className={`px-6 py-4 cursor-pointer flex items-center justify-between transition-colors ${
            isConvertedExpanded
              ? 'bg-slate-900 text-white dark:bg-slate-800'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Gavel className={`w-5 h-5 ${isConvertedExpanded ? 'text-blue-400' : 'text-blue-900 dark:text-blue-400'}`} />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                MODULE 2: Converted Case Proceedings
              </h3>
              <span className={`text-xs ${isConvertedExpanded ? 'text-slate-400' : 'text-slate-500'}`}>
                {isConvertedExpanded
                  ? 'Separate collapsible section active &bull; Appeal / Petition proceedings'
                  : 'Click to expand converted case proceedings section'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${
                isConvertedExpanded
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isConvertedExpanded ? 'SECTION EXPANDED' : 'SECTION COLLAPSED'}
            </span>
            {isConvertedExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Collapsible Body */}
        {isConvertedExpanded && (
          <div className="p-6 space-y-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {/* Category & Petition Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={masterData?.convertedCategories || ['Appealed by Department', 'Appealed by Other Party', 'Other']}
                  value={formData.convertedCase?.category || ''}
                  onChange={(val) => updateConvertedField('category', val as ConvertedCategoryType)}
                  placeholder="Select Category..."
                  required
                />
                {errors['convertedCase.category'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.category']}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Type of Petition <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={masterData?.petitionTypes || ['Review Petition', 'Contempt Petition', 'Execution Petition', 'Special Leave Petition (SLP)', 'Writ Appeal (WA)', 'Other']}
                  value={formData.convertedCase?.typeOfPetition || ''}
                  onChange={(val) => updateConvertedField('typeOfPetition', val as PetitionType)}
                  placeholder="Select Petition Type..."
                  required
                />
                {errors['convertedCase.typeOfPetition'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.typeOfPetition']}</span>}
              </div>

              {formData.convertedCase?.typeOfPetition === 'Other' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Specify Petition Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter petition type..."
                    value={formData.convertedCase?.specifyPetitionType || ''}
                    onChange={(e) => updateConvertedField('specifyPetitionType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                  />
                  {errors['convertedCase.specifyPetitionType'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.specifyPetitionType']}</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Converted case number..."
                  value={formData.convertedCase?.caseNumber || ''}
                  onChange={(e) => updateConvertedField('caseNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                />
                {errors['convertedCase.caseNumber'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.caseNumber']}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="YYYY (4 digits)"
                  value={formData.convertedCase?.caseYear || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateConvertedField('caseYear', val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                />
                {errors['convertedCase.caseYear'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.caseYear']}</span>}
              </div>
            </div>

            {/* COURT INFORMATION */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
                Court Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value="Tamil Nadu"
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400">Read-only state standard</span>
                </div>

                <SearchableSelect
                  label="District"
                  options={TN_DISTRICTS}
                  value={formData.convertedCase?.district || ''}
                  onChange={handleDistrictChange}
                  placeholder="Select Tamil Nadu District..."
                  required
                  error={errors['convertedCase.district']}
                  helpText="Select district to populate specific Court Complexes"
                />

                <SearchableSelect
                  label="Court Complex"
                  options={courtComplexOptions}
                  value={formData.convertedCase?.courtComplex || ''}
                  onChange={(val) => updateConvertedField('courtComplex', val)}
                  placeholder={formData.convertedCase?.district ? "Select Court Complex..." : "First select a District..."}
                  required
                  disabled={!formData.convertedCase?.district}
                  error={errors['convertedCase.courtComplex']}
                  helpText={!formData.convertedCase?.district ? "Select District first" : `Showing court complexes for ${formData.convertedCase.district}`}
                />
              </div>
            </div>

            {/* PETITION INFORMATION */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
                Petition Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Petitioner Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Petitioner Name..."
                    value={formData.convertedCase?.petitionerName || ''}
                    onChange={(e) => updateConvertedField('petitionerName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                  />
                  {errors['convertedCase.petitionerName'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.petitionerName']}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Respondent Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Respondent Name..."
                    value={formData.convertedCase?.respondentName || ''}
                    onChange={(e) => updateConvertedField('respondentName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                  />
                  {errors['convertedCase.respondentName'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.respondentName']}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Impugned Case Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Original WP No."
                    value={formData.convertedCase?.impugnedCaseNumber || ''}
                    onChange={(e) => updateConvertedField('impugnedCaseNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Order Issued
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Order summary..."
                    value={formData.convertedCase?.orderIssued || ''}
                    onChange={(e) => updateConvertedField('orderIssued', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                  />
                </div>

                <DatePickerInput
                  label="Order Date"
                  value={formData.convertedCase?.orderDate || ''}
                  onChange={(val) => updateConvertedField('orderDate', val)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Brief of Prayer <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Prayer requested in converted petition..."
                  value={formData.convertedCase?.briefOfPrayer || ''}
                  onChange={(e) => updateConvertedField('briefOfPrayer', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                />
                {errors['convertedCase.briefOfPrayer'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.briefOfPrayer']}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Details & Present Status <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Current proceedings in petition..."
                  value={formData.convertedCase?.caseDetailsPresentStatus || ''}
                  onChange={(e) => updateConvertedField('caseDetailsPresentStatus', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                />
                {errors['convertedCase.caseDetailsPresentStatus'] && <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.caseDetailsPresentStatus']}</span>}
              </div>

              {/* Converted Case Counter Affidavit Dropdown */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Counter Affidavit Filed in Petition?
                </label>
                <div className="w-40">
                  <SearchableSelect
                    options={['Yes', 'No']}
                    value={formData.convertedCase?.counterAffidavitFiled || ''}
                    onChange={(val) => updateConvertedField('counterAffidavitFiled', val as 'Yes' | 'No')}
                    placeholder="Select..."
                  />
                </div>
              </div>

              {formData.convertedCase?.counterAffidavitFiled === 'Yes' && (
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DatePickerInput
                      label="Date of Filing"
                      value={formData.convertedCase?.counterAffidavitData?.dateOfFiling || ''}
                      onChange={(val) => updateConvertedNestedField('counterAffidavitData', 'dateOfFiling', val)}
                    />
                    <DatePickerInput
                      label="Last Hearing Date"
                      value={formData.convertedCase?.counterAffidavitData?.lastHearingDate || ''}
                      onChange={(val) => updateConvertedNestedField('counterAffidavitData', 'lastHearingDate', val)}
                    />
                    <DatePickerInput
                      label="Next Hearing Date"
                      value={formData.convertedCase?.counterAffidavitData?.nextHearingDate || ''}
                      onChange={(val) => updateConvertedNestedField('counterAffidavitData', 'nextHearingDate', val)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Counter Affidavit Details
                    </label>
                    <textarea
                      rows={2}
                      value={formData.convertedCase?.counterAffidavitData?.details || ''}
                      onChange={(e) => updateConvertedNestedField('counterAffidavitData', 'details', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              )}

              {formData.convertedCase?.counterAffidavitFiled === 'No' && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Action to be Taken to File Counter Affidavit <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.convertedCase?.actionToTakeForCounterAffidavit || ''}
                    onChange={(e) => updateConvertedField('actionToTakeForCounterAffidavit', e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                  />
                  {errors['convertedCase.actionToTakeForCounterAffidavit'] && (
                    <span className="text-[11px] font-semibold text-rose-500">{errors['convertedCase.actionToTakeForCounterAffidavit']}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shadow-xs">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Complete Case Entry
        </button>
      </div>
    </form>
  );
};

export default CaseEntryForm;
