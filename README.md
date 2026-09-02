# Tamil Nadu National Highways Department Management System

A comprehensive, state-of-the-art enterprise web platform engineered to digitize, monitor, analyze, and manage the core operational assets of the National Highways division across Tamil Nadu.

---

## 🏛️ System Overview

The application unifies ground-truth departmental data across corridors, linear asset geometry, multi-crore capital infrastructure works, contractor warranty compliance, judicial litigation, fee auditing, human resources, and data ingestion into a high-performance, reactive portal with zero external runtime bloat.

```
+---------------------------------------------------------------------------------------------------+
|                                   GLOBAL NAVIGATION HEADER (h-14)                                 |
|  [NH PWD] Tamil Nadu National Highways Portal   |  Corridors | DLP | Ongoing | Legal | Bills | Staff  |
+---------------------------------------------------------------------------------------------------+
|                                     MODULE PAGE HEADER (p-5)                                      |
|  [Badge] Module Title & Subtitle Context        | [Refresh]      [Master Config]  [Add New (Blue)]|
|                                                 | [Archived(N)]  [Import Data]    [Export Data]   |
+---------------------------------------------------------------------------------------------------+
|  [4-Quadrant KPI Stat Cards]                   | [Filter Toolbar: Search + Cascading Dropdowns]   |
+-------------------------------------------------+-------------------------------------------------+
|                                 MAIN DATA PRESENTATION LAYER                                      |
|  - Table View (Sortable, Searchable, Paginated, Action Menu: View / Edit / Soft-Delete / Restore)  |
|  - Progressive Stage-Gated Entry Form (Tab 1 Baseline Identity -> Tab N Detailed Stages)          |
|  - Embedded In-Page Relational Master Data Configuration Console                                  |
+---------------------------------------------------------------------------------------------------+
|                              DATABASE & PERSISTENCE FOUNDATION                                    |
|  - 45 Migrations (0000-0043) | Native PostgreSQL Schema | Row-Level Security | Discord RBAC & Audit  |
+---------------------------------------------------------------------------------------------------+
```

### 🌟 Key Capabilities
* **Next.js 16 + React 19 Full-Stack Architecture**: Server-side rendering, dynamic API route handlers, and static optimization powered by Turbopack.
* **6 Core Production Modules + Universal Ingestion**: Ongoing Capital Works & Major Projects, Defect Liability Period (DLP) & 2D Spatial Geometry, Master Highways Catalog & Interactive Straight-Line Diagram (SLD), Legal Litigation & Court Proceedings, Legal Fee Bills & Voucher Management, Departmental Staff Directory, and Universal Ingestion.
* **TOTP Two-Factor Authentication (RFC 6238 Standard)**: Seamless 10-digit mobile login with QR code onboarding, time-drift tolerance ($\pm 1$ step), and encrypted `nh_session` HTTP-only session cookies.
* **Discord-Style Hierarchical RBAC**: Visual Role Studio with integer position stacking, anti-escalation security invariants ($P_{\text{target}} < P_{\text{actor}}$), and strict permission grant containment ($\text{Perms} \subseteq \text{ActorPerms}$).
* **Symmetric PBAC Jurisdiction Scoping**: Atomic `jurisdiction:view_statewide` (read data-siloing) and `jurisdiction:edit_statewide` (write protection) enforcing division-level governance without code duplication.
* **Immutable Google-Sheets-Style Audit Trail**: Tamper-proof non-repudiation ledger (`public.audit_logs`) tracking 100% of mutations with Red $\rightarrow$ Green field-level diffs, point-in-time snapshots, and Excel export at `/admin/audit`.
* **2D Continuous Spatial Asset Geometry**: Micro-lane spatial offsets measured continuously from Road Centerline ($0.00\text{m}$), strictly mapping 1:1 to dedicated relational PostgreSQL columns.
* **Stage-Gated Progressive Form Validation**: Multi-stage entry lifecycle across all forms where Tab 1 is the baseline required to save initial drafts, Tab $N+1$ is strictly gated until Tab $N$ validations pass, and saving from Tab $N$ validates only up to Tab $N$.
* **Zero Workarounds & Real Relational Schema Integrity**: Zero JSON/JSONB packing of structured relational fields; 100% strongly-typed native PostgreSQL columns across all tables.
* **Unified Server-Side ExcelJS Export Engine**: Departmental peach-cream header styling (`#FFF9CB9C`), Arial Narrow typography, solid black borders, and Landscape A4 single-page width print layout (`fitToWidth: 1`) with symmetrical 0-row import templates.
* **VS Code Minimalist Design Language**: Standardized 2px border radius (`rounded-xs`, `--radius: 2px`), Charcoal & Zinc dark mode (`#181a1f`), high-contrast light mode, standardized 3×2 action toolbar grids, and dual-mode `DD/MM/YYYY` DatePicker inputs.
* **Master Data Management**: In-page configuration consoles across all modules supporting relational Circle $\rightarrow$ Division parent-child cascades.
* **Non-Destructive Soft-Delete Archiving**: Global soft-delete pattern (`delete_status = 'ACTIVE' | 'DELETED'`) with 1-click restore functionality across all tables.

---

## 🚀 The 6 Production Modules

### 1. Ongoing Works & Major Projects (`/ongoing-works` / `/major-projects`)
Comprehensive capital project monitoring, physical & financial progress tracking, contract milestones, statutory clearances, and executive reviews.

