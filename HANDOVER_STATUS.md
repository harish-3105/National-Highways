# Comprehensive System Handover & Status Documentation

**Project**: Tamil Nadu National Highways Department Management System  
**Repository Remote**: `git@github.com:tnhighwaysdep/highways_project.git`  
**Active Production Branches**: `main` (Production) & `mathir` (Development Sync)  
**Date**: August 19, 2026  

---

## 1. Executive Summary

The Tamil Nadu National Highways Department Management System is a centralized, high-performance web application designed to digitize and manage the core operations of the National Highways division across Tamil Nadu.

The system encompasses **8 fully integrated production modules**:
1. **Ongoing Works & Major Projects Portal (`/ongoing-works` / `/major-projects`)**
2. **Interactive Straight-Line Diagram (SLD) (`/highways/[id]/sld`)**
3. **Master Highways Catalog & Linear Assets (`/highways`)**
4. **Defect Liability Period (DLP) & Maintenance Warranties (`/dlp`)**
5. **Legal & Litigation Proceedings Portal (`/legal`)**
6. **Legal Fee Bills & Voucher Management (`/fee-bills`)**
7. **Departmental Staff Directory (`/staff`)**
8. **Bulk Data Ingestion Engine (`/ingest`)**

---

## 2. Deep Dive: Ongoing Works & Major Projects (`/ongoing-works`)

### A. 29-Column Deep Data Architecture (Cols A through AD)
Fully maps 100% of the departmental Excel spreadsheet (`Major ongoing works above Rs.50 cr and other important projects in NH wing.xlsx`):

* **General & Identification**: `S.No` (Col A), `Name of Work` (Col B), `PMIS/OCMS/PMG ID` (Col C), `Old/New NH` (Col D), `Scheme` (Col E), `Length in Km` (Col F), `Job No` (Col G), `Sanction Date` (Col H).
* **Financials & RCE**: `Sanctioned TPC (₹ Cr)` (Col I), `Revised Cost / RCE (₹ Cr)` (Col O), `Cost Increase in RCE` (Col P), `Exp upto Prior FY` (Col Q), `Exp in Current FY` (Col R), `Cumulative Financial Progress` (Col S).
* **Physical Progress**: `Appointed Date` (Col J), `Length Completed Prior FY` (Col K), `Length Completed Current FY` (Col L), `Total Completed Length` (Col M), `Physical Progress %` (Col N).
* **Timelines & EOT**: `Scheduled Date` (Col U), `Likely Completion Date` (Col T/V), `Time Overrun in Years` (Col W), `EOT Granted Till` (Col X), `EOT Proposal Agency` (Col Y), `Change of Scope (COS) Details` (Col Z).
* **Personnel & Field Logs**: `Divisional Engineer Name & Phone` (Col AA), `Contractor/Agency` (Col AB), `Detailed Stage Log for Piers/Decks/Forest/CALA` (Col AC), `Division & Timestamp` (Col AD).

### B. Mathematical Formulas & Automated Business Logic

1. **Automatic Financial Progress Metric (%)**:
   $$\text{Financial Progress (\%)} = \frac{\text{Cumulative Financial Expenditure (₹ Cr)}}{\max(\text{Revised Cost (RCE)}, \text{Sanctioned TPC})} \times 100$$
   * Rendered as dual progress bars (Physical in Emerald, Financial in Blue) in both dashboard table rows and executive passport cards.

2. **Live Dynamic Delay Gap Calculation**:
   $$\text{Delay} = \text{Current Date} - \text{Scheduled Completion Date}$$
   * Evaluated dynamically in real-time without relying on static Excel column W numbers.
   * If $\text{Current Date} > \text{Scheduled Date}$ (and Physical Progress $< 100\%$): Displays elapsed time in **Years, Months & Days** (e.g. `1 Year & 6 Months (1.50 Yrs)` or `⚠️ 11d delay`).
   * If $\text{Current Date} \le \text{Scheduled Date}$ or work is $100\%$ complete: Automatically marked **`On Schedule`** (`0 delay`).

3. **Mega Projects Filter (`≥ ₹50 Cr`)**:
   $$\text{Cost Basis} = \text{Revised Cost (if present)} \text{ or } \text{Sanctioned Cost (TPC)} \ge 50\text{ Cr}$$
   * Quick filter toggle pill `[ ⚡ ≥ ₹50 Cr ({count}) ]` to isolate major high-value corridors with gold badge indicators.

4. **Strict Non-Overlapping Interval Presets**:
   * **Delay Filters**: `< 1 Year` ($[0, 1)$), `1 - 3 Years` ($[1, 3]$), `> 3 Years` ($> 3$).
   * **Progress Filters**: `< 25%` ($[0, 25)$), `25 - 50%` ($[25, 50)$), `50 - 75%` ($[50, 75)$), `75 - 100%` ($[75, 100]$).

