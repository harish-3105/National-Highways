# Architecture Specification: Hierarchical Access Control & Mandatory 2FA Security

**Document Version**: 1.0.0  
**Target Platform**: Next.js (App Router) + Supabase PostgreSQL  
**Departmental Scope**: Tamil Nadu Highways Department  
**Module Integration**: Staff Portal (`/staff`), Highways (`/highways`), Ongoing Works (`/ongoing-works`), DLP (`/dlp`), Fee Bills (`/fee-bills`), Legal Cases (`/legal`)  
**Status**: Approved Architecture — Implementation Blueprint  

---

## 1. Executive Summary & Core Architectural Principles

In public infrastructure administration (Tamil Nadu Highways Department), statutory powers and operational responsibilities are vested in the **Post / Seat in a Jurisdiction** (e.g. *Divisional Engineer, Salem Division*), not in an individual's personal identity.

This architecture adopts **Post / Seat-Based Access Control (PBAC)** with **Cascading Delegation** and **Mandatory Multi-Factor Authentication (2FA/MFA)**:

1. **Permissions are Computed Dynamically**:
   $$\text{Access Tier} = f(\text{Designation})$$
   $$\text{Data Boundary} = f(\text{Circle, Division, Section})$$
2. **Total Separation of Auth Identity and Organizational Hierarchy**:
   * **Authentication Vault (`auth.users`)**: Manages login emails, salted/hashed passwords (Bcrypt), and 2FA TOTP secret keys.
   * **Seat Registry (`public.staff_members`)**: Manages the civil engineer seat hierarchy (`office`, `circle`, `division`, `sub_division`, `section`, `designation`).
3. **Instant Incumbent Swapping**: When an officer is transferred or promoted, updating the seat record in the Staff Portal instantly updates the officer's authority on their next login with zero permission re-configuration.
4. **Zero Client-Side Bypass**: All authorization, scoping, and 2FA validations are strictly enforced at the **Server-Side Middleware** and **PostgreSQL Row Level Security (RLS)** layers.

---

## 2. The 4-Tier Hierarchy & Authority Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: SUPER ADMIN                             │
│       (Chief Engineer / Special Chief Engineer / HQ Admin)             │
│  • Global Statewide Scope (All Circles, Divisions & Modules)           │
│  • Can bypass stage gates & draft validation rules                     │
│  • Full downward provisioning: Can create/appoint all roles            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Appoints Circle Heads
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 2: CIRCLE HEAD                             │
│                  (Superintending Engineer - SE)                        │
│  • Scoped strictly to assigned Circle (e.g. Salem Circle)              │
│  • Circle-wide admin powers (sees all Divisions inside Circle)         │
│  • Downward provisioning: Can appoint Division Heads & Staff in Circle │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Appoints Division Heads
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       TIER 3: DIVISION HEAD                            │
│                   (Divisional Engineer - DE / EE)                      │
│  • Scoped strictly to assigned Division (e.g. Salem Division)          │
│  • Division-wide management powers (Projects, Stretches, Bills, Cases) │
│  • Downward provisioning: Can appoint Normal Staff in Division         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Appoints Field Staff
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 4: NORMAL STAFF                            │
│          (Asst. Divisional Engineer / Asst. Engineer / JE / Clerks)    │
│  • Scoped strictly to assigned Sub-Division / Section                  │
│  • Strict Stage-Gated Validation rules applied across all entry forms  │
│  • Zero provisioning powers (cannot create or assign users)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Downward Delegation & Provisioning Rules

| Initiating Role | Allowed Roles to Create / Appoint | Scope Constraint on UI Dropdowns |
| :--- | :--- | :--- |
| **Super Admin** | Super Admin, Circle Head, Division Head, Staff | Unrestricted — Any Office, Circle, Division across Tamil Nadu. |
| **Circle Head** | Division Head, Normal Staff | `Circle` dropdown is **locked** to the Circle Head's assigned circle. Can choose any Division within that Circle. |
| **Division Head** | Normal Staff (ADE, AE, JE, Clerks) | `Circle` and `Division` dropdowns are **locked** to the Division Head's assigned division. |
| **Normal Staff** | None | User creation / role assignment interface is **completely disabled**. |

