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
} from "lucide-react";
import { StaffMember, StaffMasterConfig } from "./StaffTypes";
import { StaffTable } from "./StaffTable";
import { AddStaffModal } from "./AddStaffModal";
import { EditStaffModal } from "./EditStaffModal";
import { ViewStaffModal } from "./ViewStaffModal";
import { DeleteStaffModal } from "./DeleteStaffModal";
import { StaffMasterDataModal } from "./StaffMasterDataModal";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCircle, setSelectedCircle] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Fetch staff list & master config
  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [staffRes, masterRes] = await Promise.all([
        fetch("/api/staff"),
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
  }, []);

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
  const totalStaff = staffList.length;
  const uniqueCircles = new Set(staffList.map((s) => s.circle).filter(Boolean)).size;
  const uniqueDivisions = new Set(staffList.map((s) => s.division).filter(Boolean)).size;
  const uniqueDesignations = new Set(staffList.map((s) => s.designation).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6">
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
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Staff */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Personnel
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalStaff}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Active Registered Staff
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Circles Covered */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Circles Deployed
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {uniqueCircles}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              State-wide Circles
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Divisions Covered */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Divisions Covered
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {uniqueDivisions}
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              Active Divisions
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Designations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Designation Roles
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {uniqueDesignations}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              Designation Types
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Briefcase className="w-6 h-6" />
          </div>
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
          <select
            value={selectedCircle}
            onChange={(e) => setSelectedCircle(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Circles</option>
            {masterConfig.circles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Divisions</option>
            {masterConfig.divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Designations</option>
            {masterConfig.designations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(selectedCircle || selectedDivision || selectedDesignation || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCircle("");
                setSelectedDivision("");
                setSelectedDesignation("");
                setSearchQuery("");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2"
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
            setSelectedStaff(s);
            setIsEditOpen(true);
          }}
          onDelete={(s) => {
            setSelectedStaff(s);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Modals Suite */}
      <AddStaffModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchStaffData}
        masterConfig={masterConfig}
      />

      <EditStaffModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchStaffData}
        staff={selectedStaff}
        masterConfig={masterConfig}
      />

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
