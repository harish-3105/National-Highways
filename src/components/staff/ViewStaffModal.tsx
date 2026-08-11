"use client";

import React from "react";
import { X, User, Building, Phone, Mail, Award, MapPin, Briefcase } from "lucide-react";
import { StaffMember } from "./StaffTypes";

interface ViewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
}

export const ViewStaffModal: React.FC<ViewStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Banner */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold">
              {staff.name ? staff.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white tracking-wide uppercase">
                {staff.designation || "Department Staff"}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{staff.name}</h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>{staff.office || "National Highways Department"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Contact No</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {staff.contact_no || "Not Provided"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {staff.emailid || "Not Provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Organizational Hierarchy Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Organizational Deployment Hierarchy</span>
            </h3>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              <div className="px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Circle</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {staff.circle || "—"}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Division</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {staff.division || "—"}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sub-Division</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {staff.sub_division || "—"}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Section</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {staff.section || "—"}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sub-Section</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {staff.sub_section || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