* **35-Column MIS & 43-Field Technical Coverage**:
  * **Sanction & Identity**: Sl. No., Circle, Division, Annual Plan (FY) / Scheme, Name of Project, PMIS / OCMS / PMG ID, Old/New NH No., Job / AS No., Length (Km), Sanction Date.
  * **Contract Milestones & Award**: Contractor Name, DE Name & Phone, Sanctioned TPC (₹ Cr), Contract Value (₹ Cr), Date of LOA, Date of Agreement, Date of Site Handover, Appointed Date / Date of Start.
  * **Physical Civil Execution**: Completed Length Prior FY (Km), Completed Length Current FY (Km), Total Completed Length (Km), Cumulative Physical Progress % (0–100%), Work Stage (`IN_PROGRESS`, `TENDER_STAGE`, `COMPLETED`).
  * **Financial Expenditure & RCE**: Revised Cost / RCE (₹ Cr), Cost Increase in RCE (₹ Cr), Prior FY Expenditure (₹ Cr), Current FY Expenditure (₹ Cr), Cumulative Financial Expenditure against TPC (₹ Cr), Contract Cumulative Expenditure (₹ Cr).
  * **Timelines, Delays & Overruns**: Scheduled Completion Date, Likely / Actual Completion Date, Probable Completion Date, Dynamic Time Overrun (Years, Months & Days), EOT Granted Till Date, EOT Proposal Review Agency, Change of Scope (COS) Details.
  * **Statutory Clearances (5 Isolated Fields)**: Land Acquisition (LA / Section 3D / 3G), Forest & Environment Clearances (MoEF / Wildlife), Utility Shifting (TNEB, TWAD, OFC, Gas), Railways (ROB / RUB / GAD approvals), Other Statutory Encumbrances.
  * **Field Logs & Remarks**: Column 27 Detailed Technical Status Log (`detailed_stage_status`), Monthly Progress Remarks, Stage / Tender Remarks, Updated Division Date.
* **6-Stage Progressive Entry Form (`OngoingWorkEntryForm.tsx`)**:
  * `Stage 1: Sanction & Scope` $\rightarrow$ `Stage 2: Award & Contract` $\rightarrow$ `Stage 3: Physical & Financial Progress` $\rightarrow$ `Stage 4: Overruns & EOT` $\rightarrow$ `Stage 5: Statutory Clearances` $\rightarrow$ `Stage 6: Col 27 Field Log`.
  * Live auto-summing math for physical lengths ($\text{Total} = \text{Prior} + \text{Current}$) and financial expenditures ($\text{Cumulative} = \text{Prior} + \text{Current}$).
  * Monotonic physical progress integrity (prevents progress decreases for active works).
  * Write-once freeze-when-filled protections on baseline identification columns.
* **Single-Page Executive Passport (`ViewMajorProjectModal.tsx`)**:
  * Continuous technical dossier with formatted progress indicators, milestone cards, clearance matrices, and a one-click **"Copy Log"** button for Column 27 field notes.
* **Historical Audit Snapshot Engine (`ProjectHistoryModal.tsx`)**:
  * Automated snapshot creation on every insert, edit, or Excel bulk ingestion (`major_projects_snapshots`).
  * Interactive SVG **Milestone Staircase Step Chart** plotting physical progress % (Emerald) vs financial progress % (Blue) across historical dates with delta calculations.
* **Executive KPI Summary & 2-Tier Filter Panel (`MajorProjectsDashboard.tsx`)**:
  * 6 Mutually Exclusive KPI Filter Cards: Active Works, Capital Outlay Budget, Under Active Execution, Tender & Pre-Construction, Delayed Works, Completed Works.
  * Tier 1: Debounced text search + Cascading Circle $\rightarrow$ Division selectors.
  * Tier 2: Live Dynamic Delay Range (Years), Physical Progress Range (0–100%), Financial Progress Range (0–100%), and Mega Projects Toggle (`⚡ ≥ ₹50 Cr`).
* **Dynamic Master Data Console (`OngoingWorksMasterDataModal.tsx`)**:
  * Manages Circles, Divisions (with Parent Circle linking), and Schemes in `public.ongoing_works_master_config`.

---

### 2. Defect Liability Period (DLP) & 2D Spatial Geometry Tracker (`/dlp`)
Comprehensive road maintenance and warranty lifecycle management covering the canonical 24-to-29 column departmental spreadsheet standard (`798 NH Length Summary`).

* **Relational 1-Record-Per-Stretch Standard (Rows 7–12 Pattern)**:
  * Corridors are stored as parent entities (`public.dlp_corridors`), with individual maintenance segments stored as 1st-class relational children (`public.dlp_work_stretches`) with foreign key cascading deletes.
* **2D Continuous Spatial Coordinates**:
  * **Longitudinal (X-Axis)**: Chainage `From (Km)` $\rightarrow$ `To (Km)` ($\text{Length} = |\text{To} - \text{From}|$).
  * **Lateral / Cross-Sectional (Y-Axis)**: Symmetrical meters measured continuously from **Centerline ($0.00\text{m}$)** (e.g., $0.00\text{m} \rightarrow 3.50\text{m}$ for 2L, $0.00\text{m} \rightarrow 7.00\text{m}$ for 4L).
* **5 Core Work Categories & Lifecycle Transitions**:
  * `Under DLP`: Active warranty with Contractor, Work Name, Commencement Date, and DLP Till Date.
  * `Under Construction`: Active capital works with Physical Progress %, Actual Completion Date, and DLP Period (Years). Automatically graduates to `Under DLP` upon 100% completion.
  * `Under STMC`: Short Term Maintenance Contracts (1-Year surface renewal).
  * `Under PBMC`: Performance Based Maintenance Contracts (5-Year comprehensive asset management).
  * `Under NO DLP`: Maintenance gaps and annual routine repair stretches. Automatically receives expired DLP/STMC/PBMC works.
* **Level 2 Micro-Lane Intelligence & Auto-Split Engine**:
  * Live integration with `highway_sub_chainages` (`type=MICRO_LANE`).
  * **Road Width Capacity Validation**: Cross-checks entered lateral width against underlying micro-lane carriageway widths, blocking saves and raising inline bottleneck alerts if offsets exceed physical road capacity.
  * **Multi-Lane Auto-Split**: For works spanning multiple varying lane sections (e.g. 4L+PS narrowing to 2L+PS), clicking **`⚡ Auto-Split into Matching Lane Sections`** instantly divides the entry into discrete sub-stretch rows with matching Level 2 widths.
* **Automated NO DLP Corridor Gap Calculation**:
  $$\text{NO DLP Gap (Km)} = \max\left(0, \text{Total Corridor Length} - \sum(\text{Active Works: DLP, Construction, STMC, PBMC})\right)$$
  Provides instant visibility into uncontracted maintenance gaps without requiring manual empty filler entries.
