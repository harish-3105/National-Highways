# Tamil Nadu National Highways Department Management System

A centralized web application for managing National Highway corridors, linear asset geometries, Defect Liability Period (DLP) warranties, Ongoing Works (Major Projects), legal case proceedings, legal fee bills, and departmental staff inventory across Tamil Nadu.

---

## 🚀 Key Modules & System Architecture

### 1. Ongoing Works & Major Projects (`/ongoing-works` / `/major-projects`)
- **29-Column Deep Data Mapping (Cols A through AD)**: Ground-truth coverage of high-value corridor projects with live database sync.
- **Dynamic Financial Progress Metric**:
  $$\text{Financial Progress (\%)} = \frac{\text{Cumulative Expenditure}}{\max(\text{Revised RCE Cost}, \text{Sanctioned TPC})} \times 100$$
- **Live Dynamic Delay Gap Calculation**:
  $$\text{Delay} = \text{Current Date} - \text{Scheduled Completion Date}$$
  Evaluates real-time elapsed gap in Years, Months, and exact sub-month Day intervals (`11d delay`).
- **Mega Projects Filter (`⚡ ≥ ₹50 Cr`)**: Quick filter toggle for major works with Sanctioned/Revised cost $\ge 50$ Cr.
- **Single-Page Executive Passport (`ViewMajorProjectModal.tsx`)**: Continuous vertically scrollable technical dossier with 5 structured cards and a one-click "Copy Log" button for structural bridge and clearance notes.
- **Multi-Tab Data Entry Form (`EditMajorProjectModal.tsx`)**: 6 structured tabs with automated sum and cost escalation calculations to eliminate human error.

### 2. Level 3 Interactive Straight-Line Diagram (`/highways/[id]/sld`)
- **Dual Light/Dark Mode Support**: Full theme compatibility for both Light Mode (clean white canvas) and Dark Mode (VS Code neutral charcoal).
- **Distance-Proportional Physical Bar Scaling**: Dynamic horizontal scaling proportional to physical distance (`length_km`) with a 150px minimum width floor.
- **7 Interactive Matrix Layers**: Towns & Landmarks, Chainage Splits Ruler, Proportional Physical Road Corridor, Carriageway Specs, Traffic PCU Volumes, Right of Way (ROW), and DPR/Scheme Proposals.
- **Height-Matched Caliper Dimension Gauge**: Fixed sidebar calipers matching corridor lane heights (`6L`, `4L/4L+PS`, `2L+PS`, `2L`).
- **Landscape Print & Export PDF Engine**: Built-in `@media print` system with department header and technical legend.

### 3. Master Highways Catalog (`/highways`)
- **Level 1 Inventory**: Complete NH corridor catalog across Tamil Nadu with Old/New NH numbers, endpoints, and configuration breakdowns.
- **Quadrant KPI Matrix**: Clickable quadrant cards to filter and isolate specific lane distributions.
- **CRUD & Exporter**: In-place Add/Edit/Soft-Delete modals + Excel/CSV report generation.

### 4. Defect Liability Period & Warranty Tracker (`/dlp`)
- **26-Column Excel Parity**: Complete coverage of departmental maintenance spreadsheets with 1-to-N child sub-contract extractors.
- **Warranty Status Engine**: 4-tier tracking (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `UNDER_MAINTENANCE`) with calendar date range filters.

### 5. Legal Cases & Litigation Portal (`/legal`)
- **Comprehensive Case Records**: 48 departmental fields covering Case Numbers, Courts, Prayers, Counter Affidavits, Compliance Dates, and Converted Case Proceedings (Module 1 & 2).
- **Official Letterhead Export**: Dedicated PDF print letterhead formatting.

### 6. Legal Fee Bills & Voucher Management (`/fee-bills`)
- **Fee Voucher Tracker**: Invoice processing, voucher auditing, lawyer fees, and printable letterheads.
- **Dynamic Master Data Config**: Dynamic dropdown list management.

### 7. Staff Management System (`/staff`)
- **Departmental Staff Directory**: Staff inventory with dynamic master dropdowns (`Circle`, `Division`, `Sub-Division`, `Section`, `Designation`).
- **Inline Editing & Archiving**: Soft-delete archive toggles with 1-click restore functionality.

### 8. Data Ingestion Engine (`/ingest`)
- **Excel Parser**: Resilient parser with merged cell resolution (`!merges`), Indian date format normalization (`parseIndianDate`), Excel numeric date serials (`44531`), slashes/extension highway code sanitization, and multi-division regex recognition.

---

## 🎨 UI/UX Design System: VS Code Minimalist Makeover

- **Theme Palette**: Neutral charcoal & zinc (`#181a1f`, `#25282f`, `#383c44`, `#f4f4f5`) with VS Code signature blue accents.
- **Sharp Corners**: Modern `--radius-*: 2px` (`rounded-xs`) across all cards, modals, buttons, tables, and chips.
- **Navigation Bar**: Tab-bar aesthetic with active blue indicator line.
- **Large Viewport Modals**: Screen-optimized modals (`max-w-5xl lg:max-w-6xl h-[92vh]`) with smooth vertical scrollbars.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: React 19
- **Styling**: TailwindCSS v4 with custom dual light/dark design system
- **Database**: [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS)
- **Icons**: Lucide React (`lucide-react`)
- **Document Export**: Built-in browser landscape `@media print` system & XLSX/CSV generator

---

## 📦 Getting Started & Development

### Local Setup
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

### Git Branching
- **`main`**: Active production branch
- **`mathir`**: Development & feature synchronization branch
