# Strategic Development Plan: Level 2 & Level 3 Corridor Architecture

**Project**: Tamil Nadu National Highways Department Management System  
**Repository Remote**: `git@github.com:tnhighwaysdep/highways_project.git`  
**Target Branch**: `main`  
**Date**: August 9, 2026  

---

## 1. System Architecture Hierarchy Overview

The Highway Corridor Management System is structured into three progressive architectural levels:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Master Highway Corridor Catalog (/highways)                        │
│ [STATUS: LIVE] Parent Highway Corridors, Length Summaries & Catalog CRUD   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: Granular Sub-Chainage & Traffic PCU Breakdown                     │
│ [STATUS: PLANNED FOR NEXT SPRINT]                                           │
│ Route: /highways/[id]/chainages                                             │
│ Source Excel: Lane wise PCU Details.xlsx (Sheet: "NH")                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: Interactive Linear Asset Diagram & Straight-Line Map (SLD)        │
│ [STATUS: PLANNED FOR NEXT SPRINT]                                           │
│ Route: /highways/[id]/sld                                                   │
│ Source Excel: TN-NH-Bar chart June 2026.xlsx (14 Highway Bar Charts)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LEVEL 2: Granular Sub-Chainage & Traffic PCU Breakdown (`/highways/[id]/chainages`)

### A. Objectives & Purpose
To break down high-level parent highway corridors into **consecutive kilometer sub-segments** tracking micro-changes in lane configurations, actual traffic volume counts (Passenger Car Unit - PCU), and DPR widening sanction statuses.

### B. Core Features & Data Schema

1. **Sub-Chainage Segment Table**:
   - Displays consecutive sub-stretch rows for a selected corridor (*e.g., Km 0.0 to 3.75, Km 3.75 to 4.60, Km 4.60 to 23.10*).
   - Metrics captured per sub-segment:
     - `from_chainage` & `to_chainage` (*e.g., Km 29.25 to Km 38.94*)
     - `segment_length_km` (*auto-calculated*)
     - `lane_configuration` (*2-Lane, 2-Lane with Paved Shoulder [2L+PS], 4-Lane [4L], 6-Lane*)
     - `actual_pcu_count` (*Actual Traffic Count in PCU*)
     - `dpr_widening_status` (*Status of DPR: e.g., 2L to 4L proposal submitted to RO MoRTH for approval*)
     - `remarks` (*Departmental notes & sanction status*)

2. **Traffic PCU Congestion Heatmap**:
   - Visual color-coded PCU indicators:
     - 🟢 **Normal Flow** (< 5,000 PCU)
     - 🟡 **Moderate Density** (5,000 – 15,000 PCU)
     - 🔴 **High Congestion / Widening Required** (> 15,000 PCU)

3. **Sub-Chainage Entry & Edit Modal Suite**:
   - `AddSubChainageModal.tsx`: Form to add new chainage sub-segments.
   - `EditSubChainageModal.tsx`: Form to update lane status, PCU counts, and DPR remarks.

4. **Database Migration (`supabase/migrations/0009_highway_chainages.sql`)**:
   - Table `highway_sub_chainages`:
     - `id` (UUID PK)
     - `highway_id` (FK referencing `highways.id`)
     - `from_km` (NUMERIC)
     - `to_km` (NUMERIC)
     - `length_km` (NUMERIC)
     - `lane_configuration` (VARCHAR)
     - `pcu_count` (INT)
     - `dpr_status` (TEXT)
     - `remarks` (TEXT)

---

## 3. LEVEL 3: Interactive Linear Asset Diagram & Straight-Line Map (`/highways/[id]/sld`)

### A. Objectives & Purpose
To replace manual Excel bar charts (`TN-NH-Bar chart June 2026.xlsx`) with a **dynamic, interactive Web-Based Straight-Line Diagram (SLD)** that visually plots the entire highway from start to finish along a horizontal linear axis.

### B. Core Features & User Experience

1. **Interactive Multi-Track Visual Timeline**:
   - Rendered using responsive SVG / HTML5 Canvas representing `Km 0.0` to `End Km`.
   - **Track 1: Major Towns & Landmarks**: Pins for cities, junctions, river bridges, and ROBs (*e.g., Kurinjipadi, Virudhachalam*).
   - **Track 2: Lane Geometry**: Colored horizontal bars representing lane widths (*2L, 2L+PS, 4L*).
   - **Track 3: Maintenance & Guarantee Status**:
     - 🟢 Green: Active DLP Guarantee
     - 🟡 Yellow: Expiring DLP Guarantee
     - 🔴 Red: Expired Guarantee / Action Required
     - 🔵 Blue: STMC / PBMC Active Contracts
   - **Track 4: Ongoing Construction & Repair Works**: Visual progress bars showing widening and strengthening projects.
   - **Track 5: Safety Hazards & Black Spot Zones**: Warning badges mapped to exact kilometer points.

2. **Interactive Hover Tooltips & Live Database Sync**:
   - Hovering over any kilometer section on the diagram opens a rich tooltip card displaying:
     - Exact `From Km` to `To Km` bounds
     - Contractor Name & Contract Value
     - Expiry Date & Days Remaining
     - Traffic PCU Count
   - **Real-Time Database Sync**: Updating a DLP contract or sub-chainage in the portal automatically updates the visual SLD diagram without manual coloring!

3. **Filter & Zoom Controls**:
   - Interactive zoom controls (`Zoom In`, `Zoom Out`, `Reset View`).
   - Category toggles: Show/Hide DLP, Construction, Black Spots, or STMC.

4. **1-Click Executive PDF Export**:
   - Generates high-resolution vector PDF diagrams formatted for departmental review meetings.

---

## 4. Implementation Milestone Schedule (Next Session)

| Milestone | Task Description | Deliverables |
| :---: | :--- | :--- |
| **Phase 1** | SQL Migration `0009_highway_chainages.sql` & API handler `/api/highways/[id]/chainages` | Database schema & CRUD API |
| **Phase 2** | Level 2 UI Component: Sub-Chainage Table & PCU Heatmap (`/highways/[id]/chainages`) | Interactive Level 2 page |
| **Phase 3** | Bulk Ingestion of `Lane wise PCU Details.xlsx` into Level 2 schema | Parser update & data upload |
| **Phase 4** | Level 3 UI Component: Web Straight-Line Diagram SVG/Canvas Engine (`/highways/[id]/sld`) | Interactive Level 3 SLD page |
| **Phase 5** | Live Sync Integration (linking DLP contracts & PCU data onto SLD timeline) | Real-time visual rendering |
| **Phase 6** | Build verification (`npm run build`) & Git commit/push to `origin/main` | Deployment to Vercel |

---

**Status**: Ready for execution in next development session.
