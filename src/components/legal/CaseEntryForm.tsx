'use client';

import React, { useState } from 'react';
import { CaseEntryFormData, CategoryType, CasePertainsToType, NatureOfCaseType } from '@/types/legal';
import { CIRCLE_OPTIONS, CIRCLE_DIVISION_MAP } from '@/lib/legal/masterData';
import { Save, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface CaseEntryFormProps {
  initialData?: Partial<CaseEntryFormData>;
  onSave: (data: CaseEntryFormData) => void;
  onCancel: () => void;
}

const initialFormState: CaseEntryFormData = {
  circle: 'Chennai',
  division: 'Chennai City Division',
  caseNumber: '',
  caseYear: '2024',
  category: 'Filed Against Department',
  nameOfCourt: '',
  nameOfRespondent: '',
  casePertainsTo: 'GOTN',
  natureOfCase: 'Work',
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
};

export const CaseEntryForm: React.FC<CaseEntryFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CaseEntryFormData>(() => ({
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
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const divisionOptions = formData.circle ? CIRCLE_DIVISION_MAP[formData.circle] || [] : [];

  const handleCircleChange = (c: string) => {
    const divs = CIRCLE_DIVISION_MAP[c] || [];
    setFormData((prev) => ({
      ...prev,
      circle: c,
      division: divs[0] || '',
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.caseNumber.trim()) errs.caseNumber = 'Case Number is required';
    if (!formData.nameOfCourt.trim()) errs.nameOfCourt = 'Name of Court is required';
    if (!formData.nameOfRespondent.trim()) errs.nameOfRespondent = 'Name of Respondent is required';
    if (!formData.briefOfPrayer.trim()) errs.briefOfPrayer = 'Brief of Prayer is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-lg text-white">
              {initialData?.id ? 'Edit Legal Litigation Case' : 'New Legal Litigation Case Entry'}
            </h3>
            <p className="text-xs text-blue-200">
              Department court proceedings, affidavits, and hearing schedules.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Record
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-800 dark:text-slate-200">
        {/* Section 1: Administrative Details */}
        <div className="space-y-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <h4 className="font-bold text-sm text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Section 1 &bull; Administrative Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Circle *</label>
              <select
                value={formData.circle}
                onChange={(e) => handleCircleChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {CIRCLE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c} Circle</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Division *</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData((prev) => ({ ...prev, division: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {divisionOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Case Information */}
        <div className="space-y-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <h4 className="font-bold text-sm text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Section 2 &bull; Case Particulars
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Case Number *</label>
              <input
                type="text"
                placeholder="e.g. WP/14502/2024"
                value={formData.caseNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseNumber: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              {errors.caseNumber && <p className="text-red-500 text-[10px] mt-1">{errors.caseNumber}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Case Year *</label>
              <input
                type="text"
                value={formData.caseYear}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseYear: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as CategoryType }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Filed Against Department">Filed Against Department</option>
                <option value="Filed By Department">Filed By Department</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Pertains To *</label>
              <select
                value={formData.casePertainsTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, casePertainsTo: e.target.value as CasePertainsToType }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="GOTN">GOTN</option>
                <option value="MoRTH">MoRTH</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Name of Court *</label>
              <input
                type="text"
                placeholder="e.g. Madras High Court - Main Bench"
                value={formData.nameOfCourt}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameOfCourt: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              {errors.nameOfCourt && <p className="text-red-500 text-[10px] mt-1">{errors.nameOfCourt}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Name of Respondent *</label>
              <input
                type="text"
                placeholder="e.g. Superintending Engineer, NH Chennai"
                value={formData.nameOfRespondent}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameOfRespondent: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              {errors.nameOfRespondent && <p className="text-red-500 text-[10px] mt-1">{errors.nameOfRespondent}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Nature of Case *</label>
              <select
                value={formData.natureOfCase}
                onChange={(e) => setFormData((prev) => ({ ...prev, natureOfCase: e.target.value as NatureOfCaseType }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Work">Work</option>
                <option value="Tender">Tender</option>
                <option value="Land Acquisition">Land Acquisition</option>
                <option value="Encroachment">Encroachment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.natureOfCase === 'Other' && (
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Specify Nature *</label>
                <input
                  type="text"
                  value={formData.specifyNatureOfCase || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specifyNatureOfCase: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Brief of Prayer *</label>
              <textarea
                rows={2}
                placeholder="Writ of Mandamus for enhanced land acquisition compensation..."
                value={formData.briefOfPrayer}
                onChange={(e) => setFormData((prev) => ({ ...prev, briefOfPrayer: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              {errors.briefOfPrayer && <p className="text-red-500 text-[10px] mt-1">{errors.briefOfPrayer}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Case Details & Present Status</label>
              <textarea
                rows={2}
                placeholder="Counter affidavit drafted and ready for filing..."
                value={formData.caseDetailsPresentStatus}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseDetailsPresentStatus: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Counter Affidavit Toggle & Hearing Schedule */}
        <div className="space-y-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Counter Affidavit Status
            </h4>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['No', 'Yes'] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setFormData((prev) => ({ ...prev, counterAffidavitFiled: v }))}
                  className={`px-4 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    formData.counterAffidavitFiled === v
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {v === 'Yes' ? 'Filed (Yes)' : 'Pending (No)'}
                </button>
              ))}
            </div>
          </div>

          {formData.counterAffidavitFiled === 'Yes' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Date of Filing</label>
                <input
                  type="date"
                  value={formData.counterAffidavitData?.dateOfFiling || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      counterAffidavitData: {
                        ...prev.counterAffidavitData!,
                        dateOfFiling: e.target.value,
                      },
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Last Hearing Date</label>
                <input
                  type="date"
                  value={formData.counterAffidavitData?.lastHearingDate || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      counterAffidavitData: {
                        ...prev.counterAffidavitData!,
                        lastHearingDate: e.target.value,
                      },
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">Next Hearing Date</label>
                <input
                  type="date"
                  value={formData.counterAffidavitData?.nextHearingDate || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      counterAffidavitData: {
                        ...prev.counterAffidavitData!,
                        nextHearingDate: e.target.value,
                      },
                    }))
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-400">
                Action to Take for Counter Affidavit
              </label>
              <textarea
                rows={2}
                placeholder="Details of instructions given to GP / Law Officer..."
                value={formData.actionToTakeForCounterAffidavit || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, actionToTakeForCounterAffidavit: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Save Legal Case Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseEntryForm;
