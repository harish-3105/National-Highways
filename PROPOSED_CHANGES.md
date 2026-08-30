# Proposed System Changes & Requirement Alignment Log

**Project**: Tamil Nadu National Highways Department Management System  
**Date Initialized**: August 11, 2026  
**Status**: Active / Live Working Document  

---

## 1. Executive Summary

This document captures and tracks all proposed changes, architectural pivots, and feedback items requested by departmental stakeholders. It serves as the single source of truth for refining module priorities, entry form schemas, dashboard views, and data ingestion specifications.

---

## 2. Core Priorities & Strategic Alignment

### Item 1: Primary Focus on Entry Forms & Dashboard Experience
- **Priority Shift**: The entry forms and dashboard interfaces take absolute top priority. The departmental workflow requires intuitive, fast, and structured data entry and visual reporting.

### Item 2: Departmental Excel Standard Standardized to App Format
- **Agreement**: Departmental users will adjust their existing departmental Excel templates to strictly match the app's standardized entry format.
- **Impact**: 
  - Eliminates format guesswork, ambiguous merged cell parsing, and unpredictable Excel layout variations.
  - Ensures 1-to-1 canonical field mapping between bulk Excel imports and live manual web entry forms.
  - Streamlines ingestion validation rules and database insert performance.

### Item 3: Legal Cases (`/legal`) & Legal Fee Bills (`/fee-bills`) Modules Approved
- **Status**: Stakeholders are satisfied with the current implementation of both the **Legal Cases** and **Legal Fee Bills** portals (including Entry, Edit, Delete, View, Search, and Export functionality).
- **Scope**: No drastic architectural restructuring required for these two modules. Only minor visual or minor field adjustments will be made if requested.

### Item 4: Corridors Module Level 1 & Level 2 Core Baseline Approved
- **Status**: Stakeholders approve the core baseline and concept of **Level 1** (Master Corridor Catalog) and **Level 2** (Sub-Chainage & Traffic PCU Breakdown).
- **Scope**: The core structure is solid, but specific adjustments to the entry forms and dashboard views are being requested.

### Item 5: Universal Dynamic Master Data Architecture (App-Wide Paradigm Shift)
- **Strategic Principle**: Extend the **Dynamic Master Data Config** architecture universally across all modules (`/highways`, `/dlp`, `/legal`, `/fee-bills`, `/staff`).
- **Core Benefits**:
  - Eliminates hardcoded dropdown arrays across forms (Circles, Divisions, Offices, Sections, Designations, Court Names, Categories).
  - Users/Admins manage their own master option lists directly via a central configuration interface.
  - Keeps database schemas strictly typed while making UI drop-down values 100% user-configurable and zero-maintenance.

### Item 6: Module Modification Scope & Level 3 SLD Implementation
- **Legal Modules (`/legal`, `/fee-bills`)**: Complete & Stable — only minor/cosmetic tweaks anticipated.
- **Corridors & DLP Modules (`/highways`, `/dlp`)**: Noticeable changes anticipated — undergoing active structural, visual, form, and KPI dashboard refinements.
- **Level 3 SLD Diagram (`/highways/[id]/sld`)**: Planned web-based interactive Straight-Line Diagram timeline replacing manual Excel bar charts.

---



## 3. Detailed Proposed Changes Log

