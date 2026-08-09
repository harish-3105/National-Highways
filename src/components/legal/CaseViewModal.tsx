'use client';

import React from 'react';
import { CaseEntryFormData } from '@/types/legal';
import { X, Printer, FileText, Gavel, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CaseViewModalProps {
  caseData: CaseEntryFormData;
  onClose: () => void;
}

export const CaseViewModal: React.FC<CaseViewModalProps> = ({ caseData, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-print-modal-wrapper fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="legal-print-card bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between print:bg-blue-950 print:text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400 shrink-0 print:hidden" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Legal Case Record Details
              </h3>
              <span className="text-xs text-blue-200 print:text-blue-100">
                Case No: {caseData.caseNumber} ({caseData.caseYear}) &bull; {caseData.circle} Circle &bull; {caseData.division} Division
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hide">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Export PDF / Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="legal-print-scrollable p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 print:p-6 print:text-slate-900">
          {/* Status Badges Header */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="bg-blue-900 text-white px-3 py-1 rounded-lg font-bold text-xs">
              Case No: {caseData.caseNumber}
            </span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg font-bold text-xs print:bg-blue-200 print:text-blue-950">
              {caseData.category}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg font-bold text-xs print:bg-slate-300 print:text-slate-900">
              Pertains to: {caseData.casePertainsTo}
            </span>
            <span
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                caseData.counterAffidavitFiled === 'Yes'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 print:bg-emerald-200 print:text-emerald-950'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 print:bg-amber-200 print:text-amber-950'
              }`}
            >
              Counter Affidavit: {caseData.counterAffidavitFiled === 'Yes' ? 'Filed' : 'Pending'}
            </span>
            {caseData.convertedCase?.enabled && (
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg font-bold text-xs print:bg-purple-200 print:text-purple-950">
                Converted Petition Filed
              </span>
            )}
          </div>

          {/* Section 1: Administrative Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 print:border-slate-300 print:bg-white">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider print:text-blue-950">
              Section 1 &ndash; Administrative Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><strong className="text-slate-500 print:text-slate-700">Circle:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.circle} Circle</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Division:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.division}</span></div>
              {caseData.lawyerName && (
                <div><strong className="text-slate-500 print:text-slate-700">Assigned Legal Counsel:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.lawyerName}</span></div>
              )}
            </div>
          </div>

          {/* Section 2: Case Particulars */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider print:text-blue-950">
              Section 2 &ndash; Case Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><strong className="text-slate-500 print:text-slate-700">Case Number:</strong> <span className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-900">{caseData.caseNumber}</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Case Year:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.caseYear}</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Category:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.category}</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Name of Court:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.nameOfCourt}</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Name of Respondent:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.nameOfRespondent}</span></div>
              <div><strong className="text-slate-500 print:text-slate-700">Case Pertains To:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.casePertainsTo}</span></div>
              <div className="sm:col-span-2 md:col-span-3">
                <strong className="text-slate-500 print:text-slate-700">Nature of Case:</strong>{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">
                  {caseData.natureOfCase} {caseData.natureOfCase === 'Other' && caseData.specifyNatureOfCase ? `(${caseData.specifyNatureOfCase})` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Brief of the Prayer:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-slate-50 print:border-slate-300 print:text-slate-950">
                  {caseData.briefOfPrayer || 'N/A'}
                </p>
              </div>

              <div>
                <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Case Details & Present Status:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-slate-50 print:border-slate-300 print:text-slate-950">
                  {caseData.caseDetailsPresentStatus || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Counter Affidavit & Post Hearing */}
          {caseData.counterAffidavitFiled === 'Yes' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3 print:bg-emerald-50/40 print:border-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 print:text-emerald-800" />
                  <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider print:text-emerald-950">
                    Counter Affidavit Details (Filed)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div><strong className="text-slate-500 print:text-slate-700">Date of Filing:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.counterAffidavitData?.dateOfFiling || 'N/A'}</span></div>
                  <div><strong className="text-slate-500 print:text-slate-700">Last Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.counterAffidavitData?.lastHearingDate || 'N/A'}</span></div>
                  <div><strong className="text-slate-500 print:text-slate-700">Next Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.counterAffidavitData?.nextHearingDate || 'N/A'}</span></div>
                </div>
                <div>
                  <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Counter Affidavit Details:</strong>
                  <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-emerald-300 print:text-slate-950">
                    {caseData.counterAffidavitData?.details || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 print:bg-blue-50/40 print:border-blue-300">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400 print:text-blue-900" />
                  <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider print:text-blue-950">
                    Post Hearing Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><strong className="text-slate-500 print:text-slate-700">Order Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.postHearingData?.orderDate || 'N/A'}</span></div>
                  <div><strong className="text-slate-500 print:text-slate-700">Compliance Period:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.postHearingData?.compliancePeriod || 'N/A'}</span></div>
                  <div><strong className="text-slate-500 print:text-slate-700">End Date Compliance:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.postHearingData?.endDateForCompliance || 'N/A'}</span></div>
                  <div><strong className="text-slate-500 print:text-slate-700">Appeal Eligibility:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.postHearingData?.eligibilityForAppeal || 'No'}</span></div>
                </div>

                {caseData.postHearingData?.actionBeforeNextHearing && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Action to be Taken Before Next Hearing:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                      {caseData.postHearingData.actionBeforeNextHearing}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.interimOrFinalOrder && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Interim / Final Order:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                      {caseData.postHearingData.interimOrFinalOrder}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.statusOfActionTakenForCompliance && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Status of Action Taken for Compliance:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                      {caseData.postHearingData.statusOfActionTakenForCompliance}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Action Taken for Appeal:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                      {caseData.postHearingData.actionTakenForAppeal || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2 print:bg-amber-50/40 print:border-amber-300">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 print:text-amber-800" />
                <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider print:text-amber-950">
                  Pending Counter Affidavit Action Required
                </h4>
              </div>
              <div>
                <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Action to be Taken to File Counter Affidavit:</strong>
                <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-amber-100 dark:border-amber-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-amber-300 print:text-slate-950">
                  {caseData.actionToTakeForCounterAffidavit || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Module 2: Converted Case Proceedings */}
          {caseData.convertedCase?.enabled && (
            <div className="border-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 space-y-4 print:border-slate-800 print:bg-slate-50">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                <Gavel className="w-5 h-5 text-purple-700 dark:text-purple-400 print:text-purple-900" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider print:text-slate-950">
                    MODULE 2: Converted Case Proceedings
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-700">
                    Appeal / Petition Proceedings Details
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div><strong className="text-slate-500 print:text-slate-700">Converted Category:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.category}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Type of Petition:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.typeOfPetition} {caseData.convertedCase.typeOfPetition === 'Other' && caseData.convertedCase.specifyPetitionType ? `(${caseData.convertedCase.specifyPetitionType})` : ''}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Converted Case Number:</strong> <span className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-900">{caseData.convertedCase.caseNumber}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Converted Case Year:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.caseYear}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">State:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.state}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">District:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.district}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Court Complex:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.courtComplex}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Petitioner Name:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.petitionerName}</span></div>
                <div><strong className="text-slate-500 print:text-slate-700">Respondent Name:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.respondentName}</span></div>
                {caseData.convertedCase.impugnedCaseNumber && (
                  <div><strong className="text-slate-500 print:text-slate-700">Impugned Case Number:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.impugnedCaseNumber}</span></div>
                )}
                {caseData.convertedCase.orderIssued && (
                  <div><strong className="text-slate-500 print:text-slate-700">Order Issued:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.orderIssued}</span></div>
                )}
                {caseData.convertedCase.orderDate && (
                  <div><strong className="text-slate-500 print:text-slate-700">Order Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-950">{caseData.convertedCase.orderDate}</span></div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Brief of Prayer (Petition):</strong>
                  <p className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-slate-300 print:text-slate-950">
                    {caseData.convertedCase.briefOfPrayer || 'N/A'}
                  </p>
                </div>

                {caseData.convertedCase.caseDetailsPresentStatus && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Case Details & Present Status (Petition):</strong>
                    <p className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-slate-300 print:text-slate-950">
                      {caseData.convertedCase.caseDetailsPresentStatus}
                    </p>
                  </div>
                )}
              </div>

              {/* Converted Case Counter Affidavit & Post Hearing */}
              {caseData.convertedCase.counterAffidavitFiled === 'Yes' ? (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-300">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3 print:bg-emerald-50/40 print:border-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 print:text-emerald-800" />
                      <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider print:text-emerald-950">
                        Petition Counter Affidavit Details (Filed)
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div><strong className="text-slate-500 print:text-slate-700">Date of Filing:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.counterAffidavitData?.dateOfFiling || 'N/A'}</span></div>
                      <div><strong className="text-slate-500 print:text-slate-700">Last Hearing Date:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.counterAffidavitData?.lastHearingDate || 'N/A'}</span></div>
                      <div><strong className="text-slate-500 print:text-slate-700">Next Hearing Date:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.counterAffidavitData?.nextHearingDate || 'N/A'}</span></div>
                    </div>
                    {caseData.convertedCase.counterAffidavitData?.details && (
                      <div>
                        <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Counter Affidavit Details:</strong>
                        <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-emerald-300 print:text-slate-950">
                          {caseData.convertedCase.counterAffidavitData.details}
                        </p>
                      </div>
                    )}
                  </div>

                  {caseData.convertedCase.postHearingData && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 print:bg-blue-50/40 print:border-blue-300">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400 print:text-blue-900" />
                        <h5 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider print:text-blue-950">
                          Petition Post Hearing Details
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div><strong className="text-slate-500 print:text-slate-700">Order Date:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.postHearingData.orderDate || 'N/A'}</span></div>
                        <div><strong className="text-slate-500 print:text-slate-700">Compliance Period:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.postHearingData.compliancePeriod || 'N/A'}</span></div>
                        <div><strong className="text-slate-500 print:text-slate-700">End Date Compliance:</strong> <span className="font-bold print:text-slate-950">{caseData.convertedCase.postHearingData.endDateForCompliance || 'N/A'}</span></div>
                      </div>
                      {caseData.convertedCase.postHearingData.actionBeforeNextHearing && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Action Before Next Hearing:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                            {caseData.convertedCase.postHearingData.actionBeforeNextHearing}
                          </p>
                        </div>
                      )}
                      {caseData.convertedCase.postHearingData.interimOrFinalOrder && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Interim / Final Order:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                            {caseData.convertedCase.postHearingData.interimOrFinalOrder}
                          </p>
                        </div>
                      )}
                      {caseData.convertedCase.postHearingData.statusOfActionTakenForCompliance && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 print:text-slate-800 block mb-1">Status of Action Taken for Compliance:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-blue-300 print:text-slate-950">
                            {caseData.convertedCase.postHearingData.statusOfActionTakenForCompliance}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                caseData.convertedCase.actionToTakeForCounterAffidavit && (
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2 pt-2 print:bg-amber-50/40 print:border-amber-300">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 print:text-amber-800" />
                      <h5 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider print:text-amber-950">
                        Petition Pending Counter Affidavit Action Required
                      </h5>
                    </div>
                    <p className="bg-white dark:bg-slate-900 p-3 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap print:bg-white print:border-amber-300 print:text-slate-950">
                      {caseData.convertedCase.actionToTakeForCounterAffidavit}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Official Document Footer for Print Output */}
          <div className="hidden print:flex justify-between items-center pt-4 border-t border-slate-300 text-[10px] text-slate-600">
            <div>
              <strong className="block text-slate-800 uppercase font-sans">Highways Department Legal Cell &bull; Government of Tamil Nadu</strong>
              <span>Confidential Case Record Report</span>
            </div>
            <div className="text-right">
              <span>Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end print-hide">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseViewModal;
