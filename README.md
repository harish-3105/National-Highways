# Tamil Nadu National Highways Department Management System

A comprehensive, state-of-the-art enterprise web platform engineered to digitize, monitor, analyze, and manage the core operational assets of the National Highways division across Tamil Nadu.

---

## 🏛️ System Overview

The application unifies ground-truth departmental data across corridors, linear asset geometry, multi-crore infrastructure works, contractor warranty compliance, judicial proceedings, fee auditing, and human resources into a high-performance, reactive portal with zero external runtime bloat.

### 🌟 Key Capabilities
* **Full-Stack Next.js 16 + React 19 Architecture**: Server-side rendering, dynamic API route handlers, and static optimization powered by Turbopack.
* **8 Integrated Production Modules**: Ongoing Works, Straight-Line Diagrams (SLD), Highways Catalog, DLP Maintenance, Legal Litigation, Fee Bills, Staff Directory, and Data Ingestion.
* **Dual Theme Engine**: Seamless support for both **Light Mode** (clean white canvas, high-contrast typography) and **Dark Mode** (VS Code Minimalist Charcoal & Zinc palette `#181a1f`).
* **Sharp Minimalist Aesthetic**: Standardized `2px` border-radius (`rounded-xs`) across all cards, modals, tables, badges, and controls.
* **100% Dynamic Postgres Database**: Backed by Supabase with Row Level Security (RLS), full CRUD support, soft-delete archiving, and automated mathematical helpers.

---

## 🚀 Live Production Modules

### 1. Ongoing Works & Major Projects (`/ongoing-works` / `/major-projects`)
Comprehensive tracking of high-value corridor developments, bypasses, bridge constructions, and road widening projects across Tamil Nadu.

* **29-Column Deep Data Coverage (Cols A through AD)**:
  * **Sanction & Identity**: S.No (Col A), Name of Work (Col B), PMIS/OCMS/PMG ID (Col C), Old/New NH (Col D), Scheme (Col E), Total Length (Col F), Job No (Col G), Sanction Date (Col H).
  * **Financial Tracking**: Sanctioned TPC (Col I), Revised Cost/RCE (Col O), Cost Increase in RCE (Col P), Prior FY Expenditure (Col Q), Current FY Expenditure (Col R), Cumulative Financial Progress (Col S).
  * **Physical Execution**: Appointed Date (Col J), Prior FY Completed Length (Col K), Current FY Completed Length (Col L), Total Completed Length (Col M), Physical Progress % (Col N).
  * **Timelines & Delays**: Scheduled Completion Date (Col U), Likely Completion Date (Col T/V), Dynamic Time Overrun (Col W), EOT Granted Till (Col X), EOT Proposal Agency (Col Y), Change of Scope/COS Notes (Col Z).
  * **Personnel & Field Logs**: Divisional Engineer Contact (Col AA), Contractor Agency (Col AB), Multi-paragraph Structural/Bridge/Clearance/CALA Stage Log (Col AC), Division & Timestamp (Col AD).
* **Single-Page Executive Passport (`ViewMajorProjectModal.tsx`)**:
  * Unified, continuous vertically scrollable technical dossier with 5 structured cards.
  * One-click **"Copy Log"** button for multi-paragraph bridge pier, deck, and forest clearance notes.
* **Multi-Tab Data Entry Form (`EditMajorProjectModal.tsx`)**:
  * 6 categorized tabs (`General`, `Sanction & IDs`, `Physical Progress`, `Financials & RCE`, `Timelines & EOT`, `Personnel & Notes`).
  * Live auto-summing math for physical lengths ($\text{Col M} = \text{Col K} + \text{Col L}$) and financial expenditures ($\text{Col S} = \text{Col Q} + \text{Col R}$).
* **Strict Non-Overlapping Preset Filters**:
  * Delay Ranges: `<1y`, `1-3y`, `>3y`.
  * Progress Ranges: `<25%`, `25-50%`, `50-75%`, `75-100%`.
* **Mega Projects Filter (`⚡ ≥ ₹50 Cr`)**: Dedicated toggle button isolating major capital works.

---

### 2. Level 3 Interactive Straight-Line Diagram (SLD) (`/highways/[id]/sld`)
Web-based interactive linear asset diagram replacing static Excel bar charts (`TN-NH-Bar chart June 2026.xlsx`).