### Change 1: Corridors Dashboard Summary Cards 2x2 Grid Layout
- **Module**: Master Corridors (`/highways`)
- **Component**: [`KpiHeaderCards.tsx`](file:///home/mathir14/nh_proj/src/components/highways/KpiHeaderCards.tsx)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 13, 2026)
- **Delivered Change**: Re-laid out the 4 top KPI summary boxes into a balanced 2x2 quadrant grid (`grid-cols-1 md:grid-cols-2`) for high visual prominence on screen.

### Change 2: Streamline Master Highways Table Columns (Remove Endpoints & DLP Coverage)
- **Module**: Master Corridors (`/highways`)
- **Component**: [`HighwaysTable.tsx`](file:///home/mathir14/nh_proj/src/components/highways/HighwaysTable.tsx)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 13, 2026)
- **Delivered Change**: Removed **Route Endpoints** and **DLP Coverage** columns from the primary Master Corridors catalog table, resulting in a streamlined 6-column layout:
  1. `NH Numbers / Code`
  2. `Corridor Title / Section`
  3. `Chainage Span`
  4. `Total Length`
  5. `Multi-Lane Breakdown`
  6. `Actions` (View Passport, Edit, Delete)

### Change 3: Add Percentage Share (%) to Multi-Lane Breakdown in View Modal
- **Module**: Master Corridors (`/highways`)
- **Component**: [`ViewHighwayModal.tsx`](file:///home/mathir14/nh_proj/src/components/highways/ViewHighwayModal.tsx) (Passport View Modal)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 13, 2026)
- **Delivered Change**: In the **Multi-Lane Breakdown Distribution** section of the Passport View modal, displayed percentage contribution (`%`) alongside each lane type kilometer value (e.g. `71 km (41%)`).

### Change 4: Interactive KPI Lane Breakdown Filter (Focused Lane View)
- **Module**: Master Corridors (`/highways`)
- **Components**: [`KpiHeaderCards.tsx`](file:///home/mathir14/nh_proj/src/components/highways/KpiHeaderCards.tsx), [`HighwaysTable.tsx`](file:///home/mathir14/nh_proj/src/components/highways/HighwaysTable.tsx), [`page.tsx`](file:///home/mathir14/nh_proj/src/app/highways/page.tsx)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 13, 2026)
- **Delivered Change**:
  - Converted lane breakdown badges in the KPI card (`<2L`, `2L`, `2L+PS`, `4L`, `6L`) into interactive filter buttons.
  - Clicking any lane badge filters the table to show corridors matching that lane configuration (> 0 km) AND isolates/displays **only the selected lane distance metric** in the table row with a focused highlight badge and percentage share.
  - Clicking active badge or "Reset Filter" restores full multi-lane list view.

### Change 5: Replace "Maintenance DLP Active" with "Divided Carriageway (4L+)" KPI Card
- **Module**: Master Corridors (`/highways`)
- **Component**: [`KpiHeaderCards.tsx`](file:///home/mathir14/nh_proj/src/components/highways/KpiHeaderCards.tsx)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 30, 2026)
- **Delivered Change**: Replaced the legacy DLP card with the **Divided Carriageway (4L+)** KPI card. Displays combined 4-Lane & 6-Lane high-capacity distance in km, percentage share of the total network (`%`), and sub-breakdown (`4L: X km • 6L: Y km`).

### Change 6: New Staff Management Module (`/staff`) with Dynamic Master Data Dropdowns
- **Module**: New Module — Staff Management Portal
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 11, 2026)
- **Architectural Approach**: 
  - **Dynamic Master Data Management** (matching `/fee-bills` architecture): Dropdown options for `Office`, `Circle`, `Division`, `Sub-Division`, `Section`, `Sub-Section`, and `Designation` start 100% clean with zero pre-configured hardcoded items.
  - Users/Admins dynamically add, edit (inline pencil editing auto-syncing DB records), and remove (custom delete confirmation popup modal overlay) their own dropdown options via Master Data Config modal.
- **Delivered Capabilities**:
  - Database schema migration [`0014_staff_members_schema.sql`](file:///home/mathir14/nh_proj/supabase/migrations/0014_staff_members_schema.sql) (`staff_members` & `staff_master_config` tables).
  - Backend API handlers [`/api/staff`](file:///home/mathir14/nh_proj/src/app/api/staff/route.ts) and [`/api/staff/master-data`](file:///home/mathir14/nh_proj/src/app/api/staff/master-data/route.ts) supporting GET, POST, PUT, PATCH (Restore), and DELETE (Soft & Hard delete).
  - Full UI suite ([`StaffDashboard.tsx`](file:///home/mathir14/nh_proj/src/components/staff/StaffDashboard.tsx), [`StaffTable.tsx`](file:///home/mathir14/nh_proj/src/components/staff/StaffTable.tsx), [`AddStaffModal.tsx`](file:///home/mathir14/nh_proj/src/components/staff/AddStaffModal.tsx), [`EditStaffModal.tsx`](file:///home/mathir14/nh_proj/src/components/staff/EditStaffModal.tsx), [`ViewStaffModal.tsx`](file:///home/mathir14/nh_proj/src/components/staff/ViewStaffModal.tsx), [`DeleteStaffModal.tsx`](file:///home/mathir14/nh_proj/src/components/staff/DeleteStaffModal.tsx), [`StaffMasterDataModal.tsx`](file:///home/mathir14/nh_proj/src/components/staff/StaffMasterDataModal.tsx)).
  - Instant search across all 10 fields, Circle/Division/Designation filters, **Show Archived** toggle with 1-click restore action, soft-delete notice confirmation modal, and top [`NavigationHeader`](file:///home/mathir14/nh_proj/src/components/NavigationHeader.tsx) integration.
- **Fields Supported**:
  1. `office` (Office - Dynamic Master Dropdown)
  2. `circle` (Circle - Dynamic Master Dropdown)
  3. `division` (Division - Dynamic Master Dropdown)
  4. `sub_division` (Sub-Division - Dynamic Master Dropdown)
  5. `section` (Section - Dynamic Master Dropdown)
  6. `sub_section` (Sub-Section - Dynamic Master Dropdown)
  7. `designation` (Designation - Dynamic Master Dropdown)
  8. `name` (Staff Name)
  9. `contact_no` (Contact Number)
  10. `emailid` (Email ID)


### Change 7: Categorized Document Management / Vault (Tentative / Unconfirmed)
- **Module**: Document Vault / File Attachment System
- **Status**: **Tentative / Verbal Suggestion** (Awaiting formal stakeholder confirmation)
- **Concept**:
  - Centralized or module-linked document storage allowing users to upload departmental files (PDFs, Office docs, Scans) tagged with categories (e.g. *Government Orders*, *Technical Sanctions*, *Contracts*, *Court Orders*, *Circulars*).
  - View and download files on demand with category filtering and search.

### Change 9: Interactive Level 3 Straight-Line Diagram (SLD) Architecture & Visual Gauge Refinements
- **Module**: Master Corridors & Sub-Chainages (`/highways/[id]/sld`)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 12, 2026)
- **Delivered Architecture & Visual Features**:
  1. **Equal Fixed-Width Cell Columns (Excel Grid Paradigm)**:
     - Shifted from proportional physical distance scaling to fixed-width cell column grid (`colWidthPx = 150px * zoomLevel`).
     - Short/dense sub-chainages (e.g. 0.1km or 5km) are guaranteed equal visual space as long stretches (100km), maximizing human readability and data absorption.
  2. **Centerline Symmetrical Road Expansion**:
     - Aligned road bar boxes vertically on a horizontal centerline reference axis (`top-1/2 -translate-y-1/2`).
     - Road sections expand symmetrically outward on both top and bottom based on lane width (`6L = 150px`, `4L / 4L+PS = 110px`, `2L+PS = 75px`, `2L = 40px`).
  3. **100% Clean Neutral Baseline Bar Fill Colors (Reserved for DLP Data)**:
     - Neutralized bar box fill colors (`bg-slate-700/80`), reserving color fills 100% for future DLP contract statuses (Active DLP, STMC, PBMC) upon DLP module upload.
  4. **Full-Screen Dynamically Stretched Canvas Layout**:
     - Removed redundant header title rows and footer notice rows.
     - Matrix board container dynamically expands to fit full screen height (`flex-1 min-h-[500px]`), stretching the Carriageway Bar Corridor row dynamically (`flex-1 min-h-[200px]`).
  5. **Precision Right-Facing Caliper Docking Gauge (Sidebar Legend)**:
     - Built vertical stems matching exact bar heights (`150px`, `110px`, `75px`, `40px`) centered on the centerline axis.
     - Placed **top and bottom right-pointing horizontal guide arrows (`─────►`)** extending seamlessly from the head and tail of each vertical stem to the right border of the sidebar.
     - Placed lane reference text (`6L 20m`, `4L / 4L+PS 14m`, `2L+PS 10m`, `2L 7m`) to the right side of the vertical stem.
     - As users scroll horizontally on the canvas, any road bar docks directly between its top and bottom guide arrows (`─────►`) at the sidebar seam border.
  6. **Dedicated Carriageway Specs Matrix Track Row & Interactive Filter**:
     - Added a dedicated 1-to-1 matrix track row for **Carriageway Specs** displaying full-width colored cell badges matching lane type (Purple for 6L, Blue for 4L / 4L+PS, Emerald for 2L+PS, Amber for 2L).
     - Added an interactive **`Carriageway Specs`** filter checkbox in the top layer visibility toolbar.
  7. **Clean Distance Unit Badge Formatting**:
     - Formatted split distance badges in the Chainage Splits track to display **`12.3 km`** (with space and `km`).

### Change 10: Ongoing Works 35-Column Full Architecture, Write-Once Freezing & History Timeline
- **Module**: Ongoing Works / Major Capital Projects (`/ongoing-works`)
- **Status**: ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (August 21, 2026)
- **Delivered Architecture & Features**:
  1. **35-Column Standardized Excel Mapping (Columns A to AI)**:
     - Fully supported all 35 columns from the updated departmental spreadsheet (`Update 27 column present status as on 30.07.2026.xlsx`).
     - Added 5 first-class contract execution & expenditure fields: `loa_date` (Col 10), `agreement_date` (Col 11), `contract_value_cr` (Col 12), `site_handover_date` (Col 13), `contract_cum_expenditure_cr` (Col 24).
  2. **Dedicated Clearance Issue Bottlenecks & Progress Remarks (6 Fields)**:
     - Implemented 5 dedicated clearance bottleneck textareas (`issue_land`, `issue_forest`, `issue_utility`, `issue_railways`, `issue_others`) and dedicated `progress_remarks` in Section 2.
  3. **"Write-Once / Freeze-When-Filled" Rule (Columns A–N & Column Z)**:
     - Relaxed mandatory field rules to allow progressive drafting of project records (only `name_of_work` required).
     - When a frozen field (Cols A–N, Z) is blank/null, standard users can enter a value at any time. Once filled, the field permanently freezes for standard users (cannot be altered via manual edit or Excel upload).
     - Admins ("Creative Mode") retain full manual override authority to correct frozen fields at any time.
  4. **Monotonic Progress Increase Validation**:
     - Enforced monotonic progress checks so physical progress % cannot decrease from previously recorded values (unless overridden in Admin Creative Mode).
  5. **Completed Works Tracking & Auto-Hide**:
     - Any project reaching 100% physical progress automatically hides from default active views.
     - Dedicated **Active / Completed / All** toolbar pills and **Completed Works KPI Card** showing total completed projects and value in ₹ Cr.
  6. **Trading-Style Time Series Chart & Historical Audit Log (`ProjectHistoryModal.tsx`)**:
     - Automated historical snapshot logging (`major_projects_snapshots` table) on every mutation event.
     - Dual-trendline SVG line chart (Physical % vs Financial %) with tooltips and chronological snapshot data table with CSV export.
  7. **Full 35-Column Standardized Excel (.xlsx) Export**:
     - One-click export downloading the canonical 35-column departmental format.

### Change 11: Lifecycle Sub-Navigation & Progressive Partial Saving (All Entry/Edit Forms)
- **Modules**: All Modules (`/fee-bills` [COMPLETED], `/ongoing-works` [NEXT], `/highways`, `/dlp`, `/staff`, `/legal`)
- **Status**: 🚀 **IN PROGRESS — Fee Bills Module Completed & Deployed; Ongoing Works Next**
- **Core Philosophy**:
  - **Viewing Experience**: Remains unified and comprehensive in dashboards, tables, and passport modals.
  - **Adding & Editing Experience**: Replaces long continuous 30+ column vertical scrolling pages with a **sub-navigation tab bar / lifecycle stepper** inside entry/edit forms.
  - **Real-Life Chronological Lifecycle Splitting**: Forms are divided into intuitive stages matching how data is acquired over time (e.g. Sanction & Approvals $\rightarrow$ Contract Award $\rightarrow$ Physical Works $\rightarrow$ Financial Outlays $\rightarrow$ Time Extensions $\rightarrow$ Clearances $\rightarrow$ Granular Field Logs).
  - **Progressive / Partial Saving**: Only the primary identifier is mandatory. Users can fill any individual stage, click Save immediately, and return weeks or months later to fill subsequent lifecycle tabs as the project advances in the field.
  - **Delivered Reference Implementation**: Completed in [`FeeBillDataEntryForm.tsx`](file:///home/mathir14/nh_proj/src/components/fee-bills/FeeBillDataEntryForm.tsx) with 5 lifecycle stages, branching G.O. and Payment cards, assistant toggle, and non-blocking saving.

### Change 12: Standardized Departmental Excel (.xlsx) Export Formatting Engine
- **Modules**: All Modules (`/ongoing-works` [COMPLETED], `/fee-bills` [COMPLETED], `/dlp` [NEXT], `/highways`, `/staff`, `/legal`)
- **Status**: 🚀 **IN PROGRESS — Completed for Major Projects & Fee Bills; DLP Next**
- **Formatting Standards**:
  - **Auto-Fit Column Widths**: Automatically calculates character spans (`!cols`) to eliminate cell truncation or `###` overflow.
  - **Cell Alignment Hierarchy**: Right-align numerical metrics (₹ Cr, Lengths, Counts), Center-align dates and codes, Left-align text descriptions and logs with auto-wrapping.
  - **Departmental Visual Styling**: Bold header formatting, subtle gridlines, and frozen top header row (`freezePanes`).
  - **Customizable Scope**: Export `All Rows`, `Filtered Rows`, or `Checked Checkboxes` with customizable column categories.

---










