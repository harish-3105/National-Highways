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
    return getCascadingDivisions(selectedCircle, masterConfig.divisions || [], staffList);
  }, [selectedCircle, masterConfig.divisions, staffList]);

  const availableFilterSubDivisions = useMemo(() => {
    return getCascadingSubDivisions(selectedDivision, masterConfig.sub_divisions || [], staffList);
  }, [selectedDivision, masterConfig.sub_divisions, staffList]);

  const availableFilterSections = useMemo(() => {
    return getCascadingSections(selectedSubDivision, masterConfig.sections || [], staffList);
  }, [selectedSubDivision, masterConfig.sections, staffList]);

  const availableFilterSubSections = useMemo(() => {
    return getCascadingSubSections(selectedSection, masterConfig.sub_sections || [], staffList);
  }, [selectedSection, masterConfig.sub_sections, staffList]);

  // Cascading Filter Handlers with Auto-Resets
  const handleFilterCircleChange = (val: string) => {
    const nextCircle = val === 'All Circles' ? '' : val;
    setSelectedCircle(nextCircle);
    if (selectedDivision) {
      const validDivs = getCascadingDivisions(nextCircle, masterConfig.divisions || [], staffList);
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
      const validSubDivs = getCascadingSubDivisions(nextDivision, masterConfig.sub_divisions || [], staffList);
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
      const validSecs = getCascadingSections(nextSubDivision, masterConfig.sections || [], staffList);
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
      const validSubSecs = getCascadingSubSections(nextSection, masterConfig.sub_sections || [], staffList);
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
            {/* Top Dashboard Title & Action Ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Staff Directory & Hierarchy
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Personnel management across 6-tier departmental deployment structure
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Archived Records Toggle */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    showArchived
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {showArchived ? <EyeOff className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span>{showArchived ? "Hide Archived" : `Archived (${archivedStaffCount})`}</span>
                </button>

                {/* Master Data Config Action */}
                <button
                  onClick={() => setIsMasterDataOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Master Config</span>
                </button>

                {/* Add New Staff Button */}
                <button
                  onClick={() => {
                    setSelectedStaffForEdit(null);
                    setUiMode("FORM");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>New Staff Officer</span>
                </button>
              </div>
            </div>

            {/* KPI Statistics Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Officers
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeStaffCount}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">
                  Deployable Roster
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Designations
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{uniqueDesignations}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">Distinct Cadres</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Offices
                </span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{uniqueOffices}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">Field & Regional HQ</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Circles
                </span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{uniqueCircles}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">Jurisdictions</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Divisions
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{uniqueDivisions}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">Territorial Units</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Archived
                </span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{archivedStaffCount}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-500 block mt-1 font-semibold">
                  Soft Deleted
                </span>
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

      {/* Master Data Management Modal */}
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
