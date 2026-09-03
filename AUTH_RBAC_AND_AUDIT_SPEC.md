# Technical Specification: Authentication, Discord-Style Hierarchical RBAC, Jurisdiction PBAC, and Immutable Audit Trail

This document provides a comprehensive, ground-truth reference for the Security, Identity, Role-Based Access Control (RBAC), Policy-Based Access Control (PBAC) Jurisdiction Engine, and Immutable Google-Sheets-style Audit Trail implemented in the Tamil Nadu National Highways Department Management System.

---

## 📑 Table of Contents
1. [Core Architectural Principles](#1-core-architectural-principles)
2. [Authentication & Session Architecture](#2-authentication--session-architecture)
   - [Phone Identification & 10-Digit Sanitization](#phone-identification--10-digit-sanitization)
   - [TOTP MFA (RFC 6238 Standard)](#totp-mfa-rfc-6238-standard)
   - [Encrypted Session Token (`nh_session`)](#encrypted-session-token-nh_session)
   - [Global Route Guard & Middleware / Proxy](#global-route-guard--middleware--proxy)
3. [Discord-Style Hierarchical RBAC](#3-discord-style-hierarchical-rbac)
   - [Position Integer Hierarchy Invariants](#position-integer-hierarchy-invariants)
   - [Anti-Escalation Security Policy](#anti-escalation-security-policy)
   - [Decoupled Designation vs. Role Design](#decoupled-designation-vs-role-design)
4. [Symmetric PBAC Jurisdiction Scoping](#4-symmetric-pbac-jurisdiction-scoping)
   - [`jurisdiction:view_statewide` (Blind Data Siloing)](#jurisdictionview_statewide-blind-data-siloing)
   - [`jurisdiction:edit_statewide` (Mutation Blocking)](#jurisdictionedit_statewide-mutation-blocking)
   - [Evaluation Rules & Decision Matrix](#evaluation-rules--decision-matrix)
5. [Complete Master Permissions Catalog (50+ Permissions)](#5-complete-master-permissions-catalog-50-permissions)
6. [Immutable Google-Sheets-Style Audit Trail](#6-immutable-google-sheets-style-audit-trail)
   - [Database Ledger Schema (`public.audit_logs`)](#database-ledger-schema-publicaudit_logs)
   - [Granular Red $\rightarrow$ Green Field-Level Diffs](#granular-red--green-field-level-diffs)
   - [Before / After State Snapshots](#before--after-state-snapshots)
   - [Statewide Audit Console (`/admin/audit`) & Excel Export](#statewide-audit-console-adminaudit--excel-export)
7. [Emergency System Lockdown Protocol](#7-emergency-system-lockdown-protocol)
8. [Module-by-Module Integration Map](#8-module-by-module-integration-map)
9. [Database Schema & SQL Migration (`0043`)](#9-database-schema--sql-migration-0043)
10. [Developer Guide: How to Extend or Modify](#10-developer-guide-how-to-extend-or-modify)

---

## 1. Core Architectural Principles

1. **Zero Workarounds & Real Relational Schema Integrity**:
   - Every role, permission, user profile, and audit event maps 1:1 to dedicated, strongly-typed PostgreSQL columns (`roles`, `permissions`, `role_permissions`, `user_profiles`, `audit_logs`, `system_settings`).
   - Zero hardcoded mock fallback lists; missing data defaults strictly to empty arrays or nulls.
2. **Discord-Style Position Stacking**:
   - Higher position integer = higher authority in the hierarchy.
   - Officers can only view, manage, reorder, or assign roles positioned strictly below their own rank.
3. **Decoupled Job Designation vs. Security Role**:
   - **Designation**: Real-world governmental job post (e.g., *Chief Engineer*, *Superintending Engineer*, *Divisional Engineer*, *Assistant Divisional Engineer*, *Assistant Engineer*).
   - **Security Role**: Platform access policy (e.g., *Super Admin*, *Circle Manager*, *Divisional Editor*, *Viewer*).
4. **Non-Repudiation & Universal Audit Logging**:
   - Every single creation, modification, soft-deletion, restoration, lockdown toggle, and role promotion is logged with the actor's ID, name, phone, designation, role, IP address, and point-in-time state diff.
5. **Fail-Closed Policy**:
   - If an officer lacks explicit permission or jurisdiction, the server rejects the action with `403 Forbidden` and surfaces the exact reason.

---

## 2. Authentication & Session Architecture

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 1. Phone Input  │ ────> │ 2. TOTP Setup / Verify │ ────> │ 3. Encrypted Cookie    │
│ (10 Digits)     │       │ (RFC 6238 SHA-256 HMAC)│       │ (nh_session, AES/HMAC) │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
                                                                        │
                                                                        ▼
                                                           ┌────────────────────────┐
                                                           │ 4. Route Gate Proxy    │
                                                           │ (Validates Permissions)│
                                                           └────────────────────────┘
```

### Phone Identification & 10-Digit Sanitization
- Endpoint: `POST /api/auth/identify`
- Sanitization: All phone inputs are stripped of whitespace, dashes, and international prefixes using `val.replace(/[\s-]/g, '').slice(-10)`.
- Lookup: Resolves against `public.staff_members` (must be `delete_status = 'ACTIVE'`) and links to `public.user_profiles`.
- First-Time Registration:
  - If the officer does not have an active 2FA secret, the server automatically generates a high-entropy base32 secret and returns an `otpauth://` QR code URL:
    `otpauth://totp/TNHighways:<PHONE>?secret=<BASE32_SECRET>&issuer=TNHighways`
  - The officer scans this with Google Authenticator, Microsoft Authenticator, or 2FAS.

### TOTP MFA (RFC 6238 Standard)
- Endpoint: `POST /api/auth/verify-totp`
- Library: `otpauth` (Pure TypeScript RFC 6238 engine).
- Window: Configured with $\Delta = \pm 1$ time-step window (30-second leeway) to tolerate client clock drifts.
- Account Status Check: Rejects authentication if `user_profiles.is_active = FALSE` or if `staff_members.delete_status != 'ACTIVE'`.

### Encrypted Session Token (`nh_session`)
- Utility: `src/lib/auth/session.ts`
- Token Payload:
  ```json
  {
    "userId": "uuid-v4",
    "staffId": "uuid-v4",
    "fullName": "Er. K. Senthil Nathan",
    "phoneNumber": "9876543210",
    "designation": "Divisional Engineer",
    "circle": "Salem Circle",
    "division": "Salem (NH)",
    "subDivision": "Salem Sub-Division",
    "roleId": "uuid-v4",
    "roleName": "Divisional Officer",
    "rolePosition": 50,
    "isSuperAdmin": false,
    "permissions": ["works:view", "works:edit_progress", "dlp:view", "dlp:edit", ...],
    "jurisdictionScope": "DIVISION",
    "issuedAt": 1725321600000,
    "expiresAt": 1725350400000
  }
  ```
- Cookie Properties:
  - Name: `nh_session`
  - `httpOnly: true` (Inaccessible to browser JavaScript)
  - `secure: process.env.NODE_ENV === 'production'`
  - `sameSite: 'lax'`
  - `maxAge: 86400` (1 Day / 24 Hours)

### Global Route Guard & Middleware / Proxy
- File: `src/middleware.ts` / `src/proxy.ts`
- Whitelisted Paths: `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`.
- Unauthenticated Access: Automatically redirects to `/login`.
- Authenticated Users on `/login`: Automatically redirects to `/ongoing-works`.
- Role Management Route `/roles` / `/admin/audit`: Rejects non-authorized personnel with HTTP 403.

---

## 3. Discord-Style Hierarchical RBAC

The system implements a Discord-inspired role stack where role precedence and governance power are determined by an integer `position` column.

```
┌────────────────────────────────────────────────────────┐
│ POSITION 100: Super Admin (Locked Root System Role)     │
│  - Has `*:*` wildcard permission                       │
│  - Bypasses all jurisdiction constraints               │
│  - Immortal & immune to position demotion or deletion  │
├────────────────────────────────────────────────────────┤
│ POSITION 80: Chief Engineer / Head Office Admin        │
│  - Position > all regional roles                       │
│  - Can manage and assign roles positioned < 80         │
├────────────────────────────────────────────────────────┤
│ POSITION 60: Superintending Engineer (Circle Manager)  │
│  - Can manage roles positioned < 60                    │
├────────────────────────────────────────────────────────┤
│ POSITION 40: Divisional Engineer (Division Officer)    │
│  - Can manage roles positioned < 40                    │
├────────────────────────────────────────────────────────┤
│ POSITION 20: Assistant Engineer (Field Executive)      │
├────────────────────────────────────────────────────────┤
│ POSITION 0: Viewer (Baseline Guest System Role)        │
│  - Read-only baseline permissions                      │
└────────────────────────────────────────────────────────┘
```

### Position Integer Hierarchy Invariants
1. **Target Position Rule**:
   An actor with role position $P_{\text{actor}}$ can only modify, reorder, delete, or assign a role with position $P_{\text{target}}$ if:
   $$P_{\text{target}} < P_{\text{actor}}$$
2. **Reordering Invariant**:
   Custom roles can only be moved within the range strictly below the actor's highest role position:
   $$0 < P_{\text{custom}} < P_{\text{actor}}$$
3. **Super Admin Immortality**:
   The `Super Admin` role cannot be deleted, renamed, or demoted from Position 100.

### Anti-Escalation Security Policy
An actor cannot grant a permission code to any role unless the actor personally possesses that permission code:
$$\text{GrantedPermissions} \subseteq \text{ActorPermissions}$$
This prevents lower administrators from creating "trojan" roles with permissions higher than their own clearance.

### Decoupled Designation vs. Role Design
- Officers retain their official civil service title in `staff_members.designation` (e.g., *Superintending Engineer*).
- Their operational authorization is governed independently by `user_profiles.role_id`.
- Empty designations display cleanly as `" — "` across all UI tables (no artificial fallback words).

---

## 4. Symmetric PBAC Jurisdiction Scoping

Jurisdiction boundaries prevent unauthorized cross-division data leakage or tampering while allowing statewide roles to oversee the entire state.

```
                               ┌────────────────────────────────┐
                               │ Action Requested (Read/Write)  │
                               └────────────────────────────────┘
                                                │
                                                ▼
                                    Is Super Admin or `*:*`?
                                   /                        \
                               [YES]                        [NO]
                                 │                            │
                                 ▼                            ▼
                          ALLOW STATEWIDE          Check Specific Perm Code
                                                              │
                                                              ▼
                                                   Does Actor have Perm?
                                                  /                     \
                                              [NO]                      [YES]
                                                │                         │
                                                ▼                         ▼
                                           REJECT (403)         Check Jurisdiction Scope
                                                                /                      \
                                                        STATEWIDE / Perm Bypass    DIVISION / CIRCLE
                                                                    │                      │
                                                                    ▼                      ▼
                                                              ALLOW ALL           Match Target Division?
                                                                                  /                    \
                                                                              [MATCH]               [MISMATCH]
                                                                                │                       │
                                                                                ▼                       ▼
                                                                              ALLOW                REJECT (403)
```

### `jurisdiction:view_statewide` (Blind Data Siloing)
- When **unchecked**:
  - The server automatically appends SQL filters to `GET` queries:
    ```sql
    WHERE LOWER(division) = LOWER('Salem (NH)')
    ```
  - The officer cannot view projects, contracts, or court cases from other divisions.
- When **checked**:
  - The officer can view records across all circles and divisions in Tamil Nadu.

### `jurisdiction:edit_statewide` (Mutation Blocking)
- When **unchecked**:
  - The server blocks `POST`, `PUT`, `PATCH`, and `DELETE` requests targeting records outside the officer's assigned division:
    ```ts
    if (targetDivision !== session.division) {
      return { allowed: false, reason: "You do not have jurisdiction to modify records in Salem (NH)." };
    }
    ```
- When **checked**:
  - The officer can create, edit, and delete records statewide (subject to module-level permissions).

### Evaluation Rules & Decision Matrix

| Actor Role / Perms | Target Record Division | Read Action (`:view`) | Write Action (`:edit`) | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Any Division | Allowed | Allowed | Full Access |
| **Division Officer** (No Statewide Perms) | Same Division (`Salem`) | Allowed | Allowed | Authorized |
| **Division Officer** (No Statewide Perms) | Other Division (`Madurai`) | Blindly Siloed / Filtered | Blocked (403) | Protected |
| **State Auditor** (`jurisdiction:view_statewide`) | Any Division | Allowed | Blocked (403) | Read-Only Statewide |
| **State Flying Squad** (`view_statewide` + `edit_statewide`) | Any Division | Allowed | Allowed | Statewide Power |

---

## 5. Complete Master Permissions Catalog (98 Granular Permissions)

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

## 6. Immutable Google-Sheets-Style Audit Trail

Every state-altering event is recorded in an immutable, append-only ledger (`public.audit_logs`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PUBLIC.AUDIT_LOGS TABLE                                                                │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ id                │ UUID Primary Key (Auto-generated)                                  │
│ timestamp         │ TIMESTAMPTZ DEFAULT NOW()                                          │
│ actor_id          │ UUID references auth user / profile                                │
│ actor_name        │ String ("Er. K. Senthil Nathan")                                   │
│ actor_phone       │ String ("9876543210")                                              │
│ actor_designation │ String ("Divisional Engineer")                                     │
│ actor_role        │ String ("Divisional Officer")                                      │
│ module            │ Enum ('ONGOING_WORKS', 'DLP', 'LEGAL', 'FEE_BILLS', ...)           │
│ action            │ Enum ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOCKDOWN_TOGGLE')  │
│ entity_id         │ String ("lc-Salem-2026-001" / "mp-82")                             │
│ entity_title      │ String ("WP 12480/2026: S. Ramanathan vs State of TN")             │
│ changes_summary   │ String ("Updated Counter Affidavit status from Pending to Filed")  │
│ old_state         │ JSONB (Previous record snapshot)                                   │
│ new_state         │ JSONB (New record snapshot)                                       │
│ diff_payload      │ JSONB ({ "ca_filed": { "old": "No", "new": "Yes" } })              │
│ ip_address        │ String ("49.37.12.84")                                             │
│ user_agent        │ String ("Mozilla/5.0 ...")                                         │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

### Granular Red $\rightarrow$ Green Field-Level Diffs
- Utility: `computeStateDiff(oldState, newState)` in `src/lib/audit/logger.ts`
- Computes recursive shallow and deep differences between previous and modified states.
- The UI in [`/admin/audit`](http://localhost:3000/admin/audit) renders exact visual diffs:
  - Red (`-`) for deleted or overwritten values.
  - Green (`+`) for new or updated values.

### Before / After State Snapshots
- Point-in-time state is preserved in `old_state` and `new_state`.
- Allows reconstructive time-travel auditing of any project or contract throughout its multi-year lifecycle.

### Statewide Audit Console (`/admin/audit`) & Excel Export
- Features:
  - Real-time search across Officer Name, Phone Number, Module, Entity Title, and Changes Summary.
  - Module filter pills (`ALL`, `ONGOING_WORKS`, `DLP`, `LEGAL`, `FEE_BILLS`, `HIGHWAYS`, `STAFF`, `ROLES`, `SYSTEM`).
  - Action badge indicators (`CREATE` in Green, `UPDATE` in Blue, `DELETE` in Red, `RESTORE` in Emerald, `LOCKDOWN` in Amber).
  - One-Click **Export Audit Trail to Excel**: Generates styled `.xlsx` reports with complete diff summaries and metadata.

---

## 7. Emergency System Lockdown Protocol

- Endpoint: `POST /api/admin/lockdown`
- Table: `public.system_settings` (`key = 'maintenance_mode'`)
- When Lockdown is active:
  - All write/mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) across all 8 modules immediately return `503 Service Unavailable` with the message:
    *"System is currently under administrative maintenance lockdown. All modifications are temporarily suspended."*
  - Read queries (`GET`) remain operational in strict read-only mode.
  - Only `Super Admin` can disable the lockdown.

---

## 8. Module-by-Module Integration Map

| Endpoint | Read Siloing (PBAC) | Mutation Permission Check | Audit Logger Trigger |
| :--- | :--- | :--- | :--- |
| `src/app/api/major-projects/route.ts` | `.ilike('division', session.division)` | `works:create`, `works:edit_progress`, `works:delete` | `logAudit(module: 'ONGOING_WORKS')` |
| `src/app/api/dlp/route.ts` | `.ilike('division_name', session.division)` | `dlp:create`, `dlp:edit`, `dlp:delete` | `logAudit(module: 'DLP')` |
| `src/app/api/legal/route.ts` | `.eq('division', session.division)` | `legal:create`, `legal:edit`, `legal:delete` | `logAudit(module: 'LEGAL')` |
| `src/app/api/fee-bills/route.ts` | Filter by `session.division` | `fee_bills:create`, `fee_bills:edit`, `fee_bills:delete` | `logAudit(module: 'FEE_BILLS')` |
| `src/app/api/highways/route.ts` | Statewide overview | `highways:create`, `highways:edit`, `highways:delete` | `logAudit(module: 'HIGHWAYS')` |
| `src/app/api/sub-chainages/route.ts` | Statewide query | `sub_chainages:create`, `sub_chainages:edit`, `sub_chainages:delete` | `logAudit(module: 'HIGHWAYS')` |
| `src/app/api/staff/route.ts` | Directory view | `staff:create`, `staff:edit`, `staff:delete` | `logAudit(module: 'STAFF')` |
| `src/app/api/roles/route.ts` | Hierarchy stack | `roles:create`, `roles:edit`, `roles:delete`, `roles:reorder` | `logAudit(module: 'ROLES')` |

---

## 9. Database Schema & SQL Migration (`0043`)

The entire system is powered by migration `supabase/migrations/0043_master_auth_rbac_and_audit.sql`.

### Core Tables Summary:
1. `public.roles`: `id`, `name`, `position` (INT), `default_scope` (VARCHAR), `is_system_role` (BOOLEAN), `created_at`, `updated_at`.
2. `public.permissions`: `code` (VARCHAR PK), `module` (VARCHAR), `label` (VARCHAR), `description` (TEXT), `created_at`.
3. `public.role_permissions`: `role_id` (FK), `permission_code` (FK), `PRIMARY KEY (role_id, permission_code)`.
4. `public.user_profiles`: `id`, `staff_id` (FK), `phone_number` (VARCHAR 10), `full_name`, `circle`, `division`, `sub_division`, `role_id` (FK), `totp_secret` (VARCHAR), `totp_enabled` (BOOLEAN), `is_active` (BOOLEAN), `last_login_at`.
5. `public.audit_logs`: `id`, `timestamp`, `actor_id`, `actor_name`, `actor_phone`, `actor_designation`, `actor_role`, `module`, `action`, `entity_id`, `entity_title`, `changes_summary`, `old_state`, `new_state`, `diff_payload`, `ip_address`, `user_agent`.
6. `public.system_settings`: `key` (PK), `value` (JSONB), `description` (TEXT), `updated_by` (FK), `updated_at`.

---

## 10. Developer Guide: How to Extend or Modify

### Adding a New Permission
1. Add the permission code to `supabase/migrations/0043_master_auth_rbac_and_audit.sql`:
   ```sql
   INSERT INTO public.permissions (code, module, label, description) VALUES
   ('new_module:new_action', 'New Module', 'Action Label', 'Detailed action description');
   ```
2. In the target API route:
   ```ts
   const session = await getSession();
   const authCheck = canPerformAction(session, 'new_module:new_action', { division: targetDivision });
   if (!authCheck.allowed) {
     return NextResponse.json({ success: false, error: authCheck.reason }, { status: 403 });
   }
   ```
3. In the frontend component:
   ```tsx
   const { hasPermission } = useAuth();
   if (!hasPermission('new_module:new_action')) {
     return null; // or render disabled button
   }
   ```

### Logging a Custom Audit Event
Call `logAudit` inside your API route mutation:
```ts
import { logAudit } from '@/lib/audit/logger';

await logAudit({
  actor: session,
  module: 'ONGOING_WORKS', // or 'DLP' | 'LEGAL' | 'FEE_BILLS' | 'HIGHWAYS' | 'STAFF' | 'ROLES' | 'SYSTEM'
  action: 'UPDATE',       // 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOCKDOWN_TOGGLE' | 'ASSIGN_ROLE'
  entityId: record.id,
  entityTitle: `Record Name or Project Title`,
  changesSummary: `Human readable summary of change`,
  oldState: existingRecord,
  newState: updatedRecord,
});
```

### Modifying Jurisdiction Scoping Behavior
Edit `src/lib/auth/permissions.ts` in the `canPerformAction` function. All permission checks funnel through this single pure function.