* **Distance-Proportional Physical Canvas Scaling**: Horizontal bar widths and matrix positions are strictly proportional to physical distance (`length_km`), dynamically expanding longer stretches.
* **150px Minimum Width Protection Floor**: Guarantees chainage labels (`Km X → Km Y`), town markers, and length badges render legibly without overlap.
* **7 Interactive Matrix Layers**:
  1. **Towns & Landmarks**: Key urban junctions and settlements along the corridor.
  2. **Chainage Splits Ruler**: Linear physical chainage markers.
  3. **Proportional Physical Road Corridor**: Symmetrical centerline-aligned carriageway expansion (`6L`, `4L/4L+PS`, `2L+PS`, `2L`, `<2L`).
  4. **Carriageway Specs**: Width indicators (`20m`, `14m`, `10m`, `7m`).
  5. **Traffic PCU Volume**: Passenger Car Unit traffic densities with color ranges.
  6. **Right of Way (ROW)**: Corridor land acquisition boundary widths.
  7. **DPR & Sanctioned Proposals**: Project development proposals and bridge clearance statuses.
* **Height-Matched Caliper Dimension Gauge**: Fixed sidebar caliper reference lines seamlessly docking with the road corridor's vertical lane heights.
* **Interactive Hovercard**: Displays full asset metrics and formatted DLP work details.
* **Print & Export Engine**: Landscape browser `@media print` system with department letterhead and technical legend footers.

---

### 3. Master Highways Catalog (`/highways`)
Ground-truth inventory of all National Highway corridors in Tamil Nadu.

* **Level 1 Inventory**: Old/New NH numbers, chainage spans, length metrics, and multi-lane configuration distribution (`<2L`, `2L`, `2L+PS`, `4L`, `6L`).
* **Quadrant KPI Matrix**: Clickable 2x2 summary grid that filters and isolates specific lane distance metrics in table rows.
* **CRUD & Exporter**: Add/Edit/Soft-Delete modals + Custom Report Exporter (Excel `.xlsx` / CSV `.csv`) with parameter selectors.

---

### 4. Defect Liability Period (DLP) & Maintenance Tracker (`/dlp`)
Warranties and maintenance contract tracker covering all 26 columns of the departmental spreadsheet (`Status of NH Length Maintenance DLP as on 16.07.2026.xlsx`).