* **Duplicate Corridor Prevention**:
  * UI dropdown filters out registered corridors; backend API enforces uniqueness on `(highway_code, division_name)` with `HTTP 409 Conflict`.
* **Structured 3-Tier Grouping Hierarchy**:
  $$\mathbf{Tier\ 1:\ Contractor\ Name} \longrightarrow \mathbf{Tier\ 2:\ Work\ Package} \longrightarrow \mathbf{Tier\ 3:\ Discrete\ 2D\ Stretches}$$
* **Default Collapsed Row State**:
  * Corridor rows default to collapsed executive summary bars with 1-click expand/collapse all for streamlined scanning.
* **Departmental 29-Column 2-Tier Peach-Cream Excel Export**:
  * Official `798 NH Length Summary` format with 2-tier merged headers, `#FFF9CB9C` peach fill, Arial Narrow typography, solid black grid borders, and Landscape A4 print fit.
* **Dynamic Master Data Portal (`DlpMasterDataModal.tsx`)**:
  * Manages Circles, Divisions (with Parent Circle linking), and Schemes in `public.dlp_master_config`.

---

### 3. Master Highways Catalog & Interactive Straight-Line Diagram (SLD) (`/highways` & `/highways/[id]/sld`)
The ground-truth linear referencing system for all National Highway corridors across Tamil Nadu.

* **Level 1 Master Corridor Inventory (`/highways`)**:
  * Old/New NH designations, termini locations, chainage limits, total length, and 5-tier multi-lane distance distribution (`<2L`, `2L`, `2L+PS`, `4L`, `6L`).
  * **Quadrant KPI Matrix (`KpiHeaderCards.tsx`)**: 4 summary cards with interactive lane filter isolation (clicking `<2L`, `2L`, `2L+PS`, `4L`, or `6L` isolates matching corridors in the table/grid).
  * **4-Stage Progressive Gated Form (`HighwayEntryForm.tsx`)**: Gated entry with real-time **Lane Checksum Validator** ($\Delta = |\sum L_{\text{lanes}} - L_{\text{target}}| < 0.05\text{ km}$) and WGS84 GPS georeferencing.
* **Level 2 Sub-Chainages Dual-Sheet Breakdown (`ViewHighwayModal.tsx`)**:
  * **Macro Traffic Census (Sheet "PCU")**: Executive stretches, actual Passenger Car Unit traffic counts, and DPR widening proposals with color-coded congestion tiers ($<5\text{k}$ Green, $5\text{k}-15\text{k}$ Amber, $>15\text{k}$ Red).
  * **Micro Lane Geometry (Sheet "NH")**: Granular consecutive stretches, important towns, Right of Way (ROW) dimensions, and carriageway widths.
  * Inline and modal sub-stretch CRUD with soft-delete archiving and instant restore.
* **Level 3 Interactive Straight-Line Diagram (SLD) (`/highways/[id]/sld`)**:
  * **Distance-Proportional Physical Canvas Scaling**: Bar widths expand proportionally to physical distance (`length_km`) based on zoom density ($\text{px/km}$).
  * **150px Minimum Width Floor Protection**: Guarantees chainage labels, town markers, and length badges remain completely legible without subpixel overlap.
  * **7 Interactive Matrix Layers**:
    1. *Towns & Landmarks*: Municipalities, river bridges, and ROB markers.
    2. *Chainage Splits Ruler*: Boundary flags (`Km X → Km Y`) and span badges.
    3. *Centerline-Aligned Road Corridor*: Symmetrical carriageway expansion locked to horizontal centerline axis ($Y = 170\text{px}$).
    4. *Carriageway Technical Specs*: Width indicators (`20m`, `14m`, `10m`, `7m`, `<7m`).
    5. *Traffic PCU Volume*: Passenger Car Unit densities with traffic volume badges.
    6. *Right of Way (ROW)*: Gazetted land corridor boundary widths.
    7. *Sanctioned DPR Proposals*: Widening proposals, consultant schemes, and ministry sanctions.
  * **Left Fixed Sidebar Caliper Docking Gauge**: Mathematically locked caliper brackets matching exact carriageway lateral heights ($1\text{m} = 10\text{px}$: $6\text{L} \rightarrow 200\text{px}$, $4\text{L} \rightarrow 140\text{px}$, $2\text{L+PS} \rightarrow 100\text{px}$, $2\text{L} \rightarrow 70\text{px}$, $<2\text{L} \rightarrow 38\text{px}$).
  * **2D DLP Geometric Overlay Matrix**: Color-coded continuous boundary boxes rendered directly on the road corridor (central carriageway band for $w_{\text{from}} = 0\text{m}$ vs dual symmetrical LHS/RHS widening strips for $w_{\text{from}} > 0\text{m}$).
  * **Bidirectional Chainage Inversion**: 1-click toggle between Normal ($0 \rightarrow \text{End}$) and Reverse ($\text{End} \rightarrow 0$) orientation.
  * **High-DPI Landscape Print Engine**: Dynamic CSS print scaling factor (`--sld-print-scale`) fitting wide linear diagrams onto standard A4/A3 landscape PDF/print outputs with official letterhead and technical legend.
* **Master Data Portal (`HighwayMasterDataModal.tsx`)**:
  * Manages Circles, Divisions, and Carriageway Configurations in `public.highway_master_config`.

---

### 4. Legal Cases & Court Proceedings Management (`/legal`)
Enterprise judicial litigation tracking, counter affidavit management, compliance monitoring, and appellate tracking.

* **48 Strongly-Typed Relational Fields**:
  * Complete normalization across 13 migrations; zero JSON packing.
  * Unified case particulars text format (e.g., `WP (MD) No. 12345/2024`, `WA 567/2024`).
