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
  - `maxAge: 28800` (8 Hours)

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

## 5. Complete Master Permissions Catalog (50+ Permissions)

| Module | Permission Code | Label | Description |
| :--- | :--- | :--- | :--- |
| **Jurisdiction** | `jurisdiction:view_statewide` | View Statewide Records | View projects, contracts, and cases outside assigned Circle/Division |
| | `jurisdiction:edit_statewide` | Edit Statewide Records | Edit and mutate records outside assigned Circle/Division |
| **Ongoing Works** | `works:view` | View Works MIS | View ongoing works dashboard and project lists |
| | `works:create` | Create Projects | Add new ongoing capital project records |
| | `works:edit_progress` | Update Physical/Financial Progress | Edit monthly progress %, expenditures, and stage remarks |
| | `works:override_frozen` | Edit Sanctioned Metadata | Modify frozen baseline contract and sanction values |
| | `works:delete` | Soft-Delete Works | Archive or remove ongoing project records |
| | `works:export` | Export Works to Excel | Export project MIS to styled Excel workbooks |
| | `works:view_history` | View Historical Snapshots | View past progress snapshots and milestone staircases |
| **DLP Maintenance** | `dlp:view` | View DLP Register | View defect liability corridors and 2D spatial chainages |
| | `dlp:create` | Add DLP Stretches | Register new DLP corridors and warranty segments |
| | `dlp:edit` | Edit Maintenance Records | Update contractor details, completion dates, and widths |
| | `dlp:delete` | Delete Maintenance Stretches | Archive or soft-delete DLP corridors and work stretches |
| | `dlp:export` | Export DLP Register | Download DLP spreadsheets in departmental format |
| **Legal Litigation** | `legal:view` | View Legal Cases | View High Court and District Court case listings |
| | `legal:create` | Register Legal Cases | Add new WP, WA, or Lower Court litigation records |
| | `legal:edit` | Update Case Proceedings | Edit counter-affidavit status, hearing dates, and orders |
| | `legal:delete` | Delete Legal Cases | Archive or soft-delete court litigation entries |
| | `legal:export` | Export Legal Register | Download court case registers to Excel |
| **Fee Bills** | `fee_bills:view` | View Fee Bills | View advocate fee bills and payment vouchers |
| | `fee_bills:create` | Create Fee Vouchers | Submit new advocate appearance and drafting fee bills |
| | `fee_bills:edit` | Process & Settle Vouchers | Update 5-stage voucher movements, G.O.s, and ECS reference |
| | `fee_bills:delete` | Delete Fee Vouchers | Soft-delete advocate fee records |
| | `fee_bills:export` | Export Fee Bills | Download advocate payment reports to Excel |
| **Highways Corridors** | `highways:view` | View Highway Network | View master highway corridors and SLD views |
| | `highways:create` | Add Highway Corridors | Register new National Highway road codes |
| | `highways:edit` | Edit Highway Geometry | Update corridor lengths, lane configurations, and towns |
| | `highways:delete` | Delete Highway Corridors | Soft-delete highway network corridors |
| | `highways:export` | Export Highways Catalog | Export corridor catalog to Excel |
| **Sub-Chainages** | `sub_chainages:view` | View Micro-Geometry | View sub-chainage lane breakdowns and PCU counts |
| | `sub_chainages:create` | Add Sub-Chainages | Add discrete micro-lane stretches |
| | `sub_chainages:edit` | Edit Micro-Lane Data | Update ROW widths, carriageway widths, and town names |
| | `sub_chainages:delete` | Delete Sub-Chainages | Soft-delete micro-lane stretches |
| **Staff & Roles** | `staff:view` | View Staff Directory | View departmental staff contacts and postings |
| | `staff:create` | Add Staff Members | Register new departmental personnel |
| | `staff:edit` | Edit Staff Profiles | Update staff designations, postings, and phone numbers |
| | `staff:delete` | Archive Staff Members | Soft-delete personnel and suspend login credentials |
| | `staff:assign_role` | Assign Platform Roles | Assign security roles to departmental officers |
| | `staff:export` | Export Staff Directory | Download personnel directory to Excel |
| | `roles:view` | View Roles & Permissions | Open Role Studio and inspect permission stacks |
| | `roles:create` | Create Custom Roles | Create new security roles with assigned permissions |
| | `roles:edit` | Edit Role Permissions | Modify permission checkboxes and default scopes |
| | `roles:delete` | Delete Custom Roles | Remove custom roles and reassign users to Viewer |
| | `roles:reorder` | Reorder Role Hierarchy | Adjust integer position hierarchy stack |
| **Audit & Governance** | `audit:view` | View Audit Logs | Access `/admin/audit` to inspect tamper-proof activity logs |
| | `audit:export` | Export Audit Trail | Download complete audit trail with diffs to Excel |
| | `system:lockdown` | Trigger Emergency Lockdown | Toggle read-only maintenance lockdown statewide |
| | `system:reset_2fa` | Reset Officer 2FA Secrets | Reset lost authenticator keys for departmental officers |

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