* **1-to-N Sub-Contract Engine**: Dynamic sub-contract repeaters storing multiple contractor warranties in `contract_details` JSONB.
* **4-Tier Status Tracking**: `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, and `UNDER_MAINTENANCE` with calendar date range filters.
* **Detailed Breakdown Cards**: DLP, STMC, PBMC, Construction, No DLP, and Uncontracted stretches.

---

### 5. Legal Cases & Litigation Portal (`/legal`)
Centralized judicial tracker managing 100% of the department's 48 legal fields across Module 1 (Active Cases) and Module 2 (Converted Case Proceedings).

* **Structured Case Management**: Case Numbers, Courts, Prayers, Counter Affidavit filing statuses, Compliance Deadlines, Interim/Final Orders, and Appeal tracking.
* **Cascading Autocomplete Selectors**: Dynamic Circle $\rightarrow$ Division and District $\rightarrow$ Court Complex dependencies.
* **Printable Case Dossier**: Dedicated PDF letterhead formatting.

---

### 6. Legal Fee Bills & Voucher Management (`/fee-bills`)
Invoice auditing and payment voucher management for departmental legal counsels.

* **Fee Voucher Processing**: Invoice logging, pendency tracking, voucher auditing, and lawyer fee verification.
* **Dynamic Master Data Config**: Master dropdown configuration for courts, advocates, and bill stages.

---

### 7. Departmental Staff Management (`/staff`)
Comprehensive human resource and field personnel directory.

* **Hierarchical Organization**: Master dropdown dependencies across `Circle`, `Division`, `Sub-Division`, `Section`, `Sub-Section`, and `Designation`.
* **Archiving & Recovery**: Soft-delete archive toggle with 1-click restore functionality.

---

### 8. Universal Excel & CSV Ingestion Engine (`/ingest`)
Automated data ingestion pipeline parsing complex departmental spreadsheets.

* **Merged Cell Resolution (`!merges`)**: Accurately extracts headers and values spanning merged cells.
* **Excel Numeric Date Serial Normalizer**: Automatically converts raw serial numbers (e.g. `44531` $\rightarrow$ `01.12.2021`).
* **Indian Date Standardizer (`parseIndianDate`)**: Handles `DD.MM.YYYY`, `DD-MM-YYYY`, `DD/MM/YYYY`, `MM.YYYY`, shorthand years (`24.05.27`), and clamps invalid calendar dates.
* **Multi-Division Regex Detection**: Automatically identifies divisions (`Vellore`, `Madurai`, `Coimbatore`, `Gobi`, `Chennai`, `Tirunelveli`, `Salem`, `Trichy`, `Villupuram`, etc.) from multi-line text cells.

---

## 🧮 Core Mathematical & Business Logic

### 1. Automatic Financial Progress Metric (%)
$$\text{Financial Progress (\%)} = \frac{\text{Cumulative Financial Expenditure (₹ Cr)}}{\max(\text{Revised Cost (RCE)}, \text{Sanctioned TPC})} \times 100$$
* Automatically calculated across the entire platform. Rendered with dual progress bars (Emerald for Physical %, Blue for Financial %).

### 2. Live Dynamic Delay Gap Engine
$$\text{Delay} = \text{Current Date} - \text{Scheduled Completion Date}$$
* **Past Deadline ($\text{Current Date} > \text{Scheduled Date}$ & Physical Progress $< 100\%$)**:
  * Computes exact elapsed time in **Years, Months & Days** (e.g. `1 Year & 6 Months (1.50 Yrs)` or `⚠️ 11d delay`).
* **On Schedule ($\text{Current Date} \le \text{Scheduled Date}$ or Physical Progress $= 100\%$)**:
  * Marked as **`On Schedule`** (`0 delay`).

### 3. Mega Projects Classification
$$\text{Cost Basis} = \text{Revised Cost (if present)} \text{ or } \text{Sanctioned Cost (TPC)} \ge 50\text{ Cr}$$
* Flagged with `⚡ ≥ ₹50 Cr Mega Project` badges.

---

## 🎨 UI/UX Design System: VS Code Minimalist Makeover

* **Color Palette**:
  * **Dark Mode**: Neutral Charcoal `#181a1f`, Panel Zinc `#25282f`, Border `#383c44`, Text `#f4f4f5`, Signature Blue `#007acc`.
  * **Light Mode**: Pure White `#ffffff`, Canvas `#f4f4f5`, Border `#e4e4e7`, Text `#181a1f`.
* **Sharp Corners**: Modern `--radius-*: 2px` (`rounded-xs`) across all cards, modals, buttons, tables, and chips.
* **Editor Tab Navigation Bar**: Top navigation bar with active blue indicator line.
* **Large Viewport Modals**: Screen-optimized modals (`max-w-5xl lg:max-w-6xl h-[92vh]`) with smooth vertical scrollbars.

---

## 📂 Project Structure

```
nh_proj/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dlp/                    # DLP warranties API
│   │   │   ├── fee-bills/              # Legal fee bills API & master data
│   │   │   ├── highways/               # Corridors catalog API
│   │   │   ├── ingest/                 # Excel ingestion API
│   │   │   ├── legal/                  # Litigation cases API
│   │   │   ├── major-projects/         # Ongoing works API & master data
│   │   │   ├── ongoing-works/          # Ongoing works route alias
│   │   │   ├── staff/                  # Department staff API & master data
│   │   │   └── sub-chainages/          # Linear asset sub-chainages API
│   │   ├── dlp/page.tsx                # DLP warranties dashboard
│   │   ├── fee-bills/page.tsx          # Fee bills audit dashboard
│   │   ├── highways/page.tsx           # Highways catalog dashboard
│   │   ├── highways/[id]/sld/page.tsx  # Interactive Straight-Line Diagram (SLD)
│   │   ├── ingest/page.tsx             # Bulk ingestion portal
│   │   ├── legal/page.tsx              # Legal proceedings dashboard
│   │   ├── major-projects/page.tsx     # Ongoing works alias route
│   │   ├── ongoing-works/page.tsx      # Ongoing works master portal
│   │   ├── staff/page.tsx              # Staff management dashboard
│   │   ├── globals.css                 # Global styles & VS Code design system
│   │   ├── layout.tsx                  # Root layout with NavigationHeader
│   │   └── page.tsx                    # Landing / redirect route
│   ├── components/
│   │   ├── common/                     # Reusable DatePickerInput & SearchableSelect
│   │   ├── dlp/                        # DLP modals, filters, and tables
│   │   ├── fee-bills/                  # Fee bill audit, entry, and list tables
│   │   ├── highways/                   # Corridors grid, table, and StraightLineDiagram
│   │   ├── legal/                      # Legal entry forms, view modals, and table
│   │   ├── major-projects/             # Ongoing works table, single-page view & edit modals
│   │   ├── staff/                      # Staff table, master modals, and entry forms
│   │   └── NavigationHeader.tsx        # VS Code tab-bar navigation
│   └── lib/
│       ├── dlp/                        # DLP master data configuration
│       ├── export/                     # Excel / CSV custom export generator
│       ├── formatters.ts               # Dynamic delay & financial progress calculations
│       ├── ingestion/                  # Parser engine with Excel serial date conversions
│       ├── legal/                      # Legal master data constants
│       └── supabase/                   # Supabase client & server instances
├── supabase/
│   └── migrations/                     # 20 incremental SQL migration files (0000 to 0019)
├── HANDOVER_STATUS.md                  # Comprehensive handover & sprint logs
├── README.md                           # Master project documentation
└── package.json                        # Next.js 16, React 19, TailwindCSS v4
```

