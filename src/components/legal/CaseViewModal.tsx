'use client';

import React from 'react';
import { CaseEntryFormData } from '@/types/legal';
import { X, Printer, FileText, Gavel } from 'lucide-react';

interface CaseViewModalProps {
  caseData: CaseEntryFormData;
  onClose: () => void;
}

export const CaseViewModal: React.FC<CaseViewModalProps> = ({ caseData, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-300" />
            <div>
              <h3 className="m-0 text-lg font-bold text-white">
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
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Record
            </button>
            <button
              onClick={onClose}
              className="p-1 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-slate-800 dark:text-slate-200 text-xs">
          {/* Status Badges Header */}
          <div className="flex flex-wrap gap-3 items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="bg-blue-900 text-white px-3 py-1 rounded-md font-bold">
              {caseData.caseNumber}
            </span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-md font-bold">
              {caseData.category}
            </span>
            <span
              className={`px-3 py-1 rounded-md font-bold ${
                caseData.counterAffidavitFiled === 'Yes'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                  : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200'
              }`}
            >
              Counter Affidavit: {caseData.counterAffidavitFiled === 'Yes' ? 'Filed' : 'Pending'}
            </span>
            {caseData.convertedCase?.enabled && (
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-md font-bold">
                Converted Petition Filed
              </span>
            )}
          </div>

          {/* Section 1: Administrative Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              Administrative Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><strong>Circle:</strong> {caseData.circle}</div>
              <div><strong>Division:</strong> {caseData.division}</div>
            </div>
          </div>

          {/* Section 2: Case Information */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              Case Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div><strong>Case Number:</strong> {caseData.caseNumber}</div>
              <div><strong>Case Year:</strong> {caseData.caseYear}</div>
              <div><strong>Name of Court:</strong> {caseData.nameOfCourt}</div>
              <div><strong>Name of Respondent:</strong> {caseData.nameOfRespondent}</div>
              <div><strong>Case Pertains To:</strong> {caseData.casePertainsTo}</div>
              <div>
                <strong>Nature of Case:</strong> {caseData.natureOfCase}{' '}
                {caseData.natureOfCase === 'Other' ? `(${caseData.specifyNatureOfCase})` : ''}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <strong>Brief of the Prayer:</strong>
                <p className="mt-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {caseData.briefOfPrayer}
                </p>
              </div>

              <div>
                <strong>Case Details & Present Status:</strong>
                <p className="mt-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {caseData.caseDetailsPresentStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Counter Affidavit Details & Post Hearing */}
          {caseData.counterAffidavitFiled === 'Yes' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Counter Affidavit Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><strong>Date of Filing:</strong> {caseData.counterAffidavitData?.dateOfFiling || 'N/A'}</div>
                  <div><strong>Last Hearing Date:</strong> {caseData.counterAffidavitData?.lastHearingDate || 'N/A'}</div>
                  <div><strong>Next Hearing Date:</strong> {caseData.counterAffidavitData?.nextHearingDate || 'N/A'}</div>
                </div>
                <div>
                  <strong>Details:</strong>
                  <p className="mt-1 text-emerald-900 dark:text-emerald-200">
                    {caseData.counterAffidavitData?.details}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Post Hearing Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div><strong>Order Date:</strong> {caseData.postHearingData?.orderDate || 'N/A'}</div>
                  <div><strong>Compliance Period:</strong> {caseData.postHearingData?.compliancePeriod || 'N/A'}</div>
                  <div><strong>End Date for Compliance:</strong> {caseData.postHearingData?.endDateForCompliance || 'N/A'}</div>
                  <div><strong>Appeal Eligibility:</strong> {caseData.postHearingData?.eligibilityForAppeal || 'No'}</div>
                </div>
                {caseData.postHearingData?.interimOrFinalOrder && (
                  <div>
                    <strong>Interim / Final Order:</strong>
                    <p className="mt-1 text-blue-900 dark:text-blue-200">{caseData.postHearingData.interimOrFinalOrder}</p>
                  </div>
                )}
                {caseData.postHearingData?.eligibilityForAppeal === 'Yes' && (
                  <div>
                    <strong>Action Taken for Appeal:</strong>
                    <p className="mt-1 text-blue-900 dark:text-blue-200">{caseData.postHearingData.actionTakenForAppeal}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 rounded-xl p-4">
              <h4 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-1">
                Pending Counter Affidavit Action
              </h4>
              <p className="text-orange-900 dark:text-orange-200">
                {caseData.actionToTakeForCounterAffidavit}
              </p>
            </div>
          )}

          {/* Module 2: Converted Case Proceedings */}
          {caseData.convertedCase?.enabled && (
            <div className="border border-slate-900 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Gavel className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Converted Case Proceedings
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div><strong>Category:</strong> {caseData.convertedCase.category}</div>
                <div>
                  <strong>Type of Petition:</strong> {caseData.convertedCase.typeOfPetition}{' '}
                  {caseData.convertedCase.typeOfPetition === 'Other' ? `(${caseData.convertedCase.specifyPetitionType})` : ''}
                </div>
                <div><strong>Case Number:</strong> {caseData.convertedCase.caseNumber}</div>
                <div><strong>Case Year:</strong> {caseData.convertedCase.caseYear}</div>
                <div><strong>State:</strong> {caseData.convertedCase.state}</div>
                <div><strong>District:</strong> {caseData.convertedCase.district}</div>
                <div><strong>Court Complex:</strong> {caseData.convertedCase.courtComplex}</div>
                <div><strong>Petitioner:</strong> {caseData.convertedCase.petitionerName}</div>
                <div><strong>Respondent:</strong> {caseData.convertedCase.respondentName}</div>
              </div>

              <div>
                <strong>Brief of Prayer (Petition):</strong>
                <p className="mt-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {caseData.convertedCase.briefOfPrayer}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseViewModal;
