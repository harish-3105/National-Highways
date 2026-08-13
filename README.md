# Tamil Nadu National Highways Department Management System

A state-of-the-art web application for managing National Highway corridors, linear asset geometries, Defect Liability Period (DLP) warranties, legal case proceedings, legal fee bills, and departmental staff inventory across Tamil Nadu.

---

## 🚀 Key Modules & System Architecture

### 1. Master Highways Catalog (`/highways`)
- **Level 1 Master Catalog**: Ground-truth inventory of all NH corridors in Tamil Nadu with Old/New NH numbers, chainage spans, length metrics, and multi-lane configuration distribution (`<2L`, `2L`, `2L+PS`, `4L`, `6L`).
- **Interactive KPI Dashboard**: 2x2 quadrant summary grid with clickable lane configuration filters that isolate specific lane distance metrics in table rows.
- **Streamlined Catalog Table**: Quick actions for Viewing Passport Cards, Editing Corridors, Soft-Deleting, and Launching SLD Timelines.

### 2. Level 3 Interactive Straight-Line Diagram (`/highways/[id]/sld`)
- **Linear Asset Timeline**: Web-based interactive Straight-Line Diagram (SLD) replacing manual Excel bar charts.
- **Excel-Style Fixed Grid Cells**: Sub-chainage split columns (`colWidthPx = 150px * zoomLevel`) for maximum human readability.
- **Centerline Symmetrical Road Expansion**: Visual carriageway bar height expansion matching lane widths (`6L`, `4L/4L+PS`, `2L+PS`, `2L`).
- **Precision Caliper Docking Gauge**: Vertical guide stems with top and bottom right-pointing arrow arms (`─────►`) for 1-to-1 visual alignment.
- **Print & Export PDF Engine**: Print system with dynamic landscape scaling (`--sld-print-scale`), official department letterhead, and technical legend report footers.

### 3. Defect Liability Period & Warranty Tracker (`/dlp`)
- **26-Column Excel Parity**: Complete coverage of departmental maintenance spreadsheets with 1-to-N child sub-contract extractors.
- **Warranty Status Engine**: 4-tier tracking (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `UNDER_MAINTENANCE`).

### 4. Legal Cases & Litigation Portal (`/legal`)
- **Comprehensive Case Records**: 48 departmental fields covering Case Numbers, Courts, Prayers, Counter Affidavits, Compliance Dates, and Converted Case Proceedings.
- **Official Letterhead Export**: Dedicated PDF print letterhead formatting.

### 5. Legal Fee Bills & Voucher Management (`/fee-bills`)
- **Fee Voucher Tracker**: Invoice processing, voucher auditing, lawyer fees, and printable letterheads.
- **Dynamic Master Data Config**: Dynamic dropdown list management.

### 6. Staff Management System (`/staff`)
- **Departmental Staff Directory**: Staff inventory with dynamic master dropdowns (`Circle`, `Division`, `Sub-Division`, `Section`, `Sub-Section`, `Designation`).
- **Inline Editing & Archiving**: Soft-delete archive toggles with 1-click restore functionality.

### 7. Data Ingestion Engine (`/ingest`)
- **Excel Parser**: Resilient parser with merged cell resolution (`!merges`), Indian date format normalization (`parseIndianDate`), slashes/extension highway code sanitization, and subtotal row filtering.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: React 19
- **Styling**: Vanilla CSS & TailwindCSS v4 with custom light/dark design system
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