* **Dual Progressive Lifecycle Workflows**:
  * **Normal Cases (5 Stages)**:
    1. *Case Registry & Scope*: Circle, Division, Court, Case Details, Parties, Pertains To (`GOTN`/`MoRTH`/`Both`/`NHAI`), Nature of Case, Brief of Prayer.
    2. *Counter Affidavit (CA)*: CA Required, Due Date, Filed Status, Filed Date, Live Filing Overrun Calculation, Financial Implication (₹).
    3. *Hearing Schedule & Status*: Present Stage, Current Status, Last Hearing Date, Next Hearing Date, Next Listing Purpose.
    4. *Interim Orders & Compliance*: Interim Directions, Interim Order Date, Compliance Required, Compliance Action, Compliance Period, Compliance End Date (CED), Actual Completion Date, Compliance Status.
    5. *Disposal & Appeal Track*: Final Result Order, Final Order Date, Adverse Finding, GP Opinion, Appeal Filed Status, Appeal Filed Date, Linked Appeal Docket.
  * **Appeal Cases (6 Stages)**:
    1. *Appeal Case Registry*: Appellate Court, Appeal Case Details, Appeal Filing Date, Limitation Due Date, Live Limitation Overrun Days, Section 5 Condonation of Delay selector.
    2. *Dedicated Stage 2 Base / Original Case Integration*: 1-click auto-fill dropdown querying existing lower dockets to populate all 11 lower-court particulars (`base_circle`, `base_division`, `base_court_name`, `base_case_details`, `base_petitioner_names`, `base_respondent_names`, `base_case_pertains_to`, `base_nature_of_case`, `base_brief_of_prayer`, `base_final_order`, `base_final_order_date`, `linked_base_case_id`).
    3. *Stage 3: Counter Affidavit (CA)*
    4. *Stage 4: Hearing Schedule & Status*
    5. *Stage 5: Interim Orders & Compliance*
    6. *Stage 6: Disposal & Higher Appeal*
* **Live Delay & Compliance Engines**:
  * **Limitation Overrun**: $\Delta = \text{appealFilingDate} - \text{limitationDueDate}$. Triggers mandatory Condonation of Delay selector if delayed.
  * **Counter Affidavit Overrun**: $\Delta = \text{caFiledDate} - \text{caDueDate}$.
  * **Compliance End Date (CED) Live Overdue Badge**: $\Delta = \text{Today} - \text{complianceEndDate}$. Displays prominent alert badge (`⚠️ Overdue by X days (CED DD/MM/YYYY has elapsed)`) and restricts status selection to `'Completed'` or `'Overdue'`.
  * **Compliance Completion Delay**: Computes delay days when `complianceCompletionDate > complianceEndDate`.
* **Dynamic Court 'Others' Auto-Save**:
  * Selecting `'Others'` in Court Name or Nature of Case reveals a custom input field that seamlessly saves the new option directly into `public.legal_master_config`.
* **1-Click Appeal Case Generator (`<Sparkles />`)**:
  * Instantly spawns a new pre-populated Appeal Case docket from an existing adverse judgment.
* **Dynamic Master Data Console (`LegalMasterDataModal.tsx`)**:
  * Manages 19 configurable master categories in `public.legal_master_config` with bidirectional Court $\leftrightarrow$ Appellate Court synchronization and Circle $\rightarrow$ Division parent linking.

---

### 5. Legal & Lawyer Fee Bills & Voucher Management (`/fee-bills`)
Advocate fee auditing, invoice processing, decoupled assistant lawyer accounting, and inter-office payment pendency tracking.

* **5-Stage Progressive Voucher Lifecycle Entry (`FeeBillDataEntryForm.tsx`)**:
  * `Stage 1: Voucher & Office Jurisdiction`: Fee Bill Number (strict duplicate blocking), Fee Bill Date ($\le \text{Today}$), Receipt Date in Office ($\ge \text{Fee Bill Date}$), Circle, Division.
  * `Stage 2: Law Officer & Court Case Particulars`: Lawyer Name, Lawyer Designation, Case Pertains To (`GOTN`/`MoRTH`/`BOTH`), Case Number / Year (`caseDetails`), Assistant Law Officer toggle & particulars.
  * `Stage 3: Itemized Fee Breakdown & Auto-Calculator`: Appearance Fee, Conference Fee, Drafting / Vetting Fee, Assistance Fee (auto-computed), Total Fee Claim.
  * `Stage 4: Government Order (G.O.) Sanction Workflow`: G.O. Requirement, G.O. Pipeline Stage, G.O. Number & Date, G.O. Reference Letter Number & Date.
  * `Stage 5: Payment Proposal & Settlement Disbursement`: Payment Status (`Pending` vs `Settled`), Payment Proposal Stage (CE Proceeding, MoRTH Approval, etc.), Proceeding Letter No/Date, Sanctioned Amount, Decoupled Lead Lawyer & Assistant Lawyer Settlement Records, Processing Remarks.
* **Mathematical Formulas & Decoupled Accounting (`src/lib/feeBillMasterData.ts`)**:
  1. **Assistance Fee Auto-Calculation (1/3 of Appearance Fee Only)**:
     $$\text{Assistance Fee} = \operatorname{round}\left(\frac{\max(0, \text{Appearance Fee})}{3}, 2\right)$$
     *(Conference and Drafting/Vetting fees are strictly excluded from the 1/3 assistant calculation).*
  2. **Total Fee Claim**:
     $$\text{Total Fee} = \text{Appearance Fee} + \text{Conference Fee} + \text{Drafting Fee} + \text{Assistance Fee}$$
  3. **Decoupled Net Disbursements**:
     $$\text{Lawyer Net Disbursed} = \max(0, \text{Settled Amount} - \text{IT TDS Cess})$$
     $$\text{Assistant Net Disbursed} = \max(0, \text{Assistant Settled Amount} - \text{Assistant IT TDS Cess})$$
  4. Both counsel disbursements maintain independent banking UTR numbers, payment dates, and payment statuses.
* **Dual-Track Pendency Engine (`FeeBillPendencyTracker.tsx`)**:
  * **Payment Proposal Pipeline**: Tracks unsettled vouchers across administrative sanction stages (`Pending with DE`, `Proposal Sent to SE`, `Proposal Submitted to CE`, `Proceeding Issued by CE`, `Approval Accorded by MoRTH`, `Payment Sanctioned`).
  * **Government Order Pipeline**: Isolates vouchers requiring G.O. clearance and tracks stages (`Proposal Under Process`, `Submitted to Government`, `Clarification Sought`, `G.O. Obtained`).
