'use client';

import React from 'react';
import { LegalCaseData } from '@/types/legal';
import {
  X,
  Printer,
  FileText,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Scale,
  Calendar,
  Building,
} from 'lucide-react';

interface CaseViewModalProps {
  caseData: LegalCaseData;
  onClose: () => void;
  onEdit?: (c: LegalCaseData) => void;
}

export const CaseViewModal: React.FC<CaseViewModalProps> = ({ caseData, onClose, onEdit }) => {
  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isAppeal = caseData.caseClassification === 'Appeal Case';

  return (
    <div
      className="legal-print-modal-wrapper fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="legal-print-card bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between print:bg-blue-950 print:text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl shrink-0 print:hidden">
              {isAppeal ? <Gavel className="w-5 h-5 text-amber-300" /> : <Scale className="w-5 h-5 text-blue-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {caseData.caseNumber} ({caseData.caseYear})
                </h3>
                <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {caseData.caseClassification}
                </span>
              </div>
              <span className="text-xs text-blue-200 print:text-blue-100">
                {caseData.circle} Circle &bull; {caseData.division} &bull; {caseData.nameOfCourt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hide">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(caseData);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Edit Case
              </button>
            )}
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
          {/* Departmental Print Letterhead Header */}
          <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-4">
            <h2 className="font-extrabold text-base text-slate-950 uppercase tracking-wide">
              Highways Department &bull; Government of Tamil Nadu
            </h2>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              Legal Cell &bull; {caseData.circle} Circle ({caseData.division})
            </p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              Litigation Docket &bull; Case No: {caseData.caseNumber} ({caseData.caseYear}) &bull; Classification: {caseData.caseClassification} &bull; Generated: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>

          {/* Quick Status Badges Strip */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="bg-blue-900 text-white px-3 py-1 rounded-lg font-bold text-xs">
              {caseData.caseType}
            </span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg font-bold text-xs print:bg-blue-200 print:text-blue-950">
              {caseData.category}
            </span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg font-bold text-xs print:bg-slate-300 print:text-slate-900">
              Pertains to: {caseData.casePertainsTo}
            </span>
            <span
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                caseData.caFiled === 'Yes'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 print:bg-emerald-200 print:text-emerald-950'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 print:bg-amber-200 print:text-amber-950'
              }`}
            >
              Counter Affidavit: {caseData.caFiled === 'Yes' ? 'Filed' : 'Pending'}
            </span>
            <span
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                caseData.currentStatus === 'Disposed'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              Status: {caseData.currentStatus}
            </span>
            {caseData.adverseToDepartment === 'Yes' && (
              <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 px-3 py-1 rounded-lg font-bold text-xs">
                ⚠️ Adverse to Dept
              </span>
            )}
          </div>

          {/* SECTION A: APPEAL CASE INFORMATION (If Appeal Case) */}
          {isAppeal && caseData.appealInfo && (
            <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-xl p-5 space-y-4 print:border-amber-400 print:bg-amber-50">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                    A. Appeal Case Information
                  </h4>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded">
                  Appellate Track
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <strong className="text-slate-500 block">Appeal Level:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.appealInfo.appealLevel}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Appeal Case Type:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.appealInfo.appealCaseType}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Appeal Case Number:</strong>
                  <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">{caseData.appealInfo.appealCaseNumber} ({caseData.appealInfo.appealYear})</span>
                </div>
                <div className="sm:col-span-2">
                  <strong className="text-slate-500 block">Appellate Court:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.appealInfo.appellateCourt}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Condonation of Delay:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.appealInfo.condonationOfDelay}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Appeal Filing Date:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.appealInfo.appealFilingDate || 'N/A'}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Limitation / Due Date:</strong>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.appealInfo.limitationDueDate || 'N/A'}</span>
                </div>
                <div>
                  <strong className="text-slate-500 block">Delay Calculation:</strong>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      caseData.appealInfo.delayInFilingAppeal === 'Yes' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {caseData.appealInfo.delayInFilingAppeal === 'Yes'
                      ? `⚠️ Delayed by ${caseData.appealInfo.delayPeriodDays} days`
                      : '✓ Filed in time (0 days delay)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B.1: CASE INFORMATION */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">
              B. Case Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <strong className="text-slate-500 block">Case Type:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.caseType}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Case Number & Year:</strong>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{caseData.caseNumber} ({caseData.caseYear})</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Category:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.category}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Circle Jurisdiction:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.circle} Circle</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Division Jurisdiction:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.division}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Name of Court:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.nameOfCourt}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Case Pertains To:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.casePertainsTo}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Nature of Case:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {caseData.natureOfCase} {caseData.specifyNatureOfCase ? `(${caseData.specifyNatureOfCase})` : ''}
                </span>
              </div>
              <div>
                <strong className="text-slate-500 block">Financial Implication:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.financialImplication || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Present Stage:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.presentStage}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Current Status:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.currentStatus}</span>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-500 block mb-1">Name of Petitioner(s):</strong>
                <p className="font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{caseData.petitionerNames || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-500 block mb-1">Name of Respondent(s):</strong>
                <p className="font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{caseData.respondentNames || 'N/A'}</p>
              </div>
            </div>

            {/* Brief of Prayer */}
            <div className="pt-2">
              <strong className="text-slate-500 block mb-1">Brief of the Prayer:</strong>
              <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                {caseData.briefOfPrayer || 'N/A'}
              </p>
            </div>
          </div>

          {/* SECTION B.2: CA (COUNTER AFFIDAVIT) INFORMATION */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              CA (Counter Affidavit) Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <strong className="text-slate-500 block">CA Required:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.caRequired}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">CA Filed:</strong>
                <span className={`font-bold ${caseData.caFiled === 'Yes' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {caseData.caFiled}
                </span>
              </div>
              <div>
                <strong className="text-slate-500 block">CA Due Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.caDueDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">CA Filed Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.caFiledDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION B.3: HEARING & ORDERS */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Hearing & Orders
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <strong className="text-slate-500 block">Last Hearing Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.lastHearingDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Next Hearing Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.nextHearingDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Next Listing Purpose:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.nextListingPurpose || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <strong className="text-slate-500 block">Interim Order / Direction:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.interimOrderDirection || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Interim Order Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.interimOrderDate || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <strong className="text-slate-500 block">Latest Order / Final Order:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.latestOrderFinalOrder || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Latest Order Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.latestOrderDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION B.4: COMPLIANCE (GENERAL / INTERIM) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Compliance (Interim Directions)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <strong className="text-slate-500 block">Compliance Required:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.complianceRequired}</span>
              </div>
              <div className="sm:col-span-2">
                <strong className="text-slate-500 block">Compliance Action:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.complianceAction || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance Period:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.compliancePeriod || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance End Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.complianceEndDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance Status:</strong>
                <span className={`font-bold ${caseData.complianceStatus === 'Complied' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {caseData.complianceStatus || 'Pending'}
                </span>
              </div>
              <div className="sm:col-span-3">
                <strong className="text-slate-500 block">Action Taken Details for Compliance:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.actionTakenDetailsForCompliance || 'N/A'}</span>
              </div>
              {caseData.remarks && (
                <div className="sm:col-span-3">
                  <strong className="text-slate-500 block">Remarks:</strong>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{caseData.remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B.5 & B.6: FINAL RESULT, GP OPINION & APPEAL */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Final Result, GP Opinion & Appeal
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <strong className="text-slate-500 block">Final Result (Concluded?):</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalResult}</span>
              </div>
              <div className="sm:col-span-2">
                <strong className="text-slate-500 block">Final Result Order:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalResultOrder || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Final Order Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.finalOrderDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Adverse to Department:</strong>
                <span className={`font-bold ${caseData.adverseToDepartment === 'Yes' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {caseData.adverseToDepartment}
                </span>
              </div>
              <div>
                <strong className="text-slate-500 block">GP Opinion:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.gpOpinion}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Appeal Filed:</strong>
                <span className={`font-bold ${caseData.appealFiled === 'Yes' ? 'text-amber-600' : 'text-slate-700'}`}>
                  {caseData.appealFiled}
                </span>
              </div>
              <div>
                <strong className="text-slate-500 block">Appeal Filed Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.appealFiledDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION B.7: FINAL-ORDER COMPLIANCE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h4 className="font-extrabold text-xs text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              Final-Order Compliance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <strong className="text-slate-500 block">Compliance Action Given in Final Order:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalOrderComplianceActionGiven || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance Action:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalOrderComplianceAction || 'No'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance Period:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalOrderCompliancePeriod || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance End Date:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{caseData.finalOrderComplianceEndDate || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-500 block">Compliance Status:</strong>
                <span className={`font-bold ${caseData.finalOrderComplianceStatus === 'Complied' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {caseData.finalOrderComplianceStatus || 'Pending'}
                </span>
              </div>
              <div className="sm:col-span-3">
                <strong className="text-slate-500 block">Compliance Action Taken:</strong>
                <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.finalOrderComplianceActionTaken || 'N/A'}</span>
              </div>
              {caseData.finalOrderRemarks && (
                <div className="sm:col-span-3">
                  <strong className="text-slate-500 block">Compliance Remarks:</strong>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{caseData.finalOrderRemarks}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between print-hide">
          <span className="text-xs text-slate-500">
            Last Updated: {caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleString('en-IN') : 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseViewModal;
