# Strategic Decision & Technical Roadmap: Level 1 Completion & Multi-File Architecture

**Project**: Tamil Nadu National Highways Department Management System  
**Repository**: `git@github.com:tnhighwaysdep/highways_project.git`  
**Date**: August 10, 2026  
**Status**: Decided & Documented (Ready for Execution)

---

## 1. Executive Summary & Decision Context

During our architectural alignment session, we identified that the **`highways` PostgreSQL table** in our live application used simplified single-column metrics (e.g. a single string `configuration: "4-Lane"`), whereas the official departmental master file (`NH LENGTH & LANE 09.06.2026.xlsx`) captures a rich, multi-column breakdown per corridor (including `Old NH No.`, `New NH No.`, and precise kilometer breakdowns across `<2L`, `2L`, `2L+PS`, `4L`, and `6L` lane configurations).

**Strategic Decision**: Before moving on to Level 2 (Sub-Chainages & PCU) or Level 3 (Interactive SLD), we will **first complete Level 1 (Master Corridor Catalog) 100% properly** by upgrading the `highways` table schema, updating the ingestion engine, and refreshing the Master Catalog UI components to achieve total ground-truth parity with `NH LENGTH & LANE 09.06.2026.xlsx`.

---

## 2. Unified 1-to-1 Database Architecture (4 Core Spreadsheets)

To prevent schema pollution and maintain modularity, each core departmental spreadsheet maps 1-to-1 to a dedicated PostgreSQL database table:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. highways table (Level 1 Master Catalog)                                                 │
│ Source Excel: NH LENGTH & LANE 09.06.2026.xlsx                                              │
│ Data: Parent Corridors, Old/New NH Nos, Total Length, Master Lane Lengths (<2L, 2L, 2L+PS, 4L, 6L) │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. highway_sub_chainages table (Level 2 PCU Breakdown)                                     │
│ Source Excel: Lane wise PCU Details.xlsx                                                    │
│ Data: Consecutive Stretch Ranges (From Km ➔ To Km), Sub-length, PCU Count, DPR Status        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. highway_chainages table (Level 3 SLD Bar Chart Features)                                 │
│ Source Excel: TN-NH-Bar chart June 2026.xlsx                                                │
│ Data: Point Chainages (Km), Town Names, ROW Width, Carriageway Spec, ROBs, Toll Plazas      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              ▲
                                              │
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. dlp_contracts table (DLP & Guarantee Tracker)                                           │
│ Source Excel: Status of NH Length Maintenance DLP as on 16.07.2026 (1).xlsx                  │
│ Data: Guarantee Dates, Contractors, 26 Breakdown Columns, 1-to-N Sub-Contracts              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Schema Comparison: Current DB vs Master Excel

| Field Category | Master Departmental Excel (`NH LENGTH & LANE 09.06.2026.xlsx`) | Current DB `highways` Table | New Database Column Name |
| :--- | :--- | :--- | :--- |
| **Old NH Number** | `Old NH No.` (*e.g., 67, 207, 219, 234, -*) | ❌ *Missing* | `old_nh_no` (VARCHAR) |
| **New NH Number** | `New NH No.` (*e.g., 181, 648, 179A, 336, 75*) | ❌ *Missing* | `new_nh_no` (VARCHAR) |
| **Road Code** | Standardized (*e.g., NH-181, NH-381A*) | `road_code` | `road_code` (VARCHAR) |
| **Corridor Title** | `Name of Section/Road` | `road_name` | `road_name` (VARCHAR) |
| **Chainage Bounds** | `Chainage in new Nomenclature` (`From` & `To`) | `from_chainage` & `to_chainage` | `from_chainage` & `to_chainage` |
| **Total Length** | `State NH Wing Length (km)` (*797.562 km*) | `length_km` | `length_km` (DECIMAL) |
| **`< 2-Lane` Length** | `Configuration >2L` (*0.50 km*) | ❌ *Missing* | `length_less_than_2l` (DECIMAL) |
| **`2-Lane` Length** | `Configuration 2L` (*120.93 km*) | ❌ *Missing* | `length_2l` (DECIMAL) |
| **`2L + Paved`** | `Configuration 2L+PS` (*355.57 km*) | ❌ *Missing* | `length_2l_ps` (DECIMAL) |
| **`4-Lane` Length** | `Configuration 4L` (*317.93 km*) | ❌ *Missing* | `length_4l` (DECIMAL) |
| **`6-Lane` Length** | `Configuration 6L` (*2.64 km*) | ❌ *Missing* | `length_6l` (DECIMAL) |

---

## 4. Immediate Execution Work Items (Level 1 Perfection)

When resuming, execute the following step-by-step deliverables:

### Milestone 1: SQL Migration (`supabase/migrations/0010_expand_highways_schema.sql`)
```sql
-- Migration 0010: Expand highways table with Old/New NH Nos and multi-lane breakdown
ALTER TABLE public.highways
ADD COLUMN IF NOT EXISTS old_nh_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS new_nh_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS length_less_than_2l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_2l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_2l_ps DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_4l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_6l DECIMAL(10, 3) DEFAULT 0;
```

### Milestone 2: Automated Ingestion Engine (`src/lib/ingestion/parser.ts`)
- Implement `parseNhLengthAndLaneExcel` parser processing sheet `NH Wing 9.6.26`.
- Bulk ingest all 11 ground-truth corridors into Supabase.

### Milestone 3: API Route Updates (`src/app/api/highways/route.ts`)
- Update `HighwayCorridor` interface and CRUD queries.
- Update aggregate calculations for state-wide totals (**797.562 km** total, breakdown across `<2L`, `2L`, `2L+PS`, `4L`, `6L`).

### Milestone 4: Master Catalog UI Overhaul (`src/components/highways/`)
- `HighwaysTable.tsx` & `HighwaysGrid.tsx`: Display `Old NH No.`, `New NH No.`, and interactive multi-lane progress bars.
- `KpiHeaderCards.tsx`: Display exact state-wide lane distribution metrics.
- `AddHighwayModal.tsx` & `EditHighwayModal.tsx`: Include inputs for Old/New NH numbers and lane configuration breakdown fields.
- `ExportHighwayModal.tsx`: Export all 100% ground-truth columns to `.xlsx` / `.csv`.

---

## 5. Verification Checklist

- [ ] Run `npx tsc --noEmit` &rarr; 0 errors.
- [ ] Run `npm run build` &rarr; 100% clean compilation.
- [ ] Query Supabase database to verify all 11 corridors have populated Old/New NH numbers and exact lane lengths.

---

**Status**: Saved & ready to resume whenever you are ready!
