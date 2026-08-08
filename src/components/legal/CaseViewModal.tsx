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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Legal Case Record Details
              </h3>
              <span className="text-xs text-blue-200">
                Case No: {caseData.caseNumber} ({caseData.caseYear}) &bull; {caseData.circle} Circle
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Record
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
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
              Administrative Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Circle:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.circle} Circle</span></div>
              <div><strong className="text-slate-500">Division:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.division}</span></div>
            </div>
          </div>

          {/* Section 2: Case Information */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              Case Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><strong className="text-slate-500">Case Number:</strong> <span className="font-bold text-blue-600">{caseData.caseNumber}</span></div>
              <div><strong className="text-slate-500">Case Year:</strong> <span className="font-bold">{caseData.caseYear}</span></div>
              <div><strong className="text-slate-500">Name of Court:</strong> <span className="font-bold">{caseData.nameOfCourt}</span></div>
              <div><strong className="text-slate-500">Name of Respondent:</strong> <span className="font-bold">{caseData.nameOfRespondent}</span></div>
              <div><strong className="text-slate-500">Case Pertains To:</strong> <span className="font-bold">{caseData.casePertainsTo}</span></div>
              <div><strong className="text-slate-500">Nature of Case:</strong> <span className="font-bold">{caseData.natureOfCase} {caseData.natureOfCase === 'Other' ? `(${caseData.specifyNatureOfCase})` : ''}</span></div>
            </div>

            <div className="space-y-2 pt-2">
              <div>
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Brief of the Prayer:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {caseData.briefOfPrayer}
                </p>
              </div>

              <div>
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Case Details & Present Status:</strong>
                <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {caseData.caseDetailsPresentStatus}
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
                    Counter Affidavit Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div><strong className="text-slate-500">Date of Filing:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.dateOfFiling || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Last Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.lastHearingDate || 'N/A'}</span></div>
                  <div><strong className="text-slate-500">Next Hearing Date:</strong> <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.counterAffidavitData?.nextHearingDate || 'N/A'}</span></div>
                </div>
                <div>
                  <strong className="text-slate-600 dark:text-slate-400 block mb-1">Details:</strong>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{caseData.counterAffidavitData?.details}</p>
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
                {caseData.postHearingData?.interimOrFinalOrder && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Interim / Final Order:</strong>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{caseData.postHearingData.interimOrFinalOrder}</p>
                  </div>
                )}
                {caseData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                  <div>
                    <strong className="text-slate-600 dark:text-slate-400 block mb-1">Action Taken for Appeal:</strong>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{caseData.postHearingData.actionTakenForAppeal}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Pending Counter Affidavit Action
                </h4>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium">{caseData.actionToTakeForCounterAffidavit}</p>
            </div>
          )}

          {/* Module 2: Converted Case Proceedings */}
          {caseData.convertedCase?.enabled && (
            <div className="border-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Converted Case Proceedings
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div><strong className="text-slate-500">Category:</strong> <span className="font-bold">{caseData.convertedCase.category}</span></div>
                <div><strong className="text-slate-500">Type of Petition:</strong> <span className="font-bold">{caseData.convertedCase.typeOfPetition} {caseData.convertedCase.typeOfPetition === 'Other' ? `(${caseData.convertedCase.specifyPetitionType})` : ''}</span></div>
                <div><strong className="text-slate-500">Case Number:</strong> <span className="font-bold text-blue-600">{caseData.convertedCase.caseNumber}</span></div>
                <div><strong className="text-slate-500">Case Year:</strong> <span className="font-bold">{caseData.convertedCase.caseYear}</span></div>
                <div><strong className="text-slate-500">State:</strong> <span className="font-bold">{caseData.convertedCase.state}</span></div>
                <div><strong className="text-slate-500">District:</strong> <span className="font-bold">{caseData.convertedCase.district}</span></div>
                <div><strong className="text-slate-500">Court Complex:</strong> <span className="font-bold">{caseData.convertedCase.courtComplex}</span></div>
                <div><strong className="text-slate-500">Petitioner:</strong> <span className="font-bold">{caseData.convertedCase.petitionerName}</span></div>
                <div><strong className="text-slate-500">Respondent:</strong> <span className="font-bold">{caseData.convertedCase.respondentName}</span></div>
              </div>

              <div className="pt-2">
                <strong className="text-slate-600 dark:text-slate-400 block mb-1">Brief of Prayer (Petition):</strong>
                <p className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {caseData.convertedCase.briefOfPrayer}
                </p>
              </div>
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
    </div>
  );
};

export default CaseViewModal;
