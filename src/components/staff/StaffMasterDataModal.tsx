"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Settings, Check, AlertCircle } from "lucide-react";
import { StaffMasterConfig } from "./StaffTypes";

interface StaffMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterConfig: StaffMasterConfig;
  onRefresh: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  office: "Offices",
  circle: "Circles",
  division: "Divisions",
  sub_division: "Sub-Divisions",
  section: "Sections",
  sub_section: "Sub-Sections",
  designation: "Designations",
};

export const StaffMasterDataModal: React.FC<StaffMasterDataModalProps> = ({
  isOpen,
  onClose,
  masterConfig,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("office");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryItems = masterConfig.rawItems?.filter(
    (item) => item.category === activeCategory
  ) || [];

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/staff/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: activeCategory, value: newValue.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add option");

      setNewValue("");
      setSuccess(`Added "${json.value}" successfully`);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to add option");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (id?: string, value?: string) => {
    if (!confirm(`Are you sure you want to remove "${value}" from dropdown options?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = id
        ? `/api/staff/master-data?id=${id}`
        : `/api/staff/master-data?category=${activeCategory}&value=${encodeURIComponent(value || "")}`;

      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to delete option");

      setSuccess(`Removed "${value}" successfully`);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete option");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Staff Master Data Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage dynamic dropdown choices for staff entry forms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-full md:w-56 p-3 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
              const count =
                masterConfig.rawItems?.filter((i) => i.category === catKey).length || 0;
              const isActive = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => {
                    setActiveCategory(catKey);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{catLabel}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Options Panel */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span>{CATEGORY_LABELS[activeCategory]} Dropdown Options</span>
            </h3>

            {/* Notifications */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Add Form */}
            <form onSubmit={handleAddOption} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={`Add new ${CATEGORY_LABELS[activeCategory]} option...`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                disabled={loading}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60">
              {currentCategoryItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No custom options added for {CATEGORY_LABELS[activeCategory]} yet.
                </div>
              ) : (
                currentCategoryItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.value}
                    </span>
                    <button
                      onClick={() => handleDeleteOption(item.id, item.value)}
                      disabled={loading}
                      title="Delete option"
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
