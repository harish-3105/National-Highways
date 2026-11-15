'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  Lock,
  ArrowRight,
  Landmark,
  Layers,
  FileCheck2,
  Info,
} from 'lucide-react';

export function DemoIntimationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if the visitor has already acknowledged the intimation in this session
    const acknowledged = sessionStorage.getItem('tnhighways_demo_intimation_seen');
    if (!acknowledged) {
      setIsOpen(true);
    }

    // Listen to custom event to re-open modal if user clicks the header pill
    const handleReopen = () => setIsOpen(true);
    window.addEventListener('open-demo-intimation', handleReopen);
    return () => window.removeEventListener('open-demo-intimation', handleReopen);
  }, []);

  const handleContinue = () => {
    sessionStorage.setItem('tnhighways_demo_intimation_seen', 'true');
    setIsOpen(false);
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-intimation-title"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Government Top Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                  PWD TN
                </span>
                <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                  Government of Tamil Nadu
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Tamil Nadu National Highways Department
              </h2>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Recruiter & HR Demo
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {/* Main Notice Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 id="demo-intimation-title" className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-1">
                  Public Portfolio Demonstration Environment
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This system is a full-scale web platform built for and actively deployed in the <strong>Tamil Nadu National Highways Department (PWD)</strong> for linear corridor management, capital works governance, and judicial proceedings.
                </p>
              </div>
            </div>
          </div>

          {/* Key Security & Demonstration Adjustments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Point 1: Supabase Decoupled */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Database className="w-4 h-4 shrink-0" />
                <span>Cloud Supabase Decoupled</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                For strict departmental cyber-security, data confidentiality, and statutory guidelines, the live Cloud Supabase PostgreSQL database has been decoupled for this public evaluation.
              </p>
            </div>

            {/* Point 2: Authentication Removed */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Authentication Bypassed</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Two-Factor mobile phone login (TOTP) and hierarchical permission walls have been disabled. You have been provisioned with <strong>Statewide Super-Administrator</strong> privileges to explore everything freely.
              </p>
            </div>

            {/* Point 3: High-Fidelity Local Dataset */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Realistic High-Fidelity Data</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Loaded with authentic Tamil Nadu highway corridors (NH-44, NH-45, NH-83, etc.), sub-chainages with PCU traffic counts, capital project stages, court cases, and fee audits.
              </p>
            </div>

            {/* Point 4: Interactive Functionality */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span>Fully Interactive Experience</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Test the Straight-Line Diagram (SLD) print engine, search and cascading filters, entry modals, Master Configuration console, and Excel workbook exports.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer with Continue Button */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Click continue to enter the dashboard.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
          >
            <span>Continue to Demonstration Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
