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
- **Requested Change**: Re-layout the 4 top KPI summary boxes into a 2x2 grid (2 vertical x 2 horizontal equal quadrant boxes) across the screen for high visual prominence, followed by the rest of the existing page content (search bar, catalog table, actions).

### Change 2: Streamline Master Highways Table Columns (Remove Endpoints & DLP Coverage)
- **Module**: Master Corridors (`/highways`)
- **Component**: [`HighwaysTable.tsx`](file:///home/mathir14/nh_proj/src/components/highways/HighwaysTable.tsx)
- **Requested Change**: Remove the **Route Endpoints** column and **DLP Coverage** column from the primary Master Corridors catalog table.
- **Resulting Table Columns**:
  1. `NH Numbers / Code`
  2. `Corridor Title / Section`
  3. `Chainage Span`
  4. `Total Length`
  5. `Multi-Lane Breakdown`
  6. `Actions` (View Passport, Edit, Delete)

### Change 3: Add Percentage Share (%) to Multi-Lane Breakdown in View Modal
- **Module**: Master Corridors (`/highways`)
- **Component**: [`ViewHighwayModal.tsx`](file:///home/mathir14/nh_proj/src/components/highways/ViewHighwayModal.tsx) (Passport View Modal)
- **Requested Change**: In the **Multi-Lane Breakdown Distribution** section of the View modal, display the percentage contribution (`%`) of total corridor length alongside each lane type kilometer value (e.g. `71 km (41.4%)`).

### Change 4: Interactive KPI Lane Breakdown Filter (Focused Lane View)
- **Module**: Master Corridors (`/highways`)
- **Components**: [`KpiHeaderCards.tsx`](file:///home/mathir14/nh_proj/src/components/highways/KpiHeaderCards.tsx) & [`HighwaysTable.tsx`](file:///home/mathir14/nh_proj/src/components/highways/HighwaysTable.tsx)
- **Requested Change**:
  - Turn the lane breakdown badges in the KPI card (`<2L`, `2L`, `2L+PS`, `4L`, `6L`) into interactive filter buttons.
  - **Behavior Difference vs Main Toolbar Dropdown**:
    - **Main Toolbar Filter**: Filters roads containing the lane type, while keeping the full multi-lane breakdown displayed for each road.
    - **KPI Card Filter**: 
      1. Filters the catalog to show only corridors containing that selected lane configuration (`> 0 km`).
      2. Isolates and displays **only the selected lane configuration data/distance** for those matching roads in the table (focusing specifically on that target lane metric rather than all 5 lane configurations).

### Change 5: Replace "Maintenance DLP Active" KPI Card (Replacement Metric Pending)
- **Module**: Master Corridors (`/highways`)
- **Component**: [`KpiHeaderCards.tsx`](file:///home/mathir14/nh_proj/src/components/highways/KpiHeaderCards.tsx)
- **Requested Change**: Remove the **Maintenance DLP Active** KPI card from the corridors dashboard (since DLP is handled separately in `/dlp`). Stakeholders want a different metric in its place; specific replacement KPI metric is to be confirmed by stakeholders.

### Change 6: New Staff Management Module (`/staff`) with Dynamic Master Data Dropdowns
- **Module**: New Module — Staff Management
- **Architectural Approach**: 
  - **Dynamic Master Data Management** (matching `/fee-bills` architecture): Dropdown options for `Office`, `Circle`, `Division`, `Sub-Division`, `Section`, `Sub-Section`, and `Designation` will **not** be hardcoded.
  - Users/Admins can dynamically add, edit, and configure their own dropdown options via a Master Data Config interface/modal.
  - Streamlines departmental onboarding, eliminates guesswork on organizational titles, and grants total flexibility to administrators.
- **Requested Capabilities**:
  - Full CRUD lifecycle (Add, Edit, Delete, View, Search).
  - Dashboard with standard table view, KPI summary metrics, search bar, and organizational hierarchy filters.
  - Entry/Edit forms with dynamic dropdowns powered by the Master Data config.
- **Fields Required**:
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

---