### Anti-Escalation Guardrails:
1. **Server-Side Enforcement**: API endpoints verify that the `appointed_by` officer possesses equal or higher tier authority than the target role being created.
2. **Boundary Lockdown**: If a Salem Division Head attempts to POST a staff member assigned to `Madurai Division`, the server rejects the request with `403 Forbidden`.

---

## 4. Dynamic Seat Allocation & Incumbent Transfer Workflow

### A. Designation-to-Tier Mapping Table:

| Departmental Designation | Default Access Tier | Typical Jurisdiction Scope |
| :--- | :--- | :--- |
| **Chief Engineer (CE)** / **Joint Chief Engineer** | `ADMIN` | Statewide / All Circles |
| **Superintending Engineer (SE)** | `CIRCLE_HEAD` | Assigned Circle |
| **Divisional Engineer (DE)** / **Executive Engineer (EE)** | `DIVISION_HEAD` | Assigned Division |
| **Assistant Divisional Engineer (ADE)** | `STAFF` | Assigned Sub-Division |
| **Assistant Engineer (AE)** / **Junior Engineer (JE)** | `STAFF` | Assigned Section |
| **Divisional Accountant / Superintendent / Clerk** | `STAFF` | Assigned Division / Office |

### B. Incumbent Transfer Sequence (1-Click Workflow):

```
1. Officer Transfer Order Issued:
   Er. K. Ramesh (DE, Salem Division) transfers to (DE, Dharapuram Division).

2. Admin Action in Staff Portal (/staff):
   • Locate Er. K. Ramesh's seat record.
   • Update [Division] dropdown: 'Salem' ──► 'Dharapuram'.
   • Save Record.

3. Next Login by Er. K. Ramesh:
   • Authenticates with existing email and 2FA.
   • Session immediately reads: Division = 'Dharapuram'.
   • All dashboard metrics, ongoing works, and SLD views instantly scope to Dharapuram.
   • Zero residual access to Salem Division.
```

---

## 5. Strict 2FA / MFA Security Model

To prevent unauthorized access, account sharing, or credentials interception, **Multi-Factor Authentication (MFA)** via **TOTP (Time-Based One-Time Password)** is mandatory.

```
                    ┌──────────────────────────────────────┐
                    │       OFFICER ENTERS CREDENTIALS     │
                    │      Email & Cryptographic Password  │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │    SUPABASE AUTH SESSION CREATED     │
                    │   Assurance Level: `aal1` (Tier 1)   │
                    │   Status: BLOCKED FROM ALL DATA      │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │       2FA CHALLENGE ENFORCEMENT      │
                    │  Prompts for 6-Digit TOTP Code from  │
                    │ (Google Auth / Microsoft Auth / Duo) │
                    └──────────────────┬───────────────────┘
                                       │ Valid Code Provided
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     SESSION ELEVATED TO `aal2`       │
                    │       (Tier 2 - FULLY VERIFIED)      │
                    │                                      │
                    │  Server unlocks data routes based on │
                    │    Designation + Division bounds     │
                    └──────────────────────────────────────┘
```

### Why "Inspect Element" / Client-Side Gimmicks Are Impossible:
1. **No Authorization in the Browser**: The client browser never receives unfiltered statewide data. All database queries execute with `WHERE circle = ...` or `WHERE division = ...` computed on the backend server.
2. **HttpOnly Secure Cookies**: The JWT access token is stored in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie that cannot be read, modified, or forged by JavaScript running in browser DevTools.
3. **Database RLS `aal2` Policy**: Even if an attacker forged an internal API request, PostgreSQL RLS policies reject any transaction where `auth.jwt() ->> 'aal' != 'aal2'`.

---

## 6. Database Schema & SQL Blueprint

### Migration SQL: Extending `public.staff_members`