---

## 🗄️ Database Migrations History

Located in `supabase/migrations/`:
* `0000_init.sql` $\rightarrow$ Core schema initialization.
* `0001_initial_schema.sql` $\rightarrow$ Base highways table structure.
* `0002_excel_ingestion_tables.sql` $\rightarrow$ Ingestion log & staging tables.
* `0003_fix_rls_update_policies.sql` $\rightarrow$ Row Level Security policies.
* `0004_add_delete_status_column.sql` $\rightarrow$ Soft-delete column for highways.
* `0005_legal_cases_schema.sql` $\rightarrow$ `legal_cases` and `lawyers` tables with JSONB fields.
* `0006_dlp_full_excel_fields.sql` $\rightarrow$ Expanded 26-column DLP schema.
* `0007_dlp_sub_contracts.sql` $\rightarrow$ 1-to-N sub-contract `contract_details` JSONB support.
* `0008_fix_dlp_rls_policies.sql` $\rightarrow$ DLP table RLS permissions.
* `0009_expand_highways_schema.sql` $\rightarrow$ Corridor lane configuration columns.
* `0010_highway_sub_chainages.sql` $\rightarrow$ Linear asset sub-chainages table.
* `0011_fee_bills_schema.sql` $\rightarrow$ `fee_bills` table for advocate vouchers.
* `0012_fee_bill_master_config.sql` $\rightarrow$ Dynamic fee bill master data table.
* `0013_consolidate_schemas.sql` $\rightarrow$ Schema consolidation and foreign key constraints.
* `0014_staff_members_schema.sql` $\rightarrow$ `staff_directory` and master tables.
* `0015_expand_sub_chainages_level3.sql` $\rightarrow$ PCU, ROW, DPR columns for SLD diagram.
* `0016_major_projects_50cr.sql` $\rightarrow$ Base Ongoing Works / Major Projects schema.
* `0017_ongoing_works_master_config.sql` $\rightarrow$ Ongoing works master configuration.
* `0018_ongoing_works_27_columns.sql` $\rightarrow$ Full 29-column expansion for ongoing works.
* `0019_widen_text_columns.sql` $\rightarrow$ Widened text columns for multi-paragraph bridge logs.

---

## 🛠️ Technology Stack & Dependencies

* **Framework**: Next.js 16 (App Router, Turbopack)
* **Frontend**: React 19, Tailwind CSS v4, Lucide React Icons
* **Database**: Supabase PostgreSQL with Row Level Security (RLS)
* **Excel Processing**: SheetJS (`xlsx`)
* **Build Verification**: `npm run build` verified (16/16 routes compiled with 0 errors).

---

## 📦 Getting Started & Development

### 1. Local Setup
```bash
# Clone the repository
git clone git@github.com:tnhighwaysdep/highways_project.git
cd highways_project

# Install dependencies
npm install

# Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Production Build
```bash
npm run build
```

### 3. Git Branching
* **`main`**: Active production branch
* **`mathir`**: Development & feature synchronization branch
