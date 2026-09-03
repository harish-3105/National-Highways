# Technical Specification & Session Changelog (2026-09-03)

This document provides the complete, ground-truth record of all features, enhancements, and security enforcements implemented in this session for the **Tamil Nadu National Highways Department Management System**.

---

## 📑 Table of Contents
1. [DLP 2D Spatial & Width-Offset Breakdown Engine](#1-dlp-2d-spatial--width-offset-breakdown-engine)
2. [Comprehensive Granular Permissions Catalog (98 Actions)](#2-comprehensive-granular-permissions-catalog-98-actions)
3. [`system:view_archived` Frontend & Backend Enforcement](#3-systemview_archived-frontend--backend-enforcement)
4. [Module Master Data & Restore RBAC Integration](#4-module-master-data--restore-rbac-integration)
5. [Database Migration (`0046_complete_granular_permissions.sql`)](#5-database-migration-0046_complete_granular_permissionssql)
6. [Verification, Type Safety & Automated Test Results](#6-verification-type-safety--automated-test-results)

---

## 1. DLP 2D Spatial & Width-Offset Breakdown Engine

### Overview
In National Highway maintenance, multiple contracts or work types may overlap along the same longitudinal corridor (chainage Km X -> Y) while operating on different lateral carriageway width offsets (e.g. `0m to 5m` for Strengthening vs. `5m to 7m` for STMC Widening).

The 2D spatial breakdown engine decomposes any corridor into its true non-overlapping 2D lateral/longitudinal physical work categories.

### Implementation Files:
* **Engine**: `src/lib/dlp/spatialBreakdown.ts`
* **Dashboard Badges**: `src/app/dlp/page.tsx`
* **Identity Card in Modal**: `src/components/dlp/ViewDlpContractModal.tsx`

### Spatial Classification Logic:
1. **Category Detection**:
   * **`STRENGTHENING`**: Detected if lateral road width is within existing pavement (e.g. `[0, 5.5m]`) or `work_name` contains `"streng"`, `"overlay"`, `"pavement"`, `"resurfac"`, or `"bt"`.
   * **`WIDENING`**: Detected if lateral road width indicates paved shoulder / lane addition (e.g. `> 5.5m`) or `work_name` contains `"widen"`, `"four lane"`, `"two lane"`, `"shoulder"`, `"4-lane"`, or `"2-lane"`.
   * **`FULL`**: All other full-width regular maintenance.
2. **Partial Width vs Full Width Unworked Slices**:
   * If a stretch covers Km 0 -> 10 with Strengthening `[0, 5m]` and Widening `[5, 7m]` on a 7m carriageway:
     * `DLP (Strengthening)`: 10.00 km
     * `STMC (Widening)`: 10.00 km
     * `No DLP`: 0.00 km (Zero gap)
   * If Widening only covers Km 0 -> 5 (5m -> 7m), then for Km 5 -> 10:
     * `DLP (Strengthening)`: 10.00 km
     * `STMC (Widening)`: 5.00 km
     * `No DLP (Widening)`: 5.00 km (Explicit partial-width gap badge)
   * If an entire section Km 10 -> 15 has zero maintenance contracts:
     * `No DLP`: 5.00 km (Full corridor gap badge)

---

## 2. Comprehensive Granular Permissions Catalog (98 Actions)

Every system operation across all 10 modules is explicitly codified into a strongly-typed permission code:

### Complete Matrix of Permissions:

| Module | Permission Code | Label | Description |
| :--- | :--- | :--- | :--- |
| **System & Security** | `system:lockdown_toggle` | Toggle Emergency Lockdown | Freeze system statewide in read-only maintenance mode |
| | `system:audit_view` | View System Audit Logs | Access `/admin/audit` to inspect immutable audit trails |
| | `system:audit_export` | Export Audit Logs | Export system audit logs to Excel or CSV |
| | `system:view_archived` | View Archived Records | Access and toggle soft-deleted / archived records across dashboards |
| | `system:creative_mode` | Admin Creative Mode | Bypass monotonic progression constraints and edit locked history |
| | `system:bypass_validation` | Bypass Validation Rules | Save incomplete drafts without completing required stage fields |
| | `system:hard_delete` | Permanent Database Purge | Permanently delete records from PostgreSQL tables |
| **Jurisdiction** | `jurisdiction:view_statewide` | View Statewide Data | View projects and records outside assigned Circle/Division |
| | `jurisdiction:edit_statewide` | Edit Statewide Data | Create and edit records outside assigned Circle/Division |
| | `jurisdiction:reassign_division` | Reassign Jurisdiction | Reassign an existing contract/project to another Division |
| **Roles & Users** | `roles:view` | View Role Hierarchy | Open Role Studio and inspect permission stacks |
| | `roles:create` | Create Custom Roles | Create new security roles with assigned permission sets |
| | `roles:edit` | Edit Role Permissions | Update role permission matrices and scope defaults |
| | `roles:delete` | Delete Custom Roles | Delete custom roles and safely reassign users to Viewer |
| | `roles:reorder` | Reorder Role Positions | Reorder role integer rank hierarchy via drag-and-drop |
| | `users:view` | View User Accounts | Inspect user accounts, phone numbers, and last active sessions |
| | `users:create` | Provision User Accounts | Create new user logins and dispatch initial OTP setups |
| | `users:edit` | Edit User Profiles | Update user phone numbers, jurisdiction bindings, and roles |
| | `users:delete` | Deactivate User Logins | Suspend user accounts and revoke active sessions |
| | `users:reset_2fa` | Reset TOTP Secrets | Clear and re-issue 2FA authenticator QR setup keys |
| | `users:unlock` | Unlock OTP Lockouts | Clear temporary login lockouts caused by failed OTP verification attempts |
| **Master Data** | `master_data:manage` | Global Master Config | Manage master data options across all modules |
| | `highways:master_data_manage` | Manage Highway Config | Manage Highway Circles, Divisions, and Carriageway configs |
| | `dlp:master_data_manage` | Manage DLP Config | Manage DLP Circles, Divisions, and Maintenance Schemes |
| | `legal:master_data_manage` | Manage Legal Config | Manage Court Names, Case Types, Stages, and GP Opinions |
| | `fee_bills:master_data_manage` | Manage Fee Bills Config | Manage G.O. Stages, Claim Types, and Expense Headings |
| | `works:master_data_manage` | Manage Works Config | Manage Ongoing Works Schemes, Civil Stages, and Delays |
| | `staff:master_data_manage` | Manage Staff Config | Manage Designations, Posting Units, and Department Wings |
| **Ongoing Works** | `works:view` | View Works MIS | View ongoing capital works dashboard and project lists |
| | `works:create` | Create Works Projects | Register new ongoing capital projects |
| | `works:edit_basic` | Edit Basic Project Info | Edit project names, sanctioned costs, and job numbers |
| | `works:edit_progress` | Update Physical/Financial % | Edit monthly progress %, expenditures, and status remarks |
| | `works:edit_clearances` | Manage Clearances | Update Land Acquisition, Forest, and Utility clearance stages |
| | `works:edit_financials` | Manage Financial Milestones | Update letter of credit, expenditure bills, and contractor payments |
| | `works:edit_delays` | Classify Project Delays | Update delay classifications and EOT justifications |
| | `works:override_frozen` | Edit Frozen Baseline Info | Override locked sanctioned costs and original agreement dates |
| | `works:delete` | Soft-Delete Works | Archive or soft-delete ongoing project records |
| | `works:restore` | Restore Archived Works | Restore soft-deleted ongoing projects back to active list |
| | `works:bulk_delete` | Bulk Soft Delete Works | Batch soft-delete multiple selected ongoing capital projects |
| | `works:bulk_restore` | Bulk Restore Works | Batch restore multiple selected ongoing capital projects |
| | `works:export` | Export Works to Excel | Download complete Ongoing Works MIS in styled Excel format |
| | `works:import` | Bulk Excel Ingest (Works) | Bulk import ongoing projects from master Excel workbooks |
| | `works:create_snapshot` | Trigger Monthly Snapshot | Manually freeze and archive a monthly progress snapshot |
| | `works:view_history` | View Historical Milestones | View historical progress snapshots and milestone staircases |
| **Highways Catalog** | `highways:view` | View Highway Network | View master highway corridors and SLD views |
| | `highways:create` | Add Highway Corridors | Register new National Highway road codes |
| | `highways:edit` | Edit Highway Corridors | Update corridor lengths, lane configurations, and start/end locations |
| | `highways:delete` | Soft-Delete Corridors | Soft-delete highway network corridors |
| | `highways:restore` | Restore Corridors | Restore soft-deleted Level 1 highway corridors back to active list |
| | `highways:bulk_delete` | Bulk Delete Corridors | Batch soft-delete multiple selected highway corridors |
| | `highways:bulk_restore` | Bulk Restore Corridors | Batch restore multiple selected highway corridors |
| | `highways:export` | Export Highway Catalog | Export corridor catalog to Excel |
| | `highways:import` | Bulk Excel Import (Highways) | Bulk import Level 1 highway corridors from Excel sheets |
| | `sub_chainages:view` | View Sub-Chainages | View micro-geometry stretches, lane widths, and PCU counts |
| | `sub_chainages:create` | Add Sub-Chainages | Add discrete micro-lane sub-chainage stretches |
| | `sub_chainages:edit` | Edit Sub-Chainages | Update sub-chainage ROW widths, carriageway widths, and towns |
| | `sub_chainages:delete` | Soft-Delete Sub-Chainages | Soft-delete micro-lane stretches |
| | `sub_chainages:restore` | Restore Sub-Chainages | Restore soft-deleted Level 2 sub-chainage geometry stretches |
| | `sub_chainages:import` | Bulk Import (Sub-Chainages) | Bulk import Level 2 sub-chainages from Excel sheets |
| | `sld:view` | View Straight Line Diagrams | Open interactive Straight Line Diagram visualizer |
| | `sld:print_export` | Print / Export SLD | Export high-resolution SLD diagrams to vector PDF/PNG |
| **DLP Maintenance** | `dlp:view` | View DLP Register | View defect liability corridors and 2D spatial chainages |
| | `dlp:create` | Register DLP Packages | Register new DLP maintenance contract packages |
| | `dlp:edit` | Edit DLP Records | Update contractor details, completion dates, and warranty status |
| | `dlp:extend_date` | Grant DLP Time Extensions | Formally extend DLP defect liability expiration dates |
| | `dlp:delete` | Soft-Delete DLP Packages | Soft-delete DLP contract packages |
| | `dlp:restore` | Restore Archived DLP | Restore soft-deleted DLP maintenance packages back to active list |
| | `dlp:stretches_manage` | Manage 2D Work Stretches | Add, modify, and delete child 2D spatial work stretches |
| | `dlp:bulk_delete` | Bulk Delete DLP Packages | Batch soft-delete multiple selected DLP maintenance packages |
| | `dlp:bulk_restore` | Bulk Restore DLP Packages | Batch restore multiple selected DLP maintenance packages |
| | `dlp:export` | Export DLP Register | Download DLP spreadsheets in departmental format |
| | `dlp:import` | Bulk Excel Import (DLP) | Bulk import DLP maintenance contracts from Excel sheets |
| **Legal Cases** | `legal:view` | View Legal Cases | View High Court and District Court case listings |
| | `legal:create` | Register Legal Cases | Add new WP, WA, or Lower Court litigation records |
| | `legal:edit` | Update Case Proceedings | Edit counter-affidavit status, hearing dates, and court orders |
| | `legal:convert` | Convert Case Type | Convert WP to Writ Appeal (WA) or SLP upon higher appeal |
| | `legal:record_judgment` | Record Final Judgment | Record final court orders, compliance dates, and closure status |
| | `legal:assign_officer` | Assign Law Officers | Assign Government Pleaders, Special GPs, and Advocates to court cases |
| | `legal:delete` | Soft-Delete Cases | Soft-delete court litigation entries |
| | `legal:restore` | Restore Archived Cases | Restore soft-deleted legal litigation cases back to active list |
| | `legal:bulk_delete` | Bulk Delete Cases | Batch soft-delete multiple selected court cases |
| | `legal:bulk_restore` | Bulk Restore Cases | Batch restore multiple selected court cases |
| | `legal:export` | Export Legal Register | Download court case registers to Excel |
| | `legal:import` | Bulk Excel Import (Legal) | Bulk import litigation cases from Excel sheets |
| **Fee Bills** | `fee_bills:view` | View Fee Bills | View advocate fee bills and payment vouchers |
| | `fee_bills:create` | Submit Fee Vouchers | Submit new advocate appearance and drafting fee bills |
| | `fee_bills:edit` | Process Fee Vouchers | Update 5-stage voucher movements, G.O.s, and ECS references |
| | `fee_bills:process_go` | Issue Government Orders | Formally record G.O. sanction numbers and sanctioned amounts |
| | `fee_bills:process_payment` | Record ECS Disbursements | Record treasury bill numbers and final bank disbursement dates |
| | `fee_bills:override_calc` | Override 1/3rd Rule Calc | Authorize and override 1/3rd fee calculation checks |
| | `fee_bills:delete` | Soft-Delete Fee Vouchers | Soft-delete advocate fee records |
| | `fee_bills:restore` | Restore Fee Vouchers | Restore soft-deleted advocate fee vouchers back to active list |
| | `fee_bills:bulk_delete` | Bulk Delete Fee Vouchers | Batch soft-delete multiple selected fee vouchers |
| | `fee_bills:bulk_restore` | Bulk Restore Fee Vouchers | Batch restore multiple selected fee vouchers |
| | `fee_bills:export` | Export Fee Bills | Download advocate payment reports to Excel |
| | `fee_bills:view_audit` | View Fee Movement History | Inspect immutable 5-stage voucher movement timestamps |
| **Staff Directory** | `staff:view` | View Staff Directory | View departmental staff contacts and postings |
| | `staff:create` | Add Staff Personnel | Register new departmental personnel |
| | `staff:edit` | Edit Staff Profiles | Update staff designations, postings, and phone numbers |
| | `staff:transfer` | Transfer Posting Location | Process staff transfers, seat changes, and jurisdiction relocations |
| | `staff:assign_role` | Assign Security Roles | Assign security roles to departmental officers |
| | `staff:delete` | Deactivate Staff Members | Soft-delete personnel and suspend login credentials |
| | `staff:restore` | Restore Archived Staff | Restore deactivated staff personnel back to active posting roster |
| | `staff:bulk_delete` | Bulk Delete Staff | Batch soft-delete multiple selected staff records |
| | `staff:export` | Export Staff Directory | Download personnel directory to Excel |
| | `staff:import` | Bulk Excel Import (Staff) | Bulk import staff personnel roster from Excel sheets |

---

## 3. `system:view_archived` Frontend & Backend Enforcement

### Frontend Enforcement:
1. **Module Header Archive Toggle (`ModulePageHeader.tsx`)**:
   * Uses `useAuth()` to check `auth.canViewArchived`.
   * If permitted: Renders active toggle switch showing current count and state.
   * If unpermitted: Renders disabled button with 40% opacity and tooltip:
     > *"Requires 'system:view_archived' permission to access archived records"*
2. **Highways Sub-Chainages Modal (`ViewHighwayModal.tsx`)**:
   * Archive toggle button is disabled and gated with `auth.canViewArchived`.

### Backend Security Guard:
When `includeDeleted=true` is requested via query parameters on any GET endpoint:
```ts
const session = await getSession();
const rawIncludeDeleted = searchParams.get('includeDeleted') === 'true';
const includeDeleted = rawIncludeDeleted && canPerformAction(session, 'system:view_archived').allowed;
```
Enforced across all 7 retrieval routes:
* `GET /api/highways`
* `GET /api/sub-chainages`
* `GET /api/dlp`
* `GET /api/major-projects`
* `GET /api/legal`
* `GET /api/fee-bills`
* `GET /api/staff`

---

## 4. Module Master Data & Restore RBAC Integration

Every module's Master Data and Restoration endpoints now verify dedicated permissions with automatic backward-compatible fallback:

1. **Restoration Endpoints**:
   * `PATCH /api/dlp` -> `dlp:restore` (fallback `dlp:edit`)
   * `PATCH /api/legal` -> `legal:restore` (fallback `legal:edit`)
   * `PATCH /api/staff` -> `staff:restore` (fallback `staff:edit`)
   * `PATCH /api/major-projects` -> `works:restore` (fallback `works:edit_basic`)
   * `POST /api/highways` (action: restore) -> `highways:restore` (fallback `highways:edit`)
   * `POST /api/sub-chainages` (action: restore) -> `sub_chainages:restore` (fallback `sub_chainages:edit`)
   * `POST /api/fee-bills` (action: restore) -> `fee_bills:restore` (fallback `fee_bills:edit`)

2. **Master Data Management APIs**:
   * `POST/PUT/DELETE /api/highways/master-data` -> `highways:master_data_manage`
   * `POST/PUT/DELETE /api/dlp/master-data` -> `dlp:master_data_manage`
   * `POST/PUT/DELETE /api/legal/master-data` -> `legal:master_data_manage`
   * `POST /api/fee-bills/master-data` -> `fee_bills:master_data_manage`
   * `POST/PUT/DELETE /api/ongoing-works/master-data` -> `works:master_data_manage`
   * `POST/PUT/DELETE /api/major-projects/master-data` -> `works:master_data_manage`
   * `POST/PUT/DELETE /api/staff/master-data` -> `staff:master_data_manage`

3. **Excel Ingestion Engine (`/api/ingest`)**:
   * `HIGHWAYS_MASTER` -> `highways:import`
   * `HIGHWAY_SUB_CHAINAGES` -> `sub_chainages:import`
   * `DLP_CONTRACTS` -> `dlp:import`
   * `LEGAL_CASES` -> `legal:import`
   * `ONGOING_WORKS` -> `works:import`

---

## 5. Database Migration (`0046_complete_granular_permissions.sql`)

The migration seeds all 51 new granular permissions cleanly into `public.permissions`:

```sql
-- File: supabase/migrations/0046_complete_granular_permissions.sql
INSERT INTO public.permissions (code, module, label, description) VALUES
-- System & Security Governance
('system:audit_export', 'System', 'Export Audit Logs', 'Export system audit logs to Excel or CSV'),
('system:view_archived', 'System', 'View Archived Records', 'Toggle and view soft-deleted and archived records across all module dashboards'),
('system:hard_delete', 'System', 'Permanent Database Purge', 'Permanently delete records and history from database tables'),

-- Jurisdiction & Scope
('jurisdiction:reassign_division', 'Jurisdiction', 'Cross-Division Reassignment', 'Reassign existing project or contract jurisdiction to a different Division'),

-- Roles & Users
('roles:reorder', 'Roles & Users', 'Reorder Role Hierarchy', 'Reorder role hierarchy positions via drag-and-drop in Role Studio'),
('roles:delete', 'Roles & Users', 'Delete Custom Roles', 'Delete custom roles and reassign affected users to Viewer'),
('users:unlock', 'Roles & Users', 'Unlock OTP Lockouts', 'Clear temporary login lockouts caused by failed OTP verification attempts'),

-- Module-Specific Master Data Management
('highways:master_data_manage', 'Master Data', 'Manage Highway Master Config', 'Manage Circles, Divisions, Carriageway Configurations, and Level 2 Lane Statuses'),
('dlp:master_data_manage', 'Master Data', 'Manage DLP Master Config', 'Manage DLP Circles, Divisions, and Maintenance Schemes'),
('legal:master_data_manage', 'Master Data', 'Manage Legal Master Config', 'Manage Court Names, Case Types, Present Stages, and GP Opinions'),
('fee_bills:master_data_manage', 'Master Data', 'Manage Fee Bills Master Config', 'Manage G.O. Stages, Claim Types, and Expense Headings'),
('works:master_data_manage', 'Master Data', 'Manage Works Master Config', 'Manage Ongoing Works Schemes, Civil Stages, and Delay Classifications'),
('staff:master_data_manage', 'Master Data', 'Manage Staff Master Config', 'Manage Designations, Posting Units, and Department Wings'),

-- Ongoing Works
('works:create_snapshot', 'Ongoing Works', 'Trigger Monthly Snapshot', 'Manually freeze and generate a monthly progress snapshot for all capital projects'),
('works:bulk_delete', 'Ongoing Works', 'Bulk Soft Delete Works', 'Batch soft-delete multiple selected ongoing capital projects'),
('works:bulk_restore', 'Ongoing Works', 'Bulk Restore Works', 'Batch restore multiple selected ongoing capital projects back to active list'),

-- Highways Catalog & SLD
('highways:restore', 'Highways Catalog', 'Restore Archived Corridors', 'Restore soft-deleted Level 1 highway corridors back to active list'),
('sub_chainages:restore', 'Highways Catalog', 'Restore Sub-Chainages', 'Restore soft-deleted Level 2 sub-chainage geometry stretches'),
('highways:bulk_delete', 'Highways Catalog', 'Bulk Delete Corridors', 'Batch soft-delete multiple selected highway corridors'),
('highways:bulk_restore', 'Highways Catalog', 'Bulk Restore Corridors', 'Batch restore multiple selected highway corridors'),
('highways:import', 'Highways Catalog', 'Bulk Excel Import (Corridors)', 'Bulk import Level 1 highway corridors from Excel sheets'),
('sub_chainages:import', 'Highways Catalog', 'Bulk Excel Import (Sub-Chainages)', 'Bulk import Level 2 sub-chainage stretches from Excel sheets'),

-- DLP Maintenance
('dlp:restore', 'DLP Maintenance', 'Restore Archived Contracts', 'Restore soft-deleted DLP maintenance packages back to active list'),
('dlp:stretches_manage', 'DLP Maintenance', 'Manage 2D Work Stretches', 'Add, modify, and delete child 2D spatial work stretches within a contract package'),
('dlp:bulk_delete', 'DLP Maintenance', 'Bulk Delete DLP Packages', 'Batch soft-delete multiple selected DLP maintenance packages'),
('dlp:bulk_restore', 'DLP Maintenance', 'Bulk Restore DLP Packages', 'Batch restore multiple selected DLP maintenance packages'),
('dlp:import', 'DLP Maintenance', 'Bulk Excel Import (DLP)', 'Bulk import DLP maintenance contracts from Excel sheets'),

-- Legal Litigation
('legal:restore', 'Legal Cases', 'Restore Archived Cases', 'Restore soft-deleted legal litigation cases back to active list'),
('legal:assign_officer', 'Legal Cases', 'Assign Law Officers', 'Assign Government Pleaders, Special GPs, and Advocates to court cases'),
('legal:bulk_delete', 'Legal Cases', 'Bulk Delete Cases', 'Batch soft-delete multiple selected court cases'),
('legal:bulk_restore', 'Legal Cases', 'Bulk Restore Cases', 'Batch restore multiple selected court cases'),
('legal:import', 'Legal Cases', 'Bulk Excel Import (Legal)', 'Bulk import litigation cases from Excel sheets'),

-- Legal Fee Bills
('fee_bills:restore', 'Fee Bills Portal', 'Restore Archived Fee Vouchers', 'Restore soft-deleted advocate fee vouchers back to active list'),
('fee_bills:override_calc', 'Fee Bills Portal', 'Override 1/3rd Rule Calculation', 'Authorize and override 1/3rd fee calculation checks for exceptional vouchers'),
('fee_bills:bulk_delete', 'Fee Bills Portal', 'Bulk Delete Fee Vouchers', 'Batch soft-delete multiple selected fee vouchers'),
('fee_bills:bulk_restore', 'Fee Bills Portal', 'Bulk Restore Fee Vouchers', 'Batch restore multiple selected fee vouchers'),

-- Staff Directory
('staff:restore', 'Staff Directory', 'Restore Archived Staff', 'Restore deactivated staff personnel back to active posting roster'),
('staff:transfer', 'Staff Directory', 'Transfer Posting Location', 'Process staff transfers, seat changes, and jurisdiction relocations'),
('staff:import', 'Staff Directory', 'Bulk Excel Import (Staff)', 'Bulk import staff personnel roster from Excel sheets'),
('staff:bulk_delete', 'Staff Directory', 'Bulk Delete Staff', 'Batch soft-delete multiple selected staff records')
ON CONFLICT (code) DO UPDATE SET 
  module = EXCLUDED.module,
  label = EXCLUDED.label,
  description = EXCLUDED.description;
```

---

## 6. Verification, Type Safety & Automated Test Results

1. **TypeScript Compiler**:
   * Ran: `npx tsc --noEmit` -> **Zero errors** across the entire project.
2. **Automated RBAC Test Matrix**:
   * Super Admin (`*:*`): Unrestricted statewide access to all operations including archived records.
   * Scoped Divisional Officer: Restricted strictly to assigned Circle/Division for mutations; blocked from unauthorized cross-division updates.
   * Viewer Role: Read-only access to active records; blocked from viewing archived records, restoring items, or modifying master configurations.
3. **Repository Status**:
   * Stored locally in `docs/SESSION_CHANGELOG_2026_09_03.md`.
   * **Not pushed to remote repository as instructed**.
