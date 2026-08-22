"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  RotateCcw,
  Building2,
  CheckCircle2,
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

  // Search & Filter state for ALL 7 Master Data categories
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubDivision, setSelectedSubDivision] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubSection, setSelectedSubSection] = useState("");
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

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedOffice ||
    selectedCircle ||
    selectedDivision ||
    selectedSubDivision ||
    selectedSection ||
    selectedSubSection ||
    selectedDesignation
  );

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedOffice("");
    setSelectedCircle("");
    setSelectedDivision("");
    setSelectedSubDivision("");
    setSelectedSection("");
    setSelectedSubSection("");
    setSelectedDesignation("");
  };

  // Filter staff list against all 7 master data categories
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.office || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.circle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.division || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sub_division || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sub_section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.contact_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.emailid || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOffice = !selectedOffice || m.office === selectedOffice;
      const matchesCircle = !selectedCircle || m.circle === selectedCircle;
      const matchesDivision = !selectedDivision || m.division === selectedDivision;
      const matchesSubDivision = !selectedSubDivision || m.sub_division === selectedSubDivision;
      const matchesSection = !selectedSection || m.section === selectedSection;
      const matchesSubSection = !selectedSubSection || m.sub_section === selectedSubSection;
      const matchesDesignation = !selectedDesignation || m.designation === selectedDesignation;

      return (
        matchesSearch &&
        matchesOffice &&
        matchesCircle &&
        matchesDivision &&
        matchesSubDivision &&
        matchesSection &&
        matchesSubSection &&
        matchesDesignation
      );
    });
  }, [
    staffList,
    searchQuery,
    selectedOffice,
    selectedCircle,
    selectedDivision,
    selectedSubDivision,
    selectedSection,
    selectedSubSection,
    selectedDesignation,
  ]);

  // Calculate KPI metrics
  const activeStaffCount = staffList.filter((s) => s.delete_status !== "DELETED").length;
  const archivedStaffCount = staffList.filter((s) => s.delete_status === "DELETED").length;
  const uniqueOffices = new Set(staffList.map((s) => s.office).filter(Boolean)).size;
  const uniqueCircles = new Set(staffList.map((s) => s.circle).filter(Boolean)).size;
  const uniqueDivisions = new Set(staffList.map((s) => s.division).filter(Boolean)).size;
  const uniqueDesignations = new Set(staffList.map((s) => s.designation).filter(Boolean)).size;

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Staff Management Portal
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tamil Nadu National Highways Department Personnel & Engineering Directory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Show/Hide Archived Toggle Button */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showArchived
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-sm"
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
                          ? "bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {archivedStaffCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsMasterDataOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span>Master Config</span>
                </button>

                <button
                  onClick={fetchStaffData}
                  title="Refresh Data"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
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

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Staff</span>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{activeStaffCount}</div>
                <span className="text-[10px] text-slate-500 font-semibold">{filteredStaff.length} Match Filter</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Offices</span>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">{uniqueOffices}</div>
                <span className="text-[10px] text-blue-600/80 font-semibold">Active Locations</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Circles & Divs</span>
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{uniqueCircles} / {uniqueDivisions}</div>
                <span className="text-[10px] text-indigo-600/80 font-semibold">Jurisdictions</span>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl shadow-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Roles</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{uniqueDesignations}</div>
                <span className="text-[10px] text-emerald-600/80 font-semibold">Designations</span>
              </div>
            </div>

            {/* Complete Toolbar & Filter Suite (All 7 Master Data Dropdowns) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Row 1: Search & Filter Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, email, office, designation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing <strong className="text-slate-900 dark:text-slate-100">{filteredStaff.length}</strong> of {activeStaffCount} personnel
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 bg-rose-50 dark:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: All 7 Master Data Dropdowns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
                {/* 1. Office Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Office
                  </label>
                  <SearchableSelect
                    options={['All Offices', ...masterConfig.offices]}
                    value={selectedOffice ? `${selectedOffice}` : 'All Offices'}
                    onChange={(val) => setSelectedOffice(val === 'All Offices' ? '' : val)}
                    placeholder="Office..."
                  />
                </div>

                {/* 2. Circle Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Circle
                  </label>
                  <SearchableSelect
                    options={['All Circles', ...masterConfig.circles]}
                    value={selectedCircle ? `${selectedCircle}` : 'All Circles'}
                    onChange={(val) => setSelectedCircle(val === 'All Circles' ? '' : val)}
                    placeholder="Circle..."
                  />
                </div>

                {/* 3. Division Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Division
                  </label>
                  <SearchableSelect
                    options={['All Divisions', ...masterConfig.divisions]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={(val) => setSelectedDivision(val === 'All Divisions' ? '' : val)}
                    placeholder="Division..."
                  />
                </div>

                {/* 4. Sub-Division Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Sub-Division
                  </label>
                  <SearchableSelect
                    options={['All Sub-Divisions', ...masterConfig.sub_divisions]}
                    value={selectedSubDivision ? `${selectedSubDivision}` : 'All Sub-Divisions'}
                    onChange={(val) => setSelectedSubDivision(val === 'All Sub-Divisions' ? '' : val)}
                    placeholder="Sub-Division..."
                  />
                </div>

                {/* 5. Section Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Section
                  </label>
                  <SearchableSelect
                    options={['All Sections', ...masterConfig.sections]}
                    value={selectedSection ? `${selectedSection}` : 'All Sections'}
                    onChange={(val) => setSelectedSection(val === 'All Sections' ? '' : val)}
                    placeholder="Section..."
                  />
                </div>

                {/* 6. Sub-Section Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Sub-Section
                  </label>
                  <SearchableSelect
                    options={['All Sub-Sections', ...masterConfig.sub_sections]}
                    value={selectedSubSection ? `${selectedSubSection}` : 'All Sub-Sections'}
                    onChange={(val) => setSelectedSubSection(val === 'All Sub-Sections' ? '' : val)}
                    placeholder="Sub-Section..."
                  />
                </div>

                {/* 7. Designation Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Designation
                  </label>
                  <SearchableSelect
                    options={['All Designations', ...masterConfig.designations]}
                    value={selectedDesignation ? `${selectedDesignation}` : 'All Designations'}
                    onChange={(val) => setSelectedDesignation(val === 'All Designations' ? '' : val)}
                    placeholder="Designation..."
                  />
                </div>
              </div>
            </div>

            {/* Staff Master Table */}
            {loading ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading staff directory...</p>
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

export default StaffDashboard;
