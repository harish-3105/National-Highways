"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Settings,
  Search,
  RefreshCw,
  Building,
  MapPin,
  Briefcase,
  Layers,
  Filter,
  Archive,
  Eye,
  EyeOff,
} from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { StaffMember, StaffMasterConfig } from "./StaffTypes";

import { StaffTable } from "./StaffTable";
import { StaffEntryForm } from "./StaffEntryForm";
import { ViewStaffModal } from "./ViewStaffModal";
import { DeleteStaffModal } from "./DeleteStaffModal";
import { StaffMasterDataModal } from "./StaffMasterDataModal";
import { SearchableSelect } from "@/components/common/SearchableSelect";

export const StaffDashboard: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [masterConfig, setMasterConfig] = useState<StaffMasterConfig>({
    rawItems: [],
    offices: [],
    circles: [],
    divisions: [],
    sub_divisions: [],
    sections: [],
    sub_sections: [],
    designations: [],
  });

  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffMember | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");

  // Modals state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Fetch staff list & master config
  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const url = showArchived ? "/api/staff?include_deleted=true" : "/api/staff";
      const [staffRes, masterRes] = await Promise.all([
        fetch(url),
        fetch("/api/staff/master-data"),
      ]);

      const staffData = await staffRes.json();
      const masterData = await masterRes.json();

      if (Array.isArray(staffData)) {
        setStaffList(staffData);
      }
      if (masterData && masterData.offices) {
        setMasterConfig(masterData);
      }
    } catch (err) {
      console.error("Error loading staff dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [showArchived]);

  // Restore staff record callback
  const handleRestoreStaff = async (staff: StaffMember) => {
    try {
      const res = await fetch(`/api/staff?id=${staff.id}`, { method: "PATCH" });
      if (res.ok) {
        fetchStaffData();
      }
    } catch (err) {
      console.error("Error restoring staff member:", err);
    }
  };

  const handleSaveStaff = async (staffData: Partial<StaffMember>) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });
      if (res.ok) {
        setUiMode("LIST");
        setSelectedStaffForEdit(null);
        fetchStaffData();
      }
    } catch (err) {
      console.error("Failed to save staff member:", err);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.office?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.circle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.division?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contact_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.emailid?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCircle = !selectedCircle || m.circle === selectedCircle;
    const matchesDivision = !selectedDivision || m.division === selectedDivision;
    const matchesDesignation =
      !selectedDesignation || m.designation === selectedDesignation;

    return matchesSearch && matchesCircle && matchesDivision && matchesDesignation;
  });

  // Calculate KPI metrics
  const activeStaffCount = staffList.filter((s) => s.delete_status !== "DELETED").length;
  const archivedStaffCount = staffList.filter((s) => s.delete_status === "DELETED").length;
  const uniqueCircles = new Set(staffList.map((s) => s.circle).filter(Boolean)).size;
  const uniqueDivisions = new Set(staffList.map((s) => s.division).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Global Navigation Header */}
      <NavigationHeader />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {uiMode === "FORM" ? (
          <StaffEntryForm
            initialData={selectedStaffForEdit || undefined}
            masterConfig={masterConfig}
            onSave={handleSaveStaff}
            onCancel={() => {
              setUiMode("LIST");
              setSelectedStaffForEdit(null);
            }}
          />
        ) : (
          <>
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Staff Management Portal
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tamil Nadu National Highways Department Personnel Directory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Show/Hide Archived Toggle Button */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    showArchived
                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                  title={showArchived ? "Hide Archived Staff Records" : "Show Soft-Deleted/Archived Staff Records"}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{showArchived ? "Hide Archived" : "Show Archived"}</span>
                  {archivedStaffCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                        showArchived
                          ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {archivedStaffCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsMasterDataOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition"
                >
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span>Master Data Config</span>
                </button>

                <button
                  onClick={fetchStaffData}
                  title="Refresh Data"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={() => {
                    setSelectedStaffForEdit(null);
                    setUiMode("FORM");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </div>

            {/* Toolbar & Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, designation, division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                {/* Circle Filter */}
                <div className="w-full sm:w-40">
                  <SearchableSelect
                    options={['All Circles', ...masterConfig.circles]}
                    value={selectedCircle ? `${selectedCircle}` : 'All Circles'}
                    onChange={(val) => setSelectedCircle(val === 'All Circles' ? '' : val)}
                    placeholder="Filter Circle..."
                  />
                </div>

                {/* Division Filter */}
                <div className="w-full sm:w-44">
                  <SearchableSelect
                    options={['All Divisions', ...masterConfig.divisions]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={(val) => setSelectedDivision(val === 'All Divisions' ? '' : val)}
                    placeholder="Filter Division..."
                  />
                </div>

                {/* Designation Filter */}
                <div className="w-full sm:w-48">
                  <SearchableSelect
                    options={['All Designations', ...masterConfig.designations]}
                    value={selectedDesignation ? `${selectedDesignation}` : 'All Designations'}
                    onChange={(val) => setSelectedDesignation(val === 'All Designations' ? '' : val)}
                    placeholder="Filter Designation..."
                  />
                </div>

                {/* Clear Filters */}
                {(selectedCircle || selectedDivision || selectedDesignation || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCircle("");
                      setSelectedDivision("");
                      setSelectedDesignation("");
                      setSearchQuery("");
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Staff Master Table */}
            {loading ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading staff records...</p>
              </div>
            ) : (
              <StaffTable
                staffList={filteredStaff}
                onView={(s) => {
                  setSelectedStaff(s);
                  setIsViewOpen(true);
                }}
                onEdit={(s) => {
                  setSelectedStaffForEdit(s);
                  setUiMode("FORM");
                }}
                onDelete={(s) => {
                  setSelectedStaff(s);
                  setIsDeleteOpen(true);
                }}
                onRestore={handleRestoreStaff}
              />
            )}
          </>
        )}
      </main>

      {/* Modals Suite */}
      <ViewStaffModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        staff={selectedStaff}
      />

      <DeleteStaffModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={fetchStaffData}
        staff={selectedStaff}
      />

      <StaffMasterDataModal
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
        masterConfig={masterConfig}
        onRefresh={fetchStaffData}
      />
    </div>
  );
};

