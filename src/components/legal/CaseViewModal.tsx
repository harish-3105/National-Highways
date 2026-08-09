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
      {/* 1. WEBSITE UI MODAL (Visible on screen in the web app) */}
      <div className="screen-only-modal print:hidden bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Legal Case Record Details
              </h3>
              <span className="text-xs text-blue-200">
                Case No: {caseData.caseNumber} ({caseData.caseYear}) &bull; {caseData.circle} Circle &bull; {caseData.division} Division
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Status Badges Header */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="bg-blue-900 text-white px-3 py-1 rounded-lg font-bold text-xs">
              {caseData.caseNumber}
            </span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg font-bold text-xs">
              {caseData.category}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg font-bold text-xs">
              Pertains to: {caseData.casePertainsTo}
            </span>
            <span
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                caseData.counterAffidavitFiled === 'Yes'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
              }`}
            >
              Counter Affidavit: {caseData.counterAffidavitFiled === 'Yes' ? 'Filed' : 'Pending'}
            </span>
            {caseData.convertedCase?.enabled && (
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg font-bold text-xs">
                Converted Petition Filed
              </span>
            )}
          </div>

          {/* Section 1: Administrative Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              Section 1 &ndash; Administrative Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><strong className="text-slate-500">Circle:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.circle} Circle</span></div>
              <div><strong className="text-slate-500">Division:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.division}</span></div>
              {caseData.lawyerName && (
                <div><strong className="text-slate-500">Assigned Legal Counsel:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.lawyerName}</span></div>
              )}
            </div>
          </div>

          {/* Section 2: Case Information */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              Section 2 &ndash; Case Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><strong className="text-slate-500">Case Number:</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{caseData.caseNumber}</span></div>
              <div><strong className="text-slate-500">Case Year:</strong> <span className="font-bold">{caseData.caseYear}</span></div>
              <div><strong className="text-slate-500">Category:</strong> <span className="font-bold">{caseData.category}</span></div>
              <div><strong className="text-slate-500">Name of Court:</strong> <span className="font-bold">{caseData.nameOfCourt}</span></div>
              <div><strong className="text-slate-500">Name of Respondent:</strong> <span className="font-bold">{caseData.nameOfRespondent}</span></div>
              <div><strong className="text-slate-500">Case Pertains To:</strong> <span className="font-bold">{caseData.casePertainsTo}</span></div>
              <div className="sm:col-span-2 md:col-span-3">
                <strong className="text-slate-500">Nature of Case:</strong>{' '}
                <span className="font-bold">
                  {caseData.natureOfCase} {caseData.natureOfCase === 'Other' && caseData.specifyNatureOfCase ? `(${caseData.specifyNatureOfCase})` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Brief of the Prayer:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                  {caseData.briefOfPrayer || 'N/A'}
                </p>
              </div>

              <div>
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Case Details & Present Status:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                  {caseData.caseDetailsPresentStatus || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Counter Affidavit & Post Hearing */}
          {caseData.counterAffidavitFiled === 'Yes' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Counter Affidavit Details (Filed)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div><strong className="text-slate-500">Date of Filing:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.dateOfFiling || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Last Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.lastHearingDate || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Next Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.nextHearingDate || 'N/A'}</span></div>
                </div>
                <div>
                  <strong className="text-slate-600 dark:text-slate-400 block mb-1">Counter Affidavit Details:</strong>
                  <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                    {caseData.counterAffidavitData?.details || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                    Post Hearing Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><strong className="text-slate-500">Order Date:</strong> <span className="font-bold">{caseData.postHearingData?.orderDate || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Compliance Period:</strong> <span className="font-bold">{caseData.postHearingData?.compliancePeriod || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">End Date Compliance:</strong> <span className="font-bold">{caseData.postHearingData?.endDateForCompliance || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Appeal Eligibility:</strong> <span className="font-bold">{caseData.postHearingData?.eligibilityForAppeal || 'No'}</span></div>
                </div>

                {caseData.postHearingData?.actionBeforeNextHearing && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Action to be Taken Before Next Hearing:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.postHearingData.actionBeforeNextHearing}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.interimOrFinalOrder && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Interim / Final Order:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.postHearingData.interimOrFinalOrder}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.statusOfActionTakenForCompliance && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Status of Action Taken for Compliance:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.postHearingData.statusOfActionTakenForCompliance}
                    </p>
                  </div>
                )}

                {caseData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Action Taken for Appeal:</strong>
                    <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.postHearingData.actionTakenForAppeal || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Pending Counter Affidavit Action Required
                </h4>
              </div>
              <div>
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Action to be Taken to File Counter Affidavit:</strong>
                <p className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-amber-100 dark:border-amber-900 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                  {caseData.actionToTakeForCounterAffidavit || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Module 2: Converted Case Proceedings */}
          {caseData.convertedCase?.enabled && (
            <div className="border-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Gavel className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    MODULE 2: Converted Case Proceedings
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Appeal / Petition Proceedings Details
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div><strong className="text-slate-500">Converted Category:</strong> <span className="font-bold">{caseData.convertedCase.category}</span></div>
                <div><strong className="text-slate-500">Type of Petition:</strong> <span className="font-bold">{caseData.convertedCase.typeOfPetition} {caseData.convertedCase.typeOfPetition === 'Other' && caseData.convertedCase.specifyPetitionType ? `(${caseData.convertedCase.specifyPetitionType})` : ''}</span></div>
                <div><strong className="text-slate-500">Converted Case Number:</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{caseData.convertedCase.caseNumber}</span></div>
                <div><strong className="text-slate-500">Converted Case Year:</strong> <span className="font-bold">{caseData.convertedCase.caseYear}</span></div>
                <div><strong className="text-slate-500">State:</strong> <span className="font-bold">{caseData.convertedCase.state}</span></div>
                <div><strong className="text-slate-500">District:</strong> <span className="font-bold">{caseData.convertedCase.district}</span></div>
                <div><strong className="text-slate-500">Court Complex:</strong> <span className="font-bold">{caseData.convertedCase.courtComplex}</span></div>
                <div><strong className="text-slate-500">Petitioner Name:</strong> <span className="font-bold">{caseData.convertedCase.petitionerName}</span></div>
                <div><strong className="text-slate-500">Respondent Name:</strong> <span className="font-bold">{caseData.convertedCase.respondentName}</span></div>
                {caseData.convertedCase.impugnedCaseNumber && (
                  <div><strong className="text-slate-500">Impugned Case Number:</strong> <span className="font-bold">{caseData.convertedCase.impugnedCaseNumber}</span></div>
                )}
                {caseData.convertedCase.orderIssued && (
                  <div><strong className="text-slate-500">Order Issued:</strong> <span className="font-bold">{caseData.convertedCase.orderIssued}</span></div>
                )}
                {caseData.convertedCase.orderDate && (
                  <div><strong className="text-slate-500">Order Date:</strong> <span className="font-bold">{caseData.convertedCase.orderDate}</span></div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <strong className="text-slate-600 dark:text-slate-400 block mb-1">Brief of Prayer (Petition):</strong>
                  <p className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                    {caseData.convertedCase.briefOfPrayer || 'N/A'}
                  </p>
                </div>

                {caseData.convertedCase.caseDetailsPresentStatus && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Case Details & Present Status (Petition):</strong>
                    <p className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.convertedCase.caseDetailsPresentStatus}
                    </p>
                  </div>
                )}
              </div>

              {/* Converted Case Counter Affidavit & Post Hearing */}
              {caseData.convertedCase.counterAffidavitFiled === 'Yes' ? (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        Petition Counter Affidavit Details (Filed)
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div><strong className="text-slate-500">Date of Filing:</strong> <span className="font-bold">{caseData.convertedCase.counterAffidavitData?.dateOfFiling || 'N/A'}</span></div>
                      <div><strong className="text-slate-500">Last Hearing Date:</strong> <span className="font-bold">{caseData.convertedCase.counterAffidavitData?.lastHearingDate || 'N/A'}</span></div>
                      <div><strong className="text-slate-500">Next Hearing Date:</strong> <span className="font-bold">{caseData.convertedCase.counterAffidavitData?.nextHearingDate || 'N/A'}</span></div>
                    </div>
                    {caseData.convertedCase.counterAffidavitData?.details && (
                      <div>
                        <strong className="text-slate-600 dark:text-slate-400 block mb-1">Counter Affidavit Details:</strong>
                        <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                          {caseData.convertedCase.counterAffidavitData.details}
                        </p>
                      </div>
                    )}
                  </div>

                  {caseData.convertedCase.postHearingData && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h5 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                          Petition Post Hearing Details
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div><strong className="text-slate-500">Order Date:</strong> <span className="font-bold">{caseData.convertedCase.postHearingData.orderDate || 'N/A'}</span></div>
                        <div><strong className="text-slate-500">Compliance Period:</strong> <span className="font-bold">{caseData.convertedCase.postHearingData.compliancePeriod || 'N/A'}</span></div>
                        <div><strong className="text-slate-500">End Date Compliance:</strong> <span className="font-bold">{caseData.convertedCase.postHearingData.endDateForCompliance || 'N/A'}</span></div>
                      </div>
                      {caseData.convertedCase.postHearingData.actionBeforeNextHearing && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 block mb-1">Action Before Next Hearing:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                            {caseData.convertedCase.postHearingData.actionBeforeNextHearing}
                          </p>
                        </div>
                      )}
                      {caseData.convertedCase.postHearingData.interimOrFinalOrder && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 block mb-1">Interim / Final Order:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                            {caseData.convertedCase.postHearingData.interimOrFinalOrder}
                          </p>
                        </div>
                      )}
                      {caseData.convertedCase.postHearingData.statusOfActionTakenForCompliance && (
                        <div>
                          <strong className="text-slate-600 dark:text-slate-400 block mb-1">Status of Action Taken for Compliance:</strong>
                          <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                            {caseData.convertedCase.postHearingData.statusOfActionTakenForCompliance}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                caseData.convertedCase.actionToTakeForCounterAffidavit && (
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h5 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        Petition Pending Counter Affidavit Action Required
                      </h5>
                    </div>
                    <p className="bg-white dark:bg-slate-900 p-3 rounded-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                      {caseData.convertedCase.actionToTakeForCounterAffidavit}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* 2. FORMAL OFFICIAL LEGAL DOCUMENT TEMPLATE (Active ONLY when printing / exporting PDF) */}
      <div className="print-only-document hidden print:block p-8 bg-white text-slate-900 text-xs font-serif leading-relaxed">
        {/* Official Document Header / Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900 font-serif">
            GOVERNMENT OF TAMIL NADU
          </h1>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mt-1 font-serif">
            HIGHWAYS DEPARTMENT &bull; LEGAL LITIGATION CELL
          </h2>
          <p className="text-[11px] uppercase font-sans tracking-widest text-slate-600 mt-1">
            OFFICIAL CASE RECORD & LITIGATION BRIEF REPORT
          </p>
        </div>

        {/* Document Information Bar */}
        <div className="flex justify-between items-center bg-slate-100 p-3 border border-slate-400 rounded mb-6 text-xs font-sans">
          <div>
            <span className="font-bold text-slate-700">Case No:</span>{' '}
            <span className="font-extrabold text-blue-950">{caseData.caseNumber}</span> ({caseData.caseYear})
          </div>
          <div>
            <span className="font-bold text-slate-700">Jurisdiction:</span>{' '}
            <span>{caseData.circle} Circle &bull; {caseData.division} Division</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Report Date:</span>{' '}
            <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Section 1: Administrative Details */}
        <div className="mb-6">
          <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            1. ADMINISTRATIVE ASSIGNMENT
          </h3>
          <table className="w-full text-xs border-collapse border border-slate-400 font-serif">
            <tbody>
              <tr>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Circle Name:</td>
                <td className="p-2 border border-slate-400 w-1/4">{caseData.circle} Circle</td>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Division Name:</td>
                <td className="p-2 border border-slate-400 w-1/4">{caseData.division}</td>
              </tr>
              {caseData.lawyerName && (
                <tr>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Assigned Legal Counsel:</td>
                  <td colSpan={3} className="p-2 border border-slate-400 font-bold">{caseData.lawyerName}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Case Particulars */}
        <div className="mb-6">
          <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            2. CASE PARTICULARS & PRAYER
          </h3>
          <table className="w-full text-xs border-collapse border border-slate-400 mb-4 font-serif">
            <tbody>
              <tr>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/6">Case Number:</td>
                <td className="p-2 border border-slate-400 w-2/6 font-bold text-slate-900">{caseData.caseNumber}</td>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/6">Case Year:</td>
                <td className="p-2 border border-slate-400 w-2/6">{caseData.caseYear}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400">Category:</td>
                <td className="p-2 border border-slate-400">{caseData.category}</td>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400">Case Pertains To:</td>
                <td className="p-2 border border-slate-400">{caseData.casePertainsTo}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400">Name of Court:</td>
                <td className="p-2 border border-slate-400">{caseData.nameOfCourt}</td>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400">Respondent Name:</td>
                <td className="p-2 border border-slate-400">{caseData.nameOfRespondent}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-bold p-2 border border-slate-400">Nature of Case:</td>
                <td colSpan={3} className="p-2 border border-slate-400 font-semibold">
                  {caseData.natureOfCase} {caseData.natureOfCase === 'Other' && caseData.specifyNatureOfCase ? `(${caseData.specifyNatureOfCase})` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-4">
            <div className="border border-slate-400 p-3 bg-slate-50/40">
              <h4 className="font-bold text-xs text-slate-900 uppercase mb-1 font-sans">Brief Summary of Prayer Requested:</h4>
              <p className="text-slate-900 whitespace-pre-wrap">{caseData.briefOfPrayer || 'N/A'}</p>
            </div>

            <div className="border border-slate-400 p-3 bg-slate-50/40">
              <h4 className="font-bold text-xs text-slate-900 uppercase mb-1 font-sans">Case Details & Present Status:</h4>
              <p className="text-slate-900 whitespace-pre-wrap">{caseData.caseDetailsPresentStatus || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Counter Affidavit & Post Hearing Proceedings */}
        <div className="mb-6">
          <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
            3. COUNTER AFFIDAVIT & POST HEARING PROCEEDINGS
          </h3>

          <div className="mb-3 font-sans text-xs">
            <span className="font-bold">Counter Affidavit Filing Status: </span>
            <span className={`font-bold px-2.5 py-0.5 border ${caseData.counterAffidavitFiled === 'Yes' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-amber-50 border-amber-600 text-amber-900'}`}>
              {caseData.counterAffidavitFiled === 'Yes' ? 'COUNTER AFFIDAVIT FILED' : 'COUNTER AFFIDAVIT PENDING'}
            </span>
          </div>

          {caseData.counterAffidavitFiled === 'Yes' ? (
            <div className="space-y-4">
              <table className="w-full text-xs border-collapse border border-slate-400 font-serif">
                <tbody>
                  <tr>
                    <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Date of Filing:</td>
                    <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Last Hearing Date:</td>
                    <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Next Hearing Date:</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-400 font-bold">{caseData.counterAffidavitData?.dateOfFiling || 'N/A'}</td>
                    <td className="p-2 border border-slate-400">{caseData.counterAffidavitData?.lastHearingDate || 'N/A'}</td>
                    <td className="p-2 border border-slate-400">{caseData.counterAffidavitData?.nextHearingDate || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>

              {caseData.counterAffidavitData?.details && (
                <div className="border border-slate-400 p-3 bg-slate-50/40">
                  <h4 className="font-bold text-xs text-slate-900 uppercase mb-1 font-sans">Counter Affidavit Arguments & Defense Details:</h4>
                  <p className="text-slate-900 whitespace-pre-wrap">{caseData.counterAffidavitData.details}</p>
                </div>
              )}

              {/* Post Hearing Table */}
              <div className="border border-slate-400 p-3 bg-slate-50/40 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase font-sans border-b border-slate-300 pb-1">Post Hearing Orders & Compliance Tracker</h4>
                <table className="w-full text-xs border-collapse border border-slate-400 font-serif">
                  <tbody>
                    <tr>
                      <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Order Date:</td>
                      <td className="p-2 border border-slate-400 w-1/4">{caseData.postHearingData?.orderDate || 'N/A'}</td>
                      <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Compliance Period:</td>
                      <td className="p-2 border border-slate-400 w-1/4">{caseData.postHearingData?.compliancePeriod || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-100 font-bold p-2 border border-slate-400">End Date for Compliance:</td>
                      <td className="p-2 border border-slate-400">{caseData.postHearingData?.endDateForCompliance || 'N/A'}</td>
                      <td className="bg-slate-100 font-bold p-2 border border-slate-400">Appeal Eligibility:</td>
                      <td className="p-2 border border-slate-400 font-bold">{caseData.postHearingData?.eligibilityForAppeal || 'No'}</td>
                    </tr>
                  </tbody>
                </table>

                {caseData.postHearingData?.actionBeforeNextHearing && (
                  <div>
                    <strong className="font-bold text-xs font-sans block mb-0.5">Action to be Taken Before Next Hearing Date:</strong>
                    <p className="text-slate-900 whitespace-pre-wrap">{caseData.postHearingData.actionBeforeNextHearing}</p>
                  </div>
                )}

                {caseData.postHearingData?.interimOrFinalOrder && (
                  <div>
                    <strong className="font-bold text-xs font-sans block mb-0.5">Interim / Final Order Details:</strong>
                    <p className="text-slate-900 whitespace-pre-wrap">{caseData.postHearingData.interimOrFinalOrder}</p>
                  </div>
                )}

                {caseData.postHearingData?.statusOfActionTakenForCompliance && (
                  <div>
                    <strong className="font-bold text-xs font-sans block mb-0.5">Status of Action Taken Towards Compliance:</strong>
                    <p className="text-slate-900 whitespace-pre-wrap">{caseData.postHearingData.statusOfActionTakenForCompliance}</p>
                  </div>
                )}

                {caseData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                  <div>
                    <strong className="font-bold text-xs font-sans block mb-0.5 text-blue-950">Action Taken for Appeal:</strong>
                    <p className="text-slate-900 whitespace-pre-wrap">{caseData.postHearingData.actionTakenForAppeal || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-slate-400 p-3 bg-amber-50/20">
              <h4 className="font-bold text-xs text-amber-950 uppercase mb-1 font-sans">Action Required for Pending Counter Affidavit:</h4>
              <p className="text-slate-900 whitespace-pre-wrap">{caseData.actionToTakeForCounterAffidavit || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Section 4: Module 2 Converted Case Proceedings */}
        {caseData.convertedCase?.enabled && (
          <div className="mb-6">
            <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
              4. MODULE 2: CONVERTED CASE PROCEEDINGS & APPEAL DETAILS
            </h3>

            <table className="w-full text-xs border-collapse border border-slate-400 mb-4 font-serif">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Converted Category:</td>
                  <td className="p-2 border border-slate-400 w-1/4">{caseData.convertedCase.category}</td>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/4">Type of Petition:</td>
                  <td className="p-2 border border-slate-400 w-1/4">
                    {caseData.convertedCase.typeOfPetition} {caseData.convertedCase.typeOfPetition === 'Other' && caseData.convertedCase.specifyPetitionType ? `(${caseData.convertedCase.specifyPetitionType})` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Converted Case Number:</td>
                  <td className="p-2 border border-slate-400 font-bold">{caseData.convertedCase.caseNumber}</td>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Case Year:</td>
                  <td className="p-2 border border-slate-400">{caseData.convertedCase.caseYear}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">State / District:</td>
                  <td className="p-2 border border-slate-400">{caseData.convertedCase.state} &bull; {caseData.convertedCase.district}</td>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Court Complex:</td>
                  <td className="p-2 border border-slate-400">{caseData.convertedCase.courtComplex}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Petitioner Name:</td>
                  <td className="p-2 border border-slate-400">{caseData.convertedCase.petitionerName}</td>
                  <td className="bg-slate-100 font-bold p-2 border border-slate-400">Respondent Name:</td>
                  <td className="p-2 border border-slate-400">{caseData.convertedCase.respondentName}</td>
                </tr>
                {caseData.convertedCase.impugnedCaseNumber && (
                  <tr>
                    <td className="bg-slate-100 font-bold p-2 border border-slate-400">Impugned Case Number:</td>
                    <td colSpan={3} className="p-2 border border-slate-400 font-bold">{caseData.convertedCase.impugnedCaseNumber}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="space-y-4">
              <div className="border border-slate-400 p-3 bg-slate-50/40">
                <h4 className="font-bold text-xs text-slate-900 uppercase mb-1 font-sans">Brief of Prayer (Petition):</h4>
                <p className="text-slate-900 whitespace-pre-wrap">{caseData.convertedCase.briefOfPrayer || 'N/A'}</p>
              </div>

              {caseData.convertedCase.caseDetailsPresentStatus && (
                <div className="border border-slate-400 p-3 bg-slate-50/40">
                  <h4 className="font-bold text-xs text-slate-900 uppercase mb-1 font-sans">Case Details & Present Status (Petition):</h4>
                  <p className="text-slate-900 whitespace-pre-wrap">{caseData.convertedCase.caseDetailsPresentStatus}</p>
                </div>
              )}

              {/* Converted Case Counter Affidavit & Post Hearing */}
              {caseData.convertedCase.counterAffidavitFiled === 'Yes' ? (
                <div className="border border-slate-400 p-3 bg-slate-50/40 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 uppercase font-sans border-b border-slate-300 pb-1">Petition Counter Affidavit Details</h4>
                  <table className="w-full text-xs border-collapse border border-slate-400 font-serif">
                    <tbody>
                      <tr>
                        <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Date of Filing:</td>
                        <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Last Hearing Date:</td>
                        <td className="bg-slate-100 font-bold p-2 border border-slate-400 w-1/3">Next Hearing Date:</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-400">{caseData.convertedCase.counterAffidavitData?.dateOfFiling || 'N/A'}</td>
                        <td className="p-2 border border-slate-400">{caseData.convertedCase.counterAffidavitData?.lastHearingDate || 'N/A'}</td>
                        <td className="p-2 border border-slate-400">{caseData.convertedCase.counterAffidavitData?.nextHearingDate || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {caseData.convertedCase.counterAffidavitData?.details && (
                    <p className="text-slate-900 whitespace-pre-wrap pt-1">{caseData.convertedCase.counterAffidavitData.details}</p>
                  )}
                </div>
              ) : (
                caseData.convertedCase.actionToTakeForCounterAffidavit && (
                  <div className="border border-slate-400 p-3 bg-amber-50/20">
                    <h4 className="font-bold text-xs text-amber-950 uppercase mb-1 font-sans">Petition Counter Affidavit Action Required:</h4>
                    <p className="text-slate-900 whitespace-pre-wrap">{caseData.convertedCase.actionToTakeForCounterAffidavit}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Official Document Footer */}
        <div className="mt-8 pt-4 border-t border-slate-400 flex justify-between items-center text-[10px] font-sans text-slate-600">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-800">Highways Department Legal Cell &bull; Government of Tamil Nadu</p>
            <p>Confidential Litigation Record &bull; For Official Use Only</p>
          </div>
          <div className="text-right">
            <p>Case Ref ID: <span className="font-mono font-bold">{caseData.caseNumber}</span></p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseViewModal;
