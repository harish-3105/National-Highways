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
  AlertCircle,
  X,
} from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { StaffMember, StaffMasterConfig } from "./StaffTypes";
import { StaffTable } from "./StaffTable";
import { StaffEntryForm } from "./StaffEntryForm";
import { ViewStaffModal } from "./ViewStaffModal";
import { DeleteStaffModal } from "./DeleteStaffModal";
import { StaffMasterDataModal } from "./StaffMasterDataModal";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import {
  getCascadingDivisions,
  getCascadingSubDivisions,
  getCascadingSections,
  getCascadingSubSections,
} from "@/lib/staff/masterData";

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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Screen state: 'LIST' | 'FORM' | 'MASTER_DATA'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM' | 'MASTER_DATA'>('LIST');
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
    setSaveError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });
      const data = await res.json();
      if (res.ok) {
        setUiMode("LIST");
        setSelectedStaffForEdit(null);
        fetchStaffData();
      } else {
        setSaveError(data.error || "Failed to save staff profile. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to save staff member:", err);
      setSaveError(err.message || "A network error occurred while saving.");
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC CASCADING FOR DASHBOARD FILTER DROPDOWNS
  // -------------------------------------------------------------
  const availableFilterDivisions = useMemo(() => {
    return getCascadingDivisions(selectedCircle, masterConfig.rawItems || [], masterConfig.divisions || [], staffList);
  }, [selectedCircle, masterConfig.rawItems, masterConfig.divisions, staffList]);

  const availableFilterSubDivisions = useMemo(() => {
    return getCascadingSubDivisions(selectedDivision, masterConfig.rawItems || [], masterConfig.sub_divisions || [], staffList);
  }, [selectedDivision, masterConfig.rawItems, masterConfig.sub_divisions, staffList]);

  const availableFilterSections = useMemo(() => {
    return getCascadingSections(selectedSubDivision, masterConfig.rawItems || [], masterConfig.sections || [], staffList);
  }, [selectedSubDivision, masterConfig.rawItems, masterConfig.sections, staffList]);

  const availableFilterSubSections = useMemo(() => {
    return getCascadingSubSections(selectedSection, masterConfig.rawItems || [], masterConfig.sub_sections || [], staffList);
  }, [selectedSection, masterConfig.rawItems, masterConfig.sub_sections, staffList]);

  // Cascading Filter Handlers with Auto-Resets
  const handleFilterCircleChange = (val: string) => {
    const nextCircle = val === 'All Circles' ? '' : val;
    setSelectedCircle(nextCircle);
    if (selectedDivision) {
      const validDivs = getCascadingDivisions(nextCircle, masterConfig.rawItems || [], masterConfig.divisions || [], staffList);
      if (!validDivs.includes(selectedDivision)) {
        setSelectedDivision('');
        setSelectedSubDivision('');
        setSelectedSection('');
        setSelectedSubSection('');
      }
    }
  };

  const handleFilterDivisionChange = (val: string) => {
    const nextDivision = val === 'All Divisions' ? '' : val;
    setSelectedDivision(nextDivision);
    if (selectedSubDivision) {
      const validSubDivs = getCascadingSubDivisions(nextDivision, masterConfig.rawItems || [], masterConfig.sub_divisions || [], staffList);
      if (!validSubDivs.includes(selectedSubDivision)) {
        setSelectedSubDivision('');
        setSelectedSection('');
        setSelectedSubSection('');
      }
    }
  };

  const handleFilterSubDivisionChange = (val: string) => {
    const nextSubDivision = val === 'All Sub-Divisions' ? '' : val;
    setSelectedSubDivision(nextSubDivision);
    if (selectedSection) {
      const validSecs = getCascadingSections(nextSubDivision, masterConfig.rawItems || [], masterConfig.sections || [], staffList);
      if (!validSecs.includes(selectedSection)) {
        setSelectedSection('');
        setSelectedSubSection('');
      }
    }
  };

  const handleFilterSectionChange = (val: string) => {
    const nextSection = val === 'All Sections' ? '' : val;
    setSelectedSection(nextSection);
    if (selectedSubSection) {
      const validSubSecs = getCascadingSubSections(nextSection, masterConfig.rawItems || [], masterConfig.sub_sections || [], staffList);
      if (!validSubSecs.includes(selectedSubSection)) {
        setSelectedSubSection('');
      }
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
        {saveError && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center justify-between text-rose-800 dark:text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uiMode === "FORM" ? (
          <StaffEntryForm
            key={selectedStaffForEdit?.id || "new-staff"}
            initialData={selectedStaffForEdit || undefined}
            masterConfig={masterConfig}
            onSave={handleSaveStaff}
            onCancel={() => {
              setUiMode("LIST");
              setSelectedStaffForEdit(null);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Unified Module Page Header */}
            <ModulePageHeader
              icon={Users}
              title="Staff Directory & Hierarchy"
              subtitle="Personnel management across 6-tier departmental deployment structure"
              onRefresh={fetchStaffData}
              isLoading={loading}
              refreshLabel="Refresh"
              masterConfig={{
                onClick: () => setUiMode(uiMode === 'MASTER_DATA' ? 'LIST' : 'MASTER_DATA'),
                label: uiMode === 'MASTER_DATA' ? 'Staff Roster' : 'Master Config',
                title: uiMode === 'MASTER_DATA' ? 'Back to Staff Directory' : 'Configure Staff Master Dropdown Options',
              }}
              archiveToggle={{
                showArchived,
                onToggle: () => setShowArchived(!showArchived),
                archivedCount: archivedStaffCount,
                activeLabel: "Hide Archived",
                inactiveLabel: `Archived (${archivedStaffCount})`,
              }}
              importAction={{
                disabled: true,
                disabledReason: "Staff Excel Import coming soon",
              }}
              exportAction={{
                disabled: true,
                disabledReason: "Staff Excel Export coming soon",
              }}
              primaryAction={{
                onClick: () => {
                  setSelectedStaffForEdit(null);
                  setUiMode("FORM");
                },
                label: "New Staff Officer",
                icon: UserPlus,
              }}
            />

            {/* In-Page Master Data Config Mode */}
            {uiMode === 'MASTER_DATA' && (
              <StaffMasterDataModal
                isPageMode
                onClose={() => setUiMode('LIST')}
                masterConfig={masterConfig}
                onRefresh={fetchStaffData}
              />
            )}

            {/* Main Staff List Mode */}
            {uiMode === 'LIST' && (
              <>
                {/* 4 Interactive KPI Quadrant Cards (2 Rows × 2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quadrant 1: Active Deployable Officers */}
              <button
                type="button"
                onClick={() => {
                  setShowArchived(false);
                  handleClearAllFilters();
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  !showArchived && !hasActiveFilters
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Active Deployable Officers
                    {!showArchived && !hasActiveFilters && (
                      <span className="normal-case text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                        Active Roster
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {activeStaffCount} <span className="text-sm font-medium text-slate-500 font-sans">Active</span> &bull;{" "}
                    <span className="text-base font-bold text-slate-700 dark:text-slate-300 font-sans">{staffList.length}</span>{" "}
                    <span className="text-sm font-medium text-slate-500 font-sans">Total</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Level 1 Verified Departmental Directory &bull; Click to reset
                </div>
              </button>

              {/* Quadrant 2: Jurisdictional Coverage */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Jurisdictional Scope
                  </span>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                    {uniqueCircles} <span className="text-sm font-medium text-slate-500 font-sans">Circles</span> &bull;{" "}
                    <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-sans">{uniqueDivisions}</span>{" "}
                    <span className="text-sm font-medium text-slate-500 font-sans">Divisions</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Territorial Deployment Across Tamil Nadu State Network
                </div>
              </div>

              {/* Quadrant 3: Administrative Cadres */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Administrative Cadres & Offices
                  </span>
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                    {uniqueDesignations} <span className="text-sm font-medium text-slate-500 font-sans">Cadres</span> &bull;{" "}
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-sans">{uniqueOffices}</span>{" "}
                    <span className="text-sm font-medium text-slate-500 font-sans">Offices</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  Chief Engineers down to Section Officers & Technical Staff
                </div>
              </div>

              {/* Quadrant 4: Archived Records */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Archived Personnel
                    {showArchived && (
                      <span className="normal-case text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        Archive Visible
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
                    <Archive className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                    {archivedStaffCount} <span className="text-sm font-medium text-slate-500 font-sans">Archived</span> &bull;{" "}
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-sans">{showArchived ? "Visible" : "Hidden"}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Soft-Deleted Personnel &bull; Managed via Top Header Toggle
                </div>
              </div>
            </div>

            {/* Smart Search & 7-Level Cascading Hierarchy Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              {/* Row 1: Search & Filter Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
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

              {/* Row 2: All 7 Master Data Dropdowns Grid with Smart Cascading */}
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
                    onChange={handleFilterCircleChange}
                  />
                </div>

                {/* 3. Division Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Division {selectedCircle && <span className="text-blue-600 font-normal">({selectedCircle})</span>}
                  </label>
                  <SearchableSelect
                    options={['All Divisions', ...availableFilterDivisions]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={handleFilterDivisionChange}
                  />
                </div>

                {/* 4. Sub-Division Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Sub-Division {selectedDivision && <span className="text-blue-600 font-normal">({selectedDivision})</span>}
                  </label>
                  <SearchableSelect
                    options={['All Sub-Divisions', ...availableFilterSubDivisions]}
                    value={selectedSubDivision ? `${selectedSubDivision}` : 'All Sub-Divisions'}
                    onChange={handleFilterSubDivisionChange}
                  />
                </div>

                {/* 5. Section Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Section {selectedSubDivision && <span className="text-blue-600 font-normal">({selectedSubDivision})</span>}
                  </label>
                  <SearchableSelect
                    options={['All Sections', ...availableFilterSections]}
                    value={selectedSection ? `${selectedSection}` : 'All Sections'}
                    onChange={handleFilterSectionChange}
                  />
                </div>

                {/* 6. Sub-Section Filter */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">
                    Sub-Section {selectedSection && <span className="text-blue-600 font-normal">({selectedSection})</span>}
                  </label>
                  <SearchableSelect
                    options={['All Sub-Sections', ...availableFilterSubSections]}
                    value={selectedSubSection ? `${selectedSubSection}` : 'All Sub-Sections'}
                    onChange={(val) => setSelectedSubSection(val === 'All Sub-Sections' ? '' : val)}
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
      </div>
    )}
  </main>

  {/* View Staff Modal */}
  <ViewStaffModal
    isOpen={isViewOpen}
    onClose={() => {
      setIsViewOpen(false);
      setSelectedStaff(null);
    }}
    staff={selectedStaff}
  />

  {/* Delete Staff Modal */}
  <DeleteStaffModal
    isOpen={isDeleteOpen}
    onClose={() => {
      setIsDeleteOpen(false);
      setSelectedStaff(null);
    }}
    staff={selectedStaff}
    onSuccess={() => {
      fetchStaffData();
      setIsDeleteOpen(false);
      setSelectedStaff(null);
    }}
  />
</div>
  );
};

export default StaffDashboard;
