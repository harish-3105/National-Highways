# Production Security Hardening Plan

This document outlines the step-by-step implementation plan to resolve all 6 identified security vulnerabilities prior to statewide production rollout.

---

## 📋 Hardening Tasks Overview

| # | Vulnerability | Severity | Target Files | Solution Summary |
| :-: | :--- | :-: | :--- | :--- |
| **1** | Wide-open Supabase Anon RLS | 🔴 **CRITICAL** | `supabase/migrations/0047_lockdown_anon_rls_policies.sql`, `src/lib/supabase/` | Lock down `anon` public access in PostgreSQL; enforce `SERVICE_ROLE_KEY` across all backend routes |
| **2** | Hardcoded Fallback JWT Secret | 🔴 **CRITICAL** | `src/lib/auth/session.ts` | Remove hardcoded fallback string; require `AUTH_SECRET` in environment |
| **3** | Stateless JWT Deactivation Lag | 🟡 **MEDIUM** | `src/lib/auth/session.ts`, `src/app/api/auth/me/route.ts` | Real-time `is_active` validation to instantly invalidate deactivated sessions |
| **4** | Missing TOTP Rate Limiting | 🟡 **MEDIUM** | `src/app/api/auth/verify-totp/route.ts`, `supabase/migrations/0047_...` | 5-attempt brute-force protection with 15-minute temporary lockout |
| **5** | Phone String Sanitization | 🟡 **MEDIUM** | `src/app/api/auth/identify/route.ts`, `src/app/api/auth/verify-totp/route.ts` | Strict regex `/^[6-9]\d{9}$/` validation and parameterized `.eq()` queries |
| **6** | Excel Formula Injection (CSV/XLSX) | 🟡 **MEDIUM** | `src/lib/export/serverExcelBuilder.ts` | Sanitize leading `=`, `+`, `-`, `@` characters in export cells |

---

## 🛠️ Detailed Implementation Plan

---

### Task 1: Supabase Anon RLS Lockdown & Service Role Key Enforcement
* **Target Files**:
  * `supabase/migrations/0047_lockdown_anon_rls_policies.sql`
  * `src/lib/supabase/server.ts`
* **Changes**:
  1. **Migration 0047**: Drop all permissive `FOR ALL USING (true)` policies for the `anon` role. Replace with strict deny-by-default or read-only public policies where appropriate.
  2. **Server Client**: Ensure `src/lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` for all internal server-side operations, ensuring that the browser's `anon` key cannot directly query or mutate PostgreSQL tables via PostgREST.

---

### Task 2: Remove Hardcoded Fallback JWT Secret
* **Target Files**:
  * `src/lib/auth/session.ts`
* **Changes**:
  1. Replace the hardcoded string fallback with a strict environment validator `getSessionSecret()`.
  2. In production (`NODE_ENV === 'production'`), throw a fatal configuration error if `process.env.AUTH_SECRET` is missing or shorter than 32 characters.
  3. In development, emit a prominent warning in stderr.

---

### Task 3: Real-Time Account Deactivation Check
* **Target Files**:
  * `src/app/api/auth/me/route.ts`
  * `src/lib/auth/permissions.ts`
* **Changes**:
  1. In `/api/auth/me`, verify that `user_profiles.is_active === true`. If the user has been deactivated in the database, clear the session cookie (`clearSessionCookie()`) and return `401 Unauthorized`.
  2. In `canPerformAction`, ensure that inactive accounts (`is_active === false`) are immediately blocked from executing any operations.

---

### Task 4: TOTP Rate Limiting & 5-Attempt Lockout
* **Target Files**:
  * `src/app/api/auth/verify-totp/route.ts`
  * `supabase/migrations/0047_lockdown_anon_rls_policies.sql` (adding `failed_totp_attempts` and `totp_locked_until` columns to `user_profiles`)
* **Changes**:
  1. Add columns to `user_profiles`:
     * `failed_totp_attempts INTEGER NOT NULL DEFAULT 0`
     * `totp_locked_until TIMESTAMPTZ DEFAULT NULL`
  2. On each failed 6-digit code entry:
     * Increment `failed_totp_attempts`.
     * If attempts reach 5, set `totp_locked_until = NOW() + INTERVAL '15 minutes'`.
  3. If an account is locked, return HTTP 429 / 403 with the remaining lockout duration.
  4. On successful verification, reset `failed_totp_attempts = 0` and clear `totp_locked_until`.

---

### Task 5: Strict Phone Number Regex & PostgREST Query Sanitization
* **Target Files**:
  * `src/app/api/auth/identify/route.ts`
  * `src/app/api/auth/verify-totp/route.ts`
* **Changes**:
  1. Enforce strict Indian mobile number regex `/^[6-9]\d{9}$/` on the extracted 10-digit number.
  2. Reject any input containing non-numeric characters before executing database queries.
  3. Replace string-concatenated `.or(...)` filter strings with exact `.eq('phone_number', tenDigitPhone)` queries.

---

### Task 6: Excel Formula Injection Protection (CSV / XLSX)
* **Target Files**:
  * `src/lib/export/serverExcelBuilder.ts`
* **Changes**:
  1. Implement a cell sanitizer `sanitizeExcelCellValue(val)` that detects if string values start with formula trigger characters (`=`, `+`, `-`, `@`).
  2. If detected, prepend an apostrophe `'` so spreadsheet applications treat the content as literal text rather than executable formulas.
  3. Apply across all workbook generators in `serverExcelBuilder.ts`.

---

## 🔍 Verification & Acceptance Criteria

1. **Direct PostgREST API Test**: Attempt to mutate `user_profiles` directly via Supabase Anon REST API &rarr; Request must be rejected with 401/403.
2. **Missing `AUTH_SECRET` Test**: Run server without `AUTH_SECRET` in production &rarr; Server must halt with fatal configuration error.
3. **Deactivation Test**: Deactivate a user profile in DB &rarr; Active browser session must be instantly logged out on next request.
4. **Brute-Force Test**: Submit 5 wrong TOTP codes consecutively &rarr; Endpoint must return 15-minute lockout error.
5. **Phone Injection Test**: Submit malformed phone strings (`9876543210,phone_number.eq.123`) &rarr; Endpoint must return 400 Bad Request.
6. **Formula Injection Test**: Export a record containing `=SUM(1,2)` &rarr; Verify cell starts with `'` and does not execute as formula in Excel.
