"use client";

import React from "react";
import { Eye, Edit3, Trash2, Phone, Mail, Building, MapPin, Shield } from "lucide-react";
import { StaffMember } from "./StaffTypes";

interface StaffTableProps {
  staffList: StaffMember[];
  onView: (staff: StaffMember) => void;
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staffList,
  onView,
  onEdit,
  onDelete,
}) => {
  if (staffList.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-3 flex items-center justify-center">
          <Building className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Staff Members Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No staff records match your search or filter criteria. Click "Add Staff Member" to create a new record.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <th className="py-3.5 px-4">Staff Member</th>
            <th className="py-3.5 px-4">Designation</th>
            <th className="py-3.5 px-4">Office & Circle</th>
            <th className="py-3.5 px-4">Division & Section</th>
            <th className="py-3.5 px-4">Contact Details</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
          {staffList.map((member) => (
            <tr
              key={member.id}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group"
            >
              {/* Name */}
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                    {member.name ? member.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {member.name}
                    </span>
                    {member.sub_section && (
                      <span className="block text-[10px] text-slate-400">
                        {member.sub_section}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Designation */}
              <td className="py-3.5 px-4">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 inline-block">
                  {member.designation || "Staff"}
                </span>
              </td>

              {/* Office & Circle */}
              <td className="py-3.5 px-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {member.office || "—"}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {member.circle || "—"}
                  </span>
                </div>
              </td>

              {/* Division & Section */}
              <td className="py-3.5 px-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {member.division || "—"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {member.section ? `Sec: ${member.section}` : "—"}
                  </span>
                </div>
              </td>

              {/* Contact Details */}
              <td className="py-3.5 px-4">
                <div className="space-y-1">
                  {member.contact_no && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      {member.contact_no}
                    </span>
                  )}
                  {member.emailid && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3 text-blue-500" />
                      {member.emailid}
                    </span>
                  )}
                  {!member.contact_no && !member.emailid && (
                    <span className="text-slate-400 italic text-[11px]">No contact details</span>
                  )}
                </div>
              </td>

              {/* Actions */}
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(member)}
                    title="View Staff Profile"
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(member)}
                    title="Edit Staff Member"
                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(member)}
                    title="Delete Staff Record"
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