```sql
-- 1. Add authentication & access control columns to staff_members
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS access_tier VARCHAR(30) DEFAULT 'STAFF', -- 'ADMIN', 'CIRCLE_HEAD', 'DIVISION_HEAD', 'STAFF'
ADD COLUMN IF NOT EXISTS can_bypass_rules BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointed_by UUID REFERENCES public.staff_members(id),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Indexes for instant session lookup by Auth ID and Email
CREATE INDEX IF NOT EXISTS idx_staff_members_auth_user ON public.staff_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_emailid ON public.staff_members(emailid);
CREATE INDEX IF NOT EXISTS idx_staff_members_tier ON public.staff_members(access_tier);

-- 3. PostgreSQL Helper: Get Current User Staff Profile
CREATE OR REPLACE FUNCTION public.get_current_staff_session()
RETURNS TABLE (
    staff_id UUID,
    email TEXT,
    tier VARCHAR(30),
    office TEXT,
    circle TEXT,
    division TEXT,
    sub_division TEXT,
    section TEXT,
    designation TEXT,
    can_bypass BOOLEAN
) 
SECURITY DEFINER
LANGUAGE sql
AS $$
    SELECT 
        s.id AS staff_id,
        s.emailid AS email,
        s.access_tier AS tier,
        s.office,
        s.circle,
        s.division,
        s.sub_division,
        s.section,
        s.designation,
        s.can_bypass_rules AS can_bypass
    FROM public.staff_members s
    WHERE (s.auth_user_id = auth.uid() OR s.emailid = (SELECT auth.jwt() ->> 'email'))
      AND s.delete_status = 'ACTIVE'
      AND s.is_active = true
    LIMIT 1;
$$;
```

---

## 7. Next.js Server Architecture (Session & Scoping Helpers)

### A. Server Session Extractor (`src/lib/auth/session.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface StaffSessionUser {
  userId: string;
  email: string;
  name: string;
  tier: 'ADMIN' | 'CIRCLE_HEAD' | 'DIVISION_HEAD' | 'STAFF';
  office: string | null;
  circle: string | null;
  division: string | null;
  subDivision: string | null;
  section: string | null;
  designation: string;
  canBypassRules: boolean;
  is2faVerified: boolean;
}

export async function getStaffSession(): Promise<StaffSessionUser | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(...);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify aal2 (2FA Level)
  const aal = user.app_metadata?.aal || 'aal1';
  const is2faVerified = aal === 'aal2';

  // Query staff record
  const { data: staff } = await supabase
    .from('staff_members')
    .select('*')
    .eq('emailid', user.email)
    .eq('delete_status', 'ACTIVE')
    .single();

  if (!staff) return null;

  return {
    userId: user.id,
    email: user.email || '',
    name: staff.name,
    tier: (staff.access_tier as any) || 'STAFF',
    office: staff.office,
    circle: staff.circle,
    division: staff.division,
    subDivision: staff.sub_division,
    section: staff.section,
    designation: staff.designation || 'Staff',
    canBypassRules: staff.access_tier === 'ADMIN' || Boolean(staff.can_bypass_rules),
    is2faVerified,
  };
}
```

### B. Standard Query Scoping Wrapper (`src/lib/auth/queryScope.ts`)

```typescript
import { StaffSessionUser } from './session';

export function applyHierarchyScope<T>(
  query: any,
  user: StaffSessionUser,
  circleColumn: string = 'circle',
  divisionColumn: string = 'division'
) {
  if (user.tier === 'ADMIN') {
    return query; // Global Statewide Access
  }

  if (user.tier === 'CIRCLE_HEAD') {
    return query.eq(circleColumn, user.circle);
  }

  if (user.tier === 'DIVISION_HEAD' || user.tier === 'STAFF') {
    return query.eq(divisionColumn, user.division);
  }

  return query.eq('id', '00000000-0000-0000-0000-000000000000'); // Fail-closed default
}
```

---

## 8. Rollout Checklist & Phased Implementation

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: DATABASE SCHEMA UPGRADE                                       │
│ [ ] Run SQL migration adding `auth_user_id`, `access_tier` to staff.   │
│ [ ] Add unique index on `staff_members.emailid`.                       │
│ [ ] Drop legacy redundant tables: `lawyers`, `highway_chainages`, etc. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: AUTHENTICATION & 2FA PORTAL                                   │
│ [ ] Build `/login` screen supporting Email + Password.                 │
│ [ ] Build `/auth/2fa` challenge & QR code enrollment flow.             │
│ [ ] Implement Next.js `middleware.ts` enforcing `aal2` session check.  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: STAFF PORTAL PROVISIONING & UI LOCKS                          │
│ [ ] Add `Access Tier` and `2FA Status` badges to Staff Table.          │
│ [ ] Lock Circle/Division dropdowns based on provisioning officer tier. │
│ [ ] Connect query scoping helper across all module API routes.         │
└────────────────────────────────────────────────────────────────────────┘
```

---
*Document preserved in repository `/docs` directory for engineering and architectural implementation.*
