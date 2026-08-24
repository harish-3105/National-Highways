'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  Award,
  MapPin,
  Briefcase,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { StaffMember } from './StaffTypes';

interface ViewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
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

export const ViewStaffModal: React.FC<ViewStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveStageIndex(0);
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
    }
  }, [isOpen, onClose]);

  if (!isOpen || !staff) return null;

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  const handleNextStage = () => {
    if (activeStageIndex < STAGES.length - 1) {
      setActiveStageIndex((prev) => prev + 1);
    }
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold">
              {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white tracking-wide uppercase">
                  {staff.designation || 'Department Officer'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{staff.name}</h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>{staff.office || 'National Highways Department'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2-STAGE LIFECYCLE SUB-NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStageIndex === idx;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Details Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800 dark:text-slate-200">
          {/* ========================================================= */}
          {/* STAGE 1: Personnel & Contact Details */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 1: Personnel Identity & Communications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Full Officer Name</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{staff.name}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Cadre / Designation</span>
                  <p className="font-bold text-blue-700 dark:text-blue-300 text-xs">{staff.designation || '—'}</p>
                </div>
              </div>

              {/* Contact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Official Mobile Contact</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {staff.contact_no || 'Not Provided'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Departmental Email Address</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {staff.emailid || 'Not Provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: 6-Tier Organizational Posting Hierarchy */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 2: 6-Tier Deployment Hierarchy
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">1. Office / Headquarters</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.office || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">2. Circle Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.circle || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">3. Division Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.division || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">4. Sub-Division Unit</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.sub_division || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">5. Section Level</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.section || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">6. Sub-Section Field Unit</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {staff.sub_section || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
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
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close Profile
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeStageIndex < STAGES.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
              >
                <span>Next: {STAGES[activeStageIndex + 1].label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStaffModal;