* **Multi-Dimensional Analytics Dashboard & Pivot Matrix (`FeeBillAnalysisDashboard.tsx`)**:
  * Cross-tabulation pivot matrix with selectable Row Dimensions (Advocate, Case Particulars, Circle, Division, Pendency Stage) and Column Dimensions (Payment Status, Circle, Division, G.O. Requirement).
  * Value metrics: Total Claim Amount (₹), Settled Amount (₹), Outstanding Balance (₹), Voucher Count (#), Average Claim per Voucher (₹).
  * Interactive heatmap color scaling + **Interactive Drill-Down Drawer** displaying underlying records upon clicking any cell or total.
* **Auditing, Inspection & Letterhead Printing (`FeeBillDetailModal.tsx`, `FeeBillAuditModal.tsx`)**:
  * Dedicated printable physical fee voucher letterhead.
  * Quick Audit modal for updating sanction stages, UTR numbers, and disbursals.
* **Dynamic Master Data Management (`MasterDataManagement.tsx`)**:
  * Manages 11 normalized master categories in `public.fee_bill_master_items`.

---

### 6. Departmental Staff Directory (`/staff`)
Human resource directory and field personnel posting hierarchy.

* **6-Tier Administrative Posting Hierarchy**:
  $$\text{Office} \longrightarrow \text{Circle} \longrightarrow \text{Division} \longrightarrow \text{Sub-Division} \longrightarrow \text{Section} \longrightarrow \text{Sub-Section}$$
  with orthogonal **Designation** cadres.
* **Cascading Selectors with Auto-Reset Triggers**:
  * Changing `Circle` automatically clears and filters downstream `Division`, `Sub-Division`, `Section`, and `Sub-Section` options.
* **Progressive Form & Soft-Delete Archiving (`StaffEntryForm.tsx`)**:
  * Stage 1 (Personnel Identity & Contact Details) $\rightarrow$ Stage 2 (Organizational Posting).
  * Non-destructive soft-deletion (`delete_status = 'DELETED'`) with 1-click restore action.
* **Dynamic Master Data Console (`StaffMasterDataModal.tsx`)**:
  * Manages hierarchical posting units in `public.staff_master_config` with bidirectional two-way update synchronization (renaming a Division automatically cascades updates to all affected staff rows and child sub-divisions).

---

### 7. Universal Excel & CSV Ingestion Engine (`/ingest`)
Automated data parsing pipeline designed to ingest legacy government spreadsheets.

* **Multi-Format Processing**:
  * XLSX / XLS buffer parsing via SheetJS (`xlsx`) with smart sheet detection (`Summary`, `PCU`, `NH`, etc.).
  * CSV streaming via `PapaParse`.
  * Supports 7 dataset categories: `HIGHWAYS_MASTER`, `HIGHWAY_SUB_CHAINAGES`, `DLP_CONTRACTS`, `HIGHWAY_MILESTONES`, `ACCIDENT_BLACKSPOTS`, `LEGAL_CASES`, `ONGOING_WORKS`.
* **Merged Cell Resolution (`!merges`)**: Accurately extracts values spanning merged header and data cells.
* **Date Normalization Engine (`parseIndianDate`)**:
  * Converts Excel numeric serial dates (e.g. `44531` $\rightarrow$ `01/12/2021`).
  * Parses Indian slashed and dotted date strings (`DD.MM.YYYY`, `DD-MM-YYYY`, `DD/MM/YYYY`).
  * Normalizes 2-digit shorthand years (`24.05.27` $\rightarrow$ `2027-05-24`).
  * Normalizes Month-Year notation (`05.2027` $\rightarrow$ `2027-05-31`).
  * Clamps invalid calendar days (e.g. `31/02/2025` $\rightarrow$ `28/02/2025`).
* **Chainage Slash-Notation Normalizer (`parseChainageValue`)**:
  * Converts railway/highway slash formats (e.g., `63/2`, `110/2`, `60/600` $\rightarrow$ `63.200`, `110.200`, `60.600`).
  * Fixes thousand-separator comma typos (`103,467` $\rightarrow$ `103.467`).
* **Multi-Division Regex Detection**: Identifies division jurisdiction from multi-line text strings across 14 territorial divisions.
* **Chunked Ingestion & Snapshot Audit**: Inserts records in 250-row chunks to prevent connection saturation, automatically recording snapshot audit logs in `major_projects_snapshots`.

---

## 🛡️ Identity, Discord-Style RBAC, PBAC Jurisdiction & Immutable Audit Architecture

The platform incorporates a carrier-grade enterprise security and governance foundation built on **RFC 6238 TOTP Two-Factor Authentication**, **Discord-Style Hierarchical Role-Based Access Control (RBAC)**, **Policy-Based Access Control (PBAC) Jurisdiction Scoping**, and an **Immutable Google-Sheets-Style Audit Trail**.

> 📖 **Full Specification**: For detailed schema designs, invariants, and implementation matrices, refer to [`AUTH_RBAC_AND_AUDIT_SPEC.md`](AUTH_RBAC_AND_AUDIT_SPEC.md).

```
+---------------------------------------------------------------------------------------------------+
|                                  SECURITY & GOVERNANCE FLOW                                       |
+---------------------------------------------------------------------------------------------------+
|  1. Phone Identity (10-Digit) -> 2. RFC 6238 TOTP (SHA-256) -> 3. nh_session (Encrypted Cookie)    |
|  4. Discord Position Stack (100 -> 0) -> 5. PBAC Jurisdiction Scope -> 6. Tamper-Proof Audit Log  |
+---------------------------------------------------------------------------------------------------+
```

### 1. Two-Factor Authentication (TOTP MFA)
* **Mobile-First Passwordless Onboarding**: Officers enter their 10-digit phone number registered in the Department Staff Directory (`staff_members`).
* **RFC 6238 TOTP Standard (`otpauth`)**: Pure TypeScript implementation supporting Google Authenticator, Microsoft Authenticator, and 2FAS with $\pm 1$ time-step clock-drift tolerance.
* **Encrypted HTTP-Only Session (`nh_session`)**: 8-hour encrypted token containing officer metadata, jurisdiction scope, and active permission codes.

### 2. Discord-Style Hierarchical Role Matrix (`RoleStudioModal.tsx`)
* **Integer Position Hierarchy**:
  $$\text{Super Admin (100)} > \text{Chief Engineer (80)} > \text{Superintending Engineer (60)} > \text{Divisional Engineer (40)} > \text{Viewer (0)}$$
* **Target Position Invariant**: Administrators can only create, edit, delete, or assign roles positioned strictly below their own rank ($P_{\text{target}} < P_{\text{actor}}$).
* **Anti-Escalation Containment**: Officers cannot grant permission codes they do not personally possess ($\text{GrantedPerms} \subseteq \text{ActorPerms}$).
* **Decoupled Designation vs. Role**: Real-world job posts (SE, DE, AE) remain decoupled from platform permissions, preventing artificial UI fallbacks.

### 3. Symmetric PBAC Jurisdiction Engine (`src/lib/auth/permissions.ts`)
* **`jurisdiction:view_statewide`**: When unchecked, the server blind-silos read queries (`GET`) strictly to the officer's assigned division or circle (`LOWER(division) = LOWER(:userDivision)`).
* **`jurisdiction:edit_statewide`**: When unchecked, write actions (`POST`, `PUT`, `PATCH`, `DELETE`) targeting records outside the officer's assigned division are rejected with `403 Forbidden`.

### 4. Immutable Google-Sheets-Style Audit Trail (`/admin/audit`)
* **Tamper-Proof Ledger (`public.audit_logs`)**: Automatically records every creation, modification, soft-deletion, restoration, lockdown toggle, and role promotion across all 8 modules.
* **Granular Red $\rightarrow$ Green Field-Level Diffs**: Computes exact before/after diffs highlighting altered fields with Red (`-`) and Green (`+`) badges.
* **Statewide Audit Console & Excel Export**: Real-time multi-filter log viewer with 1-click styled `.xlsx` audit report generation.
* **Emergency Master Lockdown (`/api/admin/lockdown`)**: Super-Admin trigger to immediately suspend all platform mutations statewide during emergency audits or maintenance.

---

## 🧮 Core Mathematical & Business Logic Formulas

### 1. Dynamic Project Delay Gap Engine (Time Overrun)
$$\Delta t = \text{Current Date} - \text{Scheduled Completion Date}$$
* If $\text{Scheduled Date}$ is missing, $\Delta t \le 0$, or $\text{Physical Progress} = 100\%$:
  $$\text{Delay} = 0 \text{ Years} \quad (\text{"On Schedule"})$$
* If $\Delta t > 0$ and $\text{Physical Progress} < 100\%$:
  $$\text{diffDays} = \lfloor \Delta t_{\text{ms}} / 86,400,000 \rfloor, \quad \text{delayYears} = \text{round}\left(\frac{\text{diffDays}}{365.25}, 2\right)$$
  $$\text{years} = \lfloor \text{diffDays} / 365.25 \rfloor, \quad \text{months} = \lfloor (\text{diffDays} \bmod 365.25) / 30.4375 \rfloor$$
  $$\text{Output} = \text{"X Years \& Y Months (Z.ZZ Yrs)"}$$

### 2. Financial Progress % (TPC & Contract Value Utilization)
$$\text{Effective Project Cost} = \max(\text{Revised Cost (RCE)}, \text{Sanctioned TPC})$$
$$\text{Financial Progress (\%)} = \min\left(100, \text{round}\left(\frac{\text{Cumulative Financial Expenditure}}{\text{Effective Project Cost}} \times 100, 1\right)\right)$$
$$\text{Contract Expenditure (\%)} = \min\left(100, \text{round}\left(\frac{\text{Contract Cumulative Expenditure}}{\text{Contract Value}} \times 100, 1\right)\right)$$

### 3. Symmetrical 2D Cross-Sectional Geometry from Centerline ($0.00\text{m}$)
$$\text{centerlineWidth} = \frac{\text{carriagewayWidth}}{2}$$
$$\text{offsetPx}(m) = m \times 6\text{px} \quad (\text{DLP Portal}) \quad \Big| \quad m \times 10\text{px} \quad (\text{SLD Portal})$$
$$\text{heightPx}_{\text{center}} = 2 \times w_{\text{to}} \times \text{pxPerMeter}$$
$$\text{heightPx}_{\text{strip}} = (w_{\text{to}} - w_{\text{from}}) \times \text{pxPerMeter}$$

### 4. Legal Compliance Overdue & Limitation Delays
$$\Delta_{\text{appeal}} = \lceil (\text{appealFilingDate} - \text{limitationDueDate}) / 86,400,000 \rceil$$
$$\Delta_{\text{CED}} = \lceil (\text{Today} - \text{complianceEndDate}) / 86,400,000 \rceil \quad (\text{if } \text{Today} > \text{complianceEndDate})$$
$$\Delta_{\text{completion}} = \lceil (\text{complianceCompletionDate} - \text{complianceEndDate}) / 86,400,000 \rceil$$

---

## 🎨 UI/UX Design System: Engineering-Grade VS Code Standard

* **Theme Engine**:
  * **Dark Mode**: Neutral Charcoal `#181a1f`, Zinc Panels `#25282f`, Dark Canvas `#101216`, Signature Blue Accent `#007acc`, Dark Slate `#383c44`.
  * **Light Mode**: Pure White `#ffffff`, Neutral Canvas `#f4f4f5`, Slate Borders `#e4e4e7`, Dark Slate Text `#181a1f`.
* **Sharp 2px Corners**: Universal `--radius: 2px` (`rounded-xs`) across all cards, modals, buttons, table rows, and badges.
* **Standardized 3×2 Action Toolbar Grid (`ModulePageHeader.tsx`)**:
  * `Refresh` (Spinning Icon) | `Master Config` (Sliders Icon) | `Add New` (Blue Accent)
  * `Archive Toggle` (Amber/Slate) | `Import Data` (Indigo Accent) | `Export Data` (Emerald Accent)
* **Dual-Mode DatePickerInput**: Strict Indian `DD/MM/YYYY` date format with 8-digit auto-masking, calendar picker popup, and leap year validation.
* **Print & Export Typography**: Official departmental peach-cream header styling (`#FFF9CB9C`), Arial Narrow typography, solid black grid borders, and Landscape A4 fit-to-width print layout.

---

## 📂 Project Structure

```
nh_proj/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dlp/                     # DLP master CRUD & spatial sub-stretches API
│   │   │   │   └── master-data/         # DLP dynamic master data API
│   │   │   ├── export/                  # Universal server-side ExcelJS & CSV export API
│   │   │   ├── fee-bills/               # Legal fee bills API
│   │   │   │   └── master-data/         # Fee bills master items API
│   │   │   ├── highways/                # Corridors catalog API
│   │   │   │   └── master-data/         # Highways master data API
│   │   │   ├── ingest/                  # Universal Excel/CSV ingestion API
│   │   │   ├── legal/                   # Legal cases litigation API
│   │   │   │   └── master-data/         # Legal master config API
│   │   │   ├── major-projects/          # Ongoing works API & route handler
│   │   │   │   ├── master-data/         # Ongoing works master config API
│   │   │   │   └── snapshots/           # Historical audit timeline snapshots API
│   │   │   ├── ongoing-works/           # Ongoing works route handler
│   │   │   │   └── master-data/         # Ongoing works master data route alias
│   │   │   ├── staff/                   # Department staff directory API
│   │   │   │   └── master-data/         # Staff hierarchy master data API
│   │   │   └── sub-chainages/           # Linear asset sub-chainages API
│   │   ├── dlp/page.tsx                 # DLP warranties & 2D spatial dashboard
│   │   ├── fee-bills/page.tsx           # Fee bills audit & pendency dashboard
│   │   ├── highways/page.tsx            # Highways master catalog dashboard
│   │   ├── highways/[id]/sld/page.tsx   # Interactive Straight-Line Diagram (SLD)
│   │   ├── ingest/page.tsx              # Universal bulk ingestion portal
│   │   ├── legal/page.tsx               # Judicial cases & litigation portal
│   │   ├── major-projects/page.tsx      # Redirect alias to /ongoing-works
│   │   ├── ongoing-works/page.tsx       # Ongoing capital works master portal
│   │   ├── staff/page.tsx               # Staff management dashboard
│   │   ├── globals.css                  # Global styles & VS Code design tokens
│   │   ├── layout.tsx                   # Root layout with NavigationHeader
│   │   └── page.tsx                     # Landing / redirect route
│   ├── components/
│   │   ├── common/                      # Reusable DatePickerInput, SearchableSelect, ExportDataModal, ModulePageHeader
│   │   ├── dlp/                         # 2D DLP entry form, view/delete modals, master config
│   │   ├── fee-bills/                   # Fee bill entry form, detail view, audit modal, pivot dashboard, pendency tracker, master config
│   │   ├── highways/                    # Highways grid, table, 4-stage entry form, KPI cards, master config, StraightLineDiagram
│   │   ├── legal/                       # Legal case entry form, detail view, delete modal, dashboard, master config
│   │   ├── major-projects/              # Ongoing works dashboard, table, 6-stage entry form, passport view, project history, master config
│   │   ├── staff/                       # Staff table, 2-stage entry form, detail view, master config
│   │   └── NavigationHeader.tsx         # Sticky navigation header bar
│   └── lib/
│       ├── dlp/                         # DLP Level 2 micro-lane detection, capacity check, auto-split
│       ├── export/                      # Column schemas (columns.ts), serverExcelBuilder.ts, exportGenerator.ts
│       ├── feeBillMasterData.ts         # Fee bill mathematical helpers & pendency derivation
│       ├── formatters.ts                # Dynamic delay & financial progress calculations
│       ├── ingestion/                   # Universal spreadsheet parser & date normalizers
│       ├── legal/                       # Legal master constants & appeal delay calculators
│       ├── staff/                       # Staff cascading hierarchy resolvers
│       └── supabase/                    # Supabase client & server instances
├── supabase/
│   └── migrations/                      # 44 incremental SQL migrations (0000 to 0042)
├── docs/                                # Detailed technical specifications
│   ├── DLP_SPECIFICATION.md             # DLP 2D Spatial Geometry specification
│   ├── EXCEL_EXPORT_IMPORT_STANDARDS.md # Universal spreadsheet export/import specification
│   ├── FEE_BILLS_SPECIFICATION.md       # Fee bills & voucher specification
│   ├── HIERARCHICAL_ACCESS_AND_2FA_SPECIFICATION.md # Access control & 2FA specification
│   ├── LEGAL_CASES_SPECIFICATION.md     # Legal litigation specification
│   └── ONGOING_WORKS_SPECIFICATION.md   # Ongoing capital works 35-column specification
├── README.md                            # Master project documentation
└── package.json                         # Next.js 16, React 19, TailwindCSS v4, ExcelJS
```

---

## 🗄️ Database Migrations Lineage (0000 to 0042)

Located in `supabase/migrations/`:
* `0000_init.sql` $\rightarrow$ Extensions initialization (`uuid-ossp`, `pgcrypto`).
* `0001_initial_schema.sql` $\rightarrow$ Base highways, sections, and PostGIS enablement.
* `0002_excel_ingestion_tables.sql` $\rightarrow$ Ingestion log & staging tables (`dataset_uploads`, `highway_sub_chainages`).
* `0003_fix_rls_update_policies.sql` $\rightarrow$ Row Level Security update policies across initial tables.
* `0004_add_delete_status_column.sql` $\rightarrow$ Soft-delete column for highways.
* `0005_legal_cases_schema.sql` $\rightarrow$ `legal_cases` and `lawyers` baseline schema.
* `0006_dlp_full_excel_fields.sql` $\rightarrow$ Multi-category DLP fields expansion.
* `0007_dlp_sub_contracts.sql` $\rightarrow$ Granular `dlp_sub_contracts` relational table.
* `0008_fix_dlp_rls_policies.sql` $\rightarrow$ RLS policies for DLP sub-contracts.
* `0009_expand_highways_schema.sql` $\rightarrow$ Multi-lane configuration length columns (`<2L`, `2L`, `2L+PS`, `4L`, `6L`).
* `0010_highway_sub_chainages.sql` $\rightarrow$ Sub-chainages with `MICRO_LANE` vs `MACRO_PCU` breakdown types.
* `0011_fee_bills_schema.sql` $\rightarrow$ Baseline `fee_bills` voucher tracking table.
* `0012_fee_bill_master_config.sql` $\rightarrow$ Dynamic fee bill master config key-value table.
* `0013_consolidate_schemas.sql` $\rightarrow$ Schema consolidation, foreign keys, and index optimizations.
* `0014_staff_members_schema.sql` $\rightarrow$ `staff_members` and `staff_master_config` tables.
* `0015_expand_sub_chainages_level3.sql` $\rightarrow$ Added `important_town`, `row_width`, and `carriageway_width` for Level 3 SLD.
* `0016_major_projects_50cr.sql` $\rightarrow$ Baseline `major_projects_50cr` capital works table.
* `0017_ongoing_works_master_config.sql` $\rightarrow$ Dynamic dropdown configuration for ongoing works.
* `0018_ongoing_works_27_columns.sql` $\rightarrow$ 27-Column MIS expansion for ongoing works.
* `0019_widen_text_columns.sql` $\rightarrow$ Widened string columns to `TEXT` across all tables.
* `0020_add_contract_and_issues_fields_major_projects.sql` $\rightarrow$ Added contract milestones, expenditure columns, and 5 statutory clearance issue fields.
* `0021_major_projects_snapshots_schema.sql` $\rightarrow$ Historical audit timeline snapshots table (`major_projects_snapshots`).
* `0022_fee_bills_branching_and_payment_fields.sql` $\rightarrow$ Assistant law officer fields, G.O. pipeline, and payment sanction fields.
* `0023_legal_cases_workflow_v2.sql` $\rightarrow$ Legal workflow v2 with 6-stage lifecycle, compliance dates, and `legal_master_config`.
* `0024_staff_master_config_hierarchy.sql` $\rightarrow$ Added `parent_category` and `parent_value` to `staff_master_config`.
* `0025_fee_bill_master_items_table.sql` $\rightarrow$ Relational `fee_bill_master_items` table with parent categories.
* `0026_fee_bills_numeric_cases_and_assistant_settlement.sql` $\rightarrow$ Independent Assistant Law Officer settlement and receipt date fields.
* `0027a_fee_bills_go_reference_letter_fields.sql` $\rightarrow$ Added G.O. reference letter tracking columns to `fee_bills`.
* `0027b_legal_cases_relax_category_and_schema_updates.sql` $\rightarrow$ Relaxed category constraint and added court name normalization in `legal_cases`.
* `0028_add_base_original_case_columns.sql` $\rightarrow$ Added 12 lower-court columns to `legal_cases` for appeal proceedings.
* `0029_dlp_rework_schema.sql` $\rightarrow$ Complete 2D spatial rework: `dlp_corridors` and `dlp_work_stretches` relational tables.
* `0030_dlp_master_config.sql` $\rightarrow$ Dynamic DLP master data configuration table.
* `0031_combine_case_details.sql` $\rightarrow$ Introduced unified `case_details` column in `fee_bills` and `legal_cases`.
* `0032_drop_legacy_case_fields_fee_bills.sql` $\rightarrow$ Cleanly dropped legacy case columns from `fee_bills`.
* `0033_drop_legacy_case_fields_legal_cases.sql` $\rightarrow$ Cleanly dropped legacy case columns from `legal_cases`.
* `0034_legal_master_config_parent_value.sql` $\rightarrow$ Added relational parent-child hierarchy to `legal_master_config`.
* `0035_drop_redundant_final_order_compliance_fields_legal_cases.sql` $\rightarrow$ Removed redundant compliance fields from `legal_cases`.
* `0036_normalize_appeal_info_columns_legal_cases.sql` $\rightarrow$ Normalized appeal court and limitation columns in `legal_cases`.
* `0037_add_legal_master_config_categories.sql` $\rightarrow$ Seeded boolean and status master config categories for legal cases.
* `0038_ongoing_works_circle_division_hierarchy.sql` $\rightarrow$ Added `circle` to `major_projects_50cr` and relational hierarchy in `ongoing_works_master_config`.
* `0039_add_base_final_order_columns_legal_cases.sql` $\rightarrow$ Added lower court final order text and date columns to `legal_cases`.
* `0040_add_remarks_column_fee_bills.sql` $\rightarrow$ Added `remarks TEXT` column to `public.fee_bills`.
* `0041_legal_cases_court_and_compliance_enhancements.sql` $\rightarrow$ Added court name custom fields and compliance completion dates.
* `0042_drop_ced_complaint_sent_date.sql` $\rightarrow$ Dropped deprecated complaint date column from `legal_cases`.
* `0043_master_auth_rbac_and_audit.sql` $\rightarrow$ Master Identity, Discord-Style Hierarchical RBAC (`roles`, `permissions`, `role_permissions`, `user_profiles`), 50+ Permissions Catalog, PBAC Jurisdiction Scoping, Emergency Lockdown, and Immutable Google-Sheets Audit Trail (`audit_logs`).

---

## 🛠️ Technology Stack & Dependencies

* **Core Framework**: Next.js 16 (App Router, Turbopack)
* **Frontend**: React 19, TypeScript 5, Tailwind CSS v4, Lucide React Icons
* **Database & Persistence**: Supabase PostgreSQL with PostGIS and Row Level Security (RLS)
* **Spreadsheet Engine**: ExcelJS (`exceljs`), SheetJS (`xlsx`), PapaParse (`papaparse`)
* **Build Verification**: `npm run build` verified (100% routes compiling with 0 TypeScript/ESLint errors).

---

## 📦 Getting Started & Development

### 1. Prerequisites
- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$
- Supabase project with PostgreSQL

### 2. Local Environment Setup
```bash
# Clone the repository
git clone git@github.com:tnhighwaysdep/highways_project.git
cd highways_project

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

Ensure `.env.local` contains valid Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 🤝 Branching & Contribution Guidelines
* **`main`**: Active production branch. All changes must pass `npm run build` with zero TypeScript errors before merging.
* **`mathir`**: Development and feature synchronization branch.