### C. Modal Experiences
* **Single-Page Executive Passport (`ViewMajorProjectModal.tsx`)**: Continuous vertically scrollable technical dossier with 5 structured cards and a 1-click **"Copy Log"** button for long multi-paragraph structural logs.
* **Multi-Tab Data Entry Form (`EditMajorProjectModal.tsx`)**: 6 logical tabs (`General`, `Sanction & IDs`, `Physical Progress`, `Financials & RCE`, `Timelines & EOT`, `Personnel & Notes`) with live mathematical helpers to prevent human data entry errors.

---

## 3. Deep Dive: Interactive Straight-Line Diagram (`/highways/[id]/sld`)

* **Dual Theme Parity**: 100% support for both **Light Mode** (crisp white background, neutral zinc panels) and **Dark Mode** (sharp VS Code neutral theme).
* **Distance-Proportional Physical Bar Scaling**: Dynamic canvas scaling based on physical distance (`length_km`) with minimum width protection (`150px`) for high legibility.
* **7 Interactive Matrix Layers**:
  1. **Towns & Landmarks**: Key urban centers along the corridor.
  2. **Chainage Splits**: Physical chainage ruler with `Km X → Km Y` tags.
  3. **Road Corridor**: Symmetrical centerline-aligned carriageway expansion (`6L`, `4L/4L+PS`, `2L+PS`, `2L`, `<2L`).
  4. **Carriageway Specs**: Official carriageway widths (`20m`, `14m`, `10m`, `7m`).
  5. **Traffic PCU Volume**: Passenger Car Unit counts with color ranges.
  6. **Right of Way (ROW)**: Corridor land boundary widths.
  7. **DPR & Sanctioned Proposals**: Project development proposals and bridge clearance statuses.
* **Height-Matched Caliper Dimension Gauge**: Fixed sidebar caliper lines seamlessly matching the road corridor's vertical lane heights.
* **Export Engine**: Full browser `@media print` landscape export with official department header and technical legend.

---

## 4. Other Production Modules

### A. Master Highways Catalog (`/highways`)
* **Level 1 Inventory**: Complete NH corridor catalog across Tamil Nadu with Old/New NH numbers, endpoints, and configuration breakdowns.
* **Quadrant KPI Matrix**: Clickable quadrant cards to filter and isolate specific lane distributions.
* **CRUD & Exporter**: In-place Add/Edit/Soft-Delete modals + Excel/CSV report generation.

### B. Defect Liability Period (DLP) & Maintenance (`/dlp`)
* **26-Column Excel Parity**: Complete coverage of departmental maintenance spreadsheets.
* **1-to-N Sub-Contract Engine**: Dynamic sub-contract repeaters storing multiple contractor warranties in `contract_details` JSONB.
* **4-Tier Status Tracking**: `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `UNDER_MAINTENANCE` with calendar date range filters.

### C. Legal & Litigation Proceedings Portal (`/legal`)
* **48 Departmental Fields**: Case Numbers, Courts, Prayers, Counter Affidavits, Compliance Dates, and Converted Case Proceedings (Module 1 & 2).
* **Cascading Autocomplete**: Dynamic Circle $\rightarrow$ Division and District $\rightarrow$ Court Complex selectors.

### D. Fee Bills & Voucher Management (`/fee-bills`)
* **Fee Voucher Processing**: Invoice logging, pendency tracking, voucher auditing, lawyer fees, and printable letterheads.

### E. Departmental Staff Management (`/staff`)
* **Staff Inventory**: Personnel directory with dynamic master dropdowns (`Circle`, `Division`, `Sub-Division`, `Section`, `Designation`).

### F. Data Ingestion Engine (`/ingest`)
* **Dynamic Excel Parser (`parser.ts`)**: Handles merged cells (`!merges`), Indian date format conversions (`parseIndianDate`), Excel numeric serials (`44531`), slashes/extension highway code normalization, and multi-division regex identification.

---

## 5. UI/UX Design System: VS Code Charcoal Makeover

* **Design Aesthetic**: VS Code Minimalist Charcoal / Zinc theme.
* **Sharp Corners**: `--radius-*: 2px` (`rounded-xs`) across all cards, buttons, badges, tables, and modal dialogs.
* **Neutral Charcoal Palette**:
  * Light Mode: Pure white (`#ffffff`), canvas neutral zinc (`#f4f4f5`), slate-800 text (`#181a1f`).
  * Dark Mode: Zinc editor charcoal (`#181a1f`), panel charcoal (`#25282f`), border slate (`#383c44`), crisp white text (`#f4f4f5`).
* **Editor Tab Navigation Bar**: Top navigation bar with active blue indicator line and subtle hover states.
* **Viewport-Locked Modals**: Enlarged modal dialogs (`max-w-5xl lg:max-w-6xl h-[92vh]`) with smooth vertical scrollbars.

---

## 6. Technology Stack & Verification

* **Framework**: Next.js 16 (App Router, Turbopack)
* **Frontend**: React 19, Tailwind CSS v4, Lucide React Icons
* **Database**: Supabase PostgreSQL with Row Level Security (RLS)
* **Build Verification**: `npm run build` verified (16/16 static and dynamic routes compiled successfully with 0 errors).
* **Branch Synchronization**: Both `main` and `mathir` branches are fully synchronized.
