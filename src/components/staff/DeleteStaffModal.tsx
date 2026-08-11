"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { StaffMember } from "./StaffTypes";

interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: StaffMember | null;
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff?id=${staff.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete staff member");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            Delete Staff Record
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.name}</span> ({staff.designation || "Staff"})?
          </p>

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
