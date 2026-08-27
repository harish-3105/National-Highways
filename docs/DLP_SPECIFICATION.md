# DLP Module & SLD Integration — Complete Technical Specification

**Project**: Tamil Nadu National Highways Department Management System  
**Module**: Defect Liability Period (DLP) & 2D Linear Maintenance System  
**Routes**: `/dlp`, `/api/dlp`, `/api/dlp/master-data`, `/highways/[id]/sld`  
**Database Tables**: `public.dlp_corridors`, `public.dlp_work_stretches`, `public.dlp_master_config`  
**Migrations**: [`0029_dlp_rework_schema.sql`](file:///home/mathir14/nh_proj/supabase/migrations/0029_dlp_rework_schema.sql), [`0030_dlp_master_config.sql`](file:///home/mathir14/nh_proj/supabase/migrations/0030_dlp_master_config.sql)  
**Last Updated**: August 27, 2026  
**Status**: 🟢 **Production Ready & Deployed**

---

## 1. Executive Summary & Core Architectural Paradigm

The Defect Liability Period (DLP) Module manages maintenance guarantees, active capital works, maintenance contracts (STMC/PBMC), and uncontracted gap stretches across Tamil Nadu National Highways, seamlessly integrating with the Straight-Line Diagram (SLD) linear asset matrix.

### Core Architectural Principles:
1. **2D Continuous Spatial Coordinates for Every Work**:
   * **Longitudinal (X-Axis)**: Chainage `From (Km)` to `To (Km)` $\rightarrow$ $\text{Length} = \text{To} - \text{From}$.
   * **Lateral / Cross-Sectional (Y-Axis)**: Road width offsets measured in continuous floating-point meters (`NUMERIC(5,2)`) from **Centerline ($0$)**, eliminating rigid enum presets.
2. **Granular 1-Record-Per-Stretch Standard (Rows 7–12 Pattern)**:
   * Every sub-stretch is an independent, first-class database record rather than cramming multiple newline dates/contractors into merged corridor cells.
3. **5 First-Class Work Categories**:
   * `Under DLP`, `Under Construction`, `Under STMC`, `Under PBMC`, `Under NO DLP`.
4. **Every Active Category Includes `Name of Work`**:
   * Captures the specific project title/description executed on that stretch.
5. **Closed-Loop Lifecycle Automation**:
   * Construction reaches $100\%$ progress $\rightarrow$ auto-graduates to `Under DLP`.
   * Active maintenance expires ($\text{Current Date} \ge \text{DLP Till Date}$) $\rightarrow$ auto-transitions to `Under NO DLP`.
6. **No Redundant / Fabricated Fields**:
   * `Additional Length Required` column is **completely eliminated**.
   * Zero fake placeholder defaults, zero JSON packing—all fields map 1:1 to strongly-typed PostgreSQL columns.

---

## 2. Updated 24-Column Excel Reference (`798 NH Length Summary`, Cols A to AC)

| Col Letter | Parent Header (Row 3) | Child Sub-Header (Row 4) | Purpose & Data Type | Form & DB Mapping |
| :---: | :--- | :--- | :--- | :--- |
| **Col A** | `S. No` | — | Dynamic UI row counter (`idx + 1`) | Dynamic accessory only |
| **Col B** | `Division` | — | Administrative Division | Dropdown (`TEXT`) |
| **Col C** | `NH No.` | — | National Highway identifier | Text / Select (`TEXT`) |
| **Col D** | `Chainage` | `From` | Corridor / stretch start chainage | `NUMERIC(8,3)` |
| **Col E** | `Chainage` | `To` | Corridor / stretch end chainage | `NUMERIC(8,3)` |
| **Col F** | `Total Length` | — | Sub-stretch length (`To - From`) | Computed `NUMERIC(8,3)` |
| **Col G** | `Road Width` | `From` | Lateral cross-section start from centerline $0$ | `NUMERIC(5,2)` |
| **Col H** | `Road Width` | `To` | Lateral cross-section end from centerline $0$ | `NUMERIC(5,2)` |
| **Col I** | `Under DLP` | `Name of Contractor` | Contractor executing DLP | `TEXT` |
| **Col J** | `Under DLP` | `Name of Work` | Title / description of DLP project | `TEXT` |
| **Col K** | `Under DLP` | `Date of Commencement` | Work commencement date | `DATE` |
| **Col L** | `Under DLP` | `DLP till (Date)` | DLP guarantee expiry date | `DATE` |
| **Col M** | `Length under Construction` | `Name of Contractor` | Construction agency | `TEXT` |
| **Col N** | `Length under Construction` | `Name of Work` | Title / description of Construction project | `TEXT` |
| **Col O** | `Length under Construction` | `Date of Commencement` | Construction start date | `DATE` |
| **Col P** | `Length under Construction` | `Physical Progress %` | Current progress percentage ($0$–$100\%$) | `NUMERIC(5,2)` |
| **Col Q** | `Length under Construction` | `Actual Date of Completion` | Completion date (required when $100\%$) | `DATE` |
| **Col R** | `Length under Construction` | `DLP Period in Years` | Guarantee period (e.g. $5$ years) | `INTEGER` |
| **Col S** | `Length under STMC` | `Name of Contractor` | STMC contractor | `TEXT` |
| **Col T** | `Length under STMC` | `Name of Work` | Title / description of STMC work | `TEXT` |
| **Col U** | `Length under STMC` | `Date of Commencement` | STMC start date | `DATE` |
| **Col V** | `Length under STMC` | `DLP till (Date)` | STMC DLP expiry date | `DATE` |
| **Col W** | `Length under PBMC` | `Name of Contractor` | PBMC contractor | `TEXT` |
| **Col X** | `Length under PBMC` | `Name of Work` | Title / description of PBMC work | `TEXT` |
| **Col Y** | `Length under PBMC` | `Date of Commencement` | PBMC start date | `DATE` |
| **Col Z** | `Length under PBMC` | `DLP till (Date)` | PBMC DLP expiry date | `DATE` |
| **Col AA** | `Length under NO DLP` | `Scheme` | Proposed remediation / project scheme | `TEXT` |
| **Col AB** | `Length under NO DLP` | `DLP ended on` | Historical date when past DLP expired | `DATE` |
| **Col AC** | `Remarks` | — | Actionable remarks / corridor notes | `TEXT` |

---

## 3. 2D Continuous Geometry & Boundary Model

Every work is defined by its **Spatial Boundaries**:

$$\text{Spatial Boundary} = [\text{From Km}, \text{To Km}] \times [\pm \text{Width From}, \pm \text{Width To}]$$

```text
Symmetrical Cross-Sectional Expansion from Centerline (0):
|<--- Left Widening (3.5m) --->|<--- Main 2-Lane Carriageway (7.0m) --->|<--- Right Widening (3.5m) --->|
[-7.0m Outer Edge] ---------- [-3.5m] ========= [ 0 Centerline ] ========= [+3.5m] ---------- [+7.0m Outer Edge]
```

### The Two Real-World Boundary Behaviors:
1. **Center Carriageway Work** (`Width: 0 to 3.5m`):
   * LHS boundary $[-3.5\text{m}, 0]$ and RHS boundary $[0, +3.5\text{m}]$ **touch at the Centerline ($0$)**, creating a single continuous central $7.0\text{m}$ carriageway band.
2. **Both Sides Widening Work** (`Width: 3.5 to 7.0m`):
   * LHS boundary $[-7.0\text{m}, -3.5\text{m}]$ and RHS boundary $[+3.5\text{m}, +7.0\text{m}]$ form **2 distinct parallel boundary strips** running along the outer flanks.

### Exact 1:1 Lateral Boundary-to-Bar Ratio Alignment (Standard: 6px / meter)
The vertical height and centerline offset in the boundary renderer match the SLD Carriageway Gauge and baseline road bar heights 1:1 using a constant $6\text{px}$ per meter width scale:

| Road Configuration | Total Width ($W$) | Half-Width Offset ($m$) | Bar Height ($W \times 6\text{px}$) | Centerline Offset ($\pm m \times 6\text{px}$) |
| :--- | :---: | :---: | :---: | :---: |
| **< 2-Lane (Single Lane)** | $3.75\text{m}$ | $1.875\text{m}$ | **$22\text{px}$** | $\pm 11\text{px}$ |
| **2-Lane (`2L`)** | $7.0\text{m}$ | $3.5\text{m}$ | **$42\text{px}$** | $\pm 21\text{px}$ |
| **2L + Paved Shoulder (`2L+PS`)** | $10.0\text{m}$ | $5.0\text{m}$ | **$60\text{px}$** | $\pm 30\text{px}$ |
| **4-Lane / 4L+PS (`4L`)** | $14.0\text{m}$ | $7.0\text{m}$ | **$84\text{px}$** | $\pm 42\text{px}$ |
| **6-Lane (`6L`)** | $20.0\text{m}$ | $10.0\text{m}$ | **$120\text{px}$** | $\pm 60\text{px}$ |

Unified Linear Scale Formula:
$$\text{offsetPx}(m) = m \times 6$$
$$\text{heightPx}_{\text{center}} = 2 \times w_{\text{to}} \times 6$$
$$\text{heightPx}_{\text{strip}} = (w_{\text{to}} - w_{\text{from}}) \times 6$$

### Dynamic Level 2 Micro-Lane Width Defaulting & Empty Form Standards
1. **Zero Input Placeholders in Tab 2**:
   * When adding a new work stretch in Tab 2, all input fields (`Chainage From`, `Chainage To`, `Road Width From`, `Road Width To`, `Contractor Name`, `Work Name`, dates) start **completely empty (`''` / `null`)** to prevent accidental submission of stale default values.
2. **"Use Level 2 Width" Action**:
   * When `From Km` and `To Km` are entered, clicking **"Use Level 2 Width"** queries the Level 2 Micro-Lane database (`type=MICRO_LANE`) and sets:
     * `Road Width From`: $0.00\text{m}$
     * `Road Width To`: Full width of the lane ($3.75\text{m}$ for $<2\text{L}$, $7.00\text{m}$ for $2\text{L}$, $10.00\text{m}$ for $2\text{L+PS}$, $14.00\text{m}$ for $4\text{L}$, $20.00\text{m}$ for $6\text{L}$, or explicit `carriageway_width`).

### Physical Road Width Capacity Validation & Strict Save Blocking
To prevent spatial impossibilities (e.g. entering a 4-Lane $14\text{m}$ width over a 2-Lane $7\text{m}$ section):
* The system evaluates all overlapping Level 2 Micro-Lane sub-stretches covered by `[From Km, To Km]`.
* If the entered `Road Width To` exceeds the physical carriageway capacity of **any** underlying section within that span:
  * An immediate inline warning is displayed on the stretch card identifying the exact bottleneck chainage span and its maximum allowed width.
  * **Saving the corridor is strictly blocked** on both frontend form submission and backend API routes (`400 Bad Request`) until the engineer adjusts the width or splits the work into discrete matching entries.

### Structured 3-Tier Grouping Hierarchy
On the main DLP overview and detailed modals, discrete stretches are organized into a clean 3-tier structure:
$$\mathbf{Contractor\ Name} \longrightarrow \mathbf{Work\ Name} \longrightarrow \mathbf{Discrete\ 2D\ Spatial\ Stretches}$$

### Consolidated Category Totals & Automatic Unworked "NO DLP" Calculation
On the Corridor Overview Card:
* Summary badges aggregate total distance **by Work Category** (`DLP`, `Construction`, `STMC`, `PBMC`).
* The **NO DLP** summary badge automatically calculates the total unworked gap distance along the corridor:
  $$\text{NO DLP (Km)} = \text{Total Corridor Length} - \sum(\text{Active Works: DLP, Construction, STMC, PBMC})$$
  *(inclusive of explicit manual NO DLP records)*, providing the executive with the true uncontracted distance without requiring engineers to manually enter 20–30 gap rows.

---

## 4. Straight-Line Diagram (SLD) Visual Integration

1. **Inside the Boundary (On Canvas)**:
   * Displays **strictly `Name of Work` only** (or `Scheme` for NO DLP).
   * Color-coded boundary box:
     * `DLP`: Vibrant Emerald (`#059669`)
     * `Construction`: Royal Blue (`#2563eb`)
     * `STMC`: Warm Amber (`#d97706`)
     * `PBMC`: Purple (`#7c3aed`)
     * `NO DLP`: Slate (`#475569`)
2. **On Hover / Click (Rich Passport Panel)**:
   * Surfaces the complete maintenance details:
     * **`Name of Work`** *(Highlighted title)*
     * **`Category Badge`**
     * **`Name of Contractor`**
     * **`Dates & Timeline`**: Commencement Date, DLP Till Date, **Live Days Remaining countdown badge**
     * **`2D Dimensions`**: Chainage span (`From` $\rightarrow$ `To`, Length) & Road Width (`From` $\rightarrow$ `To` meters)
     * **`Remarks / Scheme`**

---

## 5. Relational Database Schema

### Table 1: `dlp_corridors` (Parent Entity)
```sql
CREATE TABLE IF NOT EXISTS public.dlp_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_name TEXT NOT NULL,
    highway_code TEXT NOT NULL,
    from_km NUMERIC(8,3) NOT NULL,
    to_km NUMERIC(8,3) NOT NULL,
    total_length_km NUMERIC(8,3) NOT NULL,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table 2: `dlp_work_stretches` (Granular 2D Work Entity)
```sql
CREATE TABLE IF NOT EXISTS public.dlp_work_stretches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.dlp_corridors(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('DLP', 'CONSTRUCTION', 'STMC', 'PBMC', 'NO_DLP')),
    chainage_from_km NUMERIC(8,3) NOT NULL,
    chainage_to_km NUMERIC(8,3) NOT NULL,
    length_km NUMERIC(8,3) NOT NULL,
    road_width_from_m NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    road_width_to_m NUMERIC(5,2) NOT NULL DEFAULT 3.50,
    contractor_name TEXT,
    work_name TEXT,
    commencement_date DATE,
    dlp_till_date DATE,
    physical_progress_pct NUMERIC(5,2),
    actual_completion_date DATE,
    dlp_period_years INTEGER,
    scheme TEXT,
    dlp_ended_on_date DATE,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table 3: `dlp_master_config` (Normalized Dynamic Master Config)
```sql
CREATE TABLE IF NOT EXISTS public.dlp_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,         -- 'circle', 'division', 'scheme'
    value TEXT NOT NULL,            -- e.g. 'Salem', 'NH(O)'
    parent_category TEXT,           -- 'circle' (when category is 'division')
    parent_value TEXT,              -- e.g. 'Salem' (parent circle of division)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

