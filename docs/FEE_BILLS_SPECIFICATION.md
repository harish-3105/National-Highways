# Legal & Lawyer Fee Bill Management Module — Technical Specification & Architecture

## 1. Executive Summary & Purpose

The **Legal & Lawyer Fee Bill Management Module** is a dedicated enterprise sub-system within the Tamil Nadu Highways Department portal. It is designed to track the end-to-end lifecycle of legal fee vouchers submitted by Government Pleaders, Senior Advocates, Standing Counsels, and Assistant Law Officers representing the Department across various courts (High Court of Madras, Madurai Bench, Supreme Court, Land Acquisition Tribunals, and Arbitration panels).

Key operational workflows handled by this module:
1. **Stage-Gated Voucher Entry**: 5-stage progressive data entry with real-time validation and non-blocking draft persistence.
2. **Dual-Track Pendency & Movement Tracking**: Explicit separation between **Payment Proposal (PP)** sanction workflows and **Government Order (G.O.)** clearance workflows.
3. **Decoupled Assistant Law Officer Accounting**: Strict independence between Lawyer claims and Assistant Law Officer claims, including separate settlement records, tax deductions, and bank UTRs.
4. **Normalized Dynamic Master Data**: Complete elimination of hardcoded fallback arrays; 100% database-driven configurations.
5. **Direct Native PostgreSQL Persistence**: Zero JSON packing of structured fields; every attribute maps 1:1 to strongly-typed database columns.

---

## 2. Database Architecture & Schema Integrity

All fee bill data is persisted in **Supabase PostgreSQL** across two core tables:

### 2.1 Primary Records Table: `public.fee_bills`

| Field / Column Name | PostgreSQL Type | Nullable / Default | Functional Purpose & Business Rules |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique immutable system identifier for the voucher. |
| `fee_bill_number` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Official bill/voucher reference number. Strict duplicate blocking enforced. |
| `fee_bill_date` | `DATE` | `NOT NULL` | Date stated on the lawyer's bill ($D \le \text{Today}$). |
| `receipt_date` | `DATE` | `NOT NULL` | Date voucher was physically/digitally received in the concerned office ($D \ge \text{fee_bill_date}$ and $D \le \text{Today}$). |
| `circle` | `VARCHAR(100)` | `NOT NULL` | Circle jurisdiction (e.g. Chennai, Madurai, Salem, Coimbatore, Tiruchirappalli). |
| `division` | `VARCHAR(100)` | `NOT NULL` | Division office jurisdiction under the selected circle. |
| `lawyer_name` | `VARCHAR(255)` | `NOT NULL` | Full name of the primary Law Officer / Advocate. |
| `lawyer_designation` | `VARCHAR(100)` | `NOT NULL` | Designation (e.g. Senior Advocate, Additional Advocate General, Government Pleader). |
| `case_pertains_to` | `VARCHAR(50)` | `DEFAULT 'GOTN'` | Jurisdiction domain: `'GOTN'`, `'MoRTH'`, or `'BOTH'`. |
| `case_type` | `VARCHAR(100)` | `NOT NULL` | Classification (e.g. `Writ Petition (WP)`, `Writ Appeal (WA)`, `SLP`, `LAOP`, `Arbitration Case`). |
| `case_number` | `NUMERIC` | `NOT NULL` | Strict numeric case registration number (e.g. `1234`). Non-numeric characters stripped. |
| `case_year` | `INTEGER` | `NOT NULL` | Strict 4-digit filing year (e.g. `2024`, up to current year). |
| `assistant_name` | `VARCHAR(255)` | `NULL` | Full name of the Assistant Law Officer (mandatory if appearance fee is claimed). |
| `assistant_designation`| `VARCHAR(100)` | `NULL` | Designation of the Assistant Law Officer. |
| `appearance_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Claimed appearance fee. Triggers mandatory assistance calculation. |
| `appearance_date` | `DATE` | `NULL` | Date of court appearance ($D \le \text{Today}$). |
| `conference_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Claimed conference / consultation fee. |
| `conference_date` | `DATE` | `NULL` | Date of conference ($D \le \text{Today}$). |
| `verifying_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Claimed drafting / opinion / verifying affidavit fee. |
| `verifying_date` | `DATE` | `NULL` | Date of drafting/opinion ($D \le \text{Today}$). |
| `assistance_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Auto-calculated assistance fee ($\frac{\text{appearance\_amount}}{3}$). |
| `assistance_date` | `DATE` | `NULL` | Date of assistance ($D \le \text{Today}$). |
| `total_fee_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Total combined claim: Lawyer Claim + Assistance Claim. |
| `go_status` | `VARCHAR(50)` | `DEFAULT 'Not Required'` | G.O. requirement flag: `'Yes'`, `'No'`, `'Not Required'`. |
| `status_of_obtaining_go`| `VARCHAR(100)`| `NULL` | Stage in G.O. pipeline (e.g. `Proposal Submitted to CE`, `G.O. Obtained`). |
| `go_number` | `VARCHAR(100)` | `NULL` | Official Government Order number once issued. |
| `go_date` | `DATE` | `NULL` | Date of G.O. issuance ($D \le \text{Today}$). |
| `status_of_payment_proposal`| `VARCHAR(100)`| `NULL` | Inter-office payment sanction stage (e.g. `Proposal Sent from DE to SE`). |
| `proceeding_letter_no`| `VARCHAR(100)` | `NULL` | Reference number of sanction letter or proceeding. |
| `proceeding_letter_date`| `DATE` | `NULL` | Date of proceeding letter ($D \le \text{Today}$). |
| `sanctioned_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Formal sanctioned value approved by competent authority. |
| `is_sanctioned` | `VARCHAR(10)` | `DEFAULT 'No'` | Sanction status flag (`'Yes'` / `'No'`). |
| `payment_status` | `VARCHAR(50)` | `DEFAULT 'Not Settled'` | Overall settlement status (`'Not Settled'` / `'Settled'`). |
| `settled_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Gross amount approved for payment to primary lawyer ($= \text{Net} + \text{TDS}$). |
| `it_cess` | `DECIMAL(12, 2)` | `DEFAULT 0` | Income Tax / TDS deducted from lawyer's settlement. |
| `amount_deposited` | `DECIMAL(12, 2)` | `DEFAULT 0` | Net disbursed amount deposited into lawyer's bank account. |
| `utr_rbi_reference` | `VARCHAR(100)` | `NULL` | Bank UTR / RBI transfer transaction reference for lawyer. |
| `payment_date` | `DATE` | `NULL` | Date of lawyer bank disbursement ($D \le \text{Today}$). |
| `assistant_settled_amount` | `DECIMAL(12, 2)` | `DEFAULT 0` | Gross amount approved for Assistant Law Officer. |
| `assistant_it_cess` | `DECIMAL(12, 2)` | `DEFAULT 0` | Income Tax / TDS deducted from Assistant Law Officer settlement. |
| `assistant_amount_deposited` | `DECIMAL(12, 2)` | `DEFAULT 0` | Net disbursed amount deposited into assistant's bank account. |
| `assistant_utr_rbi_reference` | `VARCHAR(100)` | `NULL` | Bank UTR / RBI transfer reference for assistant disbursement. |
| `assistant_payment_date` | `DATE` | `NULL` | Date of assistant bank disbursement ($D \le \text{Today}$). |
| `assistant_payment_status` | `VARCHAR(50)` | `DEFAULT 'Not Settled'` | Independent settlement status for assistant (`'Not Settled'` / `'Settled'`). |
| `current_pendency` | `VARCHAR(100)` | `DEFAULT 'Pending with DE'` | Consolidated pendency stage string. |
| `delete_status` | `VARCHAR(50)` | `DEFAULT 'ACTIVE'` | Soft-delete state (`'ACTIVE'` vs `'DELETED'`). |
| `created_by` | `VARCHAR(100)` | `DEFAULT 'System Admin'` | Creator identity for audit trail. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record last modification timestamp. |

---

### 2.2 Master Configuration Table: `public.fee_bill_master_items`

Normalized relational table storing all dropdown and pipeline configuration items dynamically managed by administrators:

```sql
CREATE TABLE public.fee_bill_master_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_value VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Categories stored:**
- `circles`: Geographic circle headquarters.
- `divisions`: Executive divisions (linked via `parent_value` to circle).
- `lawyerDesignations`: Permitted senior and junior advocate designations.
- `assistantDesignations`: Permitted assistant counsel designations.
- `caseTypes`: Legal case categories (WP, WA, SLP, LAOP, etc.).
- `casePertainsTo`: Jurisdictions (`GOTN`, `MoRTH`, `BOTH`).
- `paymentStatuses`: Standard payment flags (`Not Settled`, `Settled`).
- `statusOfPaymentProposal`: PP sanction pipeline stages.
- `statusOfObtainingGo`: G.O. clearance pipeline stages.

---

## 3. Fee Calculation & Accounting Decoupling Rules

### 3.1 Fee Computation Formulations

```
1. Lawyer Claim Amount:
   Lawyer_Claim = Appearance_Amount + Conference_Amount + Verifying_Amount
   (Strictly excludes Assistant Fee)

2. Assistance Fee Formula:
   Assistance_Amount = Round(Appearance_Amount / 3, 2)
   (Calculated strictly on Appearance Fee; Conference and Verifying fees are excluded)

3. Total Voucher Claim Amount:
   Total_Claim = Lawyer_Claim + Assistance_Amount
               = Appearance_Amount + Conference_Amount + Verifying_Amount + Assistance_Amount

4. Settlement Reconciliation:
   Lawyer_Settled_Amount = Lawyer_Amount_Deposited + Lawyer_IT_Cess
   Assistant_Settled_Amount = Assistant_Amount_Deposited + Assistant_IT_Cess
```

### 3.2 Co-Dependency Rule (Assistant $\leftrightarrow$ Appearance Fee)
- If an **Assistant Law Officer** is assigned (`hasAssistant === true` or `assistantName` filled) $\rightarrow$ **Appearance Amount is strictly mandatory** ($> ₹0$).
- If an **Appearance Fee is claimed** ($> ₹0$) $\rightarrow$ **Assistant Law Officer** is strictly mandatory.
- The assistant is not entitled to assistance fee without a primary court appearance record.

### 3.3 Decoupled Settlement & Banking Disbursements
The primary advocate and assistant law officer are treated as **separate financial payees**:
1. Lawyer bank transfer requires dedicated `amount_deposited`, `it_cess`, `utr_rbi_reference`, and `payment_date`.
2. Assistant bank transfer requires independent `assistant_amount_deposited`, `assistant_it_cess`, `assistant_utr_rbi_reference`, `assistant_payment_date`, and `assistant_payment_status`.
3. Settling the lawyer does not automatically settle the assistant, and vice-versa.

---

## 4. Stage-Gated Lifecycle Entry & Progressive Validation

The form is partitioned into 5 sequential lifecycle tabs. It follows **Progressive Stage-Gating**:
- **Baseline Drafts**: Completing Tab 1 allows saving an initial voucher draft at any time.
- **Stage Lock**: Moving forward to Tab $N+1$ requires Tab $N$ to be fully valid.
- **Selective Validation**: Clicking "Save Record" on Tab $N$ validates only up to Tab $N$ without blocking on incomplete future tabs.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     STAGE 1     │ ──► │     STAGE 2     │ ──► │     STAGE 3     │ ──► │     STAGE 4     │ ──► │     STAGE 5     │
│ Voucher & Office│     │Law Officer &Case│     │  Fee Breakdown  │     │  G.O. Workflow  │     │Sanction & Settle│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 4.1 Stage 1: Voucher & Office Jurisdiction (Baseline Identity)
- **Fields (in exact visual order)**:
  1. Circle Jurisdiction (`circle`) &mdash; Mandatory dropdown.
  2. Division Jurisdiction (`division`) &mdash; Mandatory dropdown filtered by selected circle.
  3. Fee Bill Number (`feeBillNumber`) &mdash; Mandatory text with real-time duplicate blocking.
  4. Fee Bill Date (`feeBillDate`) &mdash; Mandatory Date ($D \le \text{Today}$).
  5. Date of Receipt in Office (`receiptDate`) &mdash; Mandatory Date ($D \ge \text{feeBillDate}$ and $D \le \text{Today}$).
- **Validation Constraints**: Zero future dates allowed. Duplicate Fee Bill Number is strictly blocked before save.

### 4.2 Stage 2: Law Officer & Case Details
- **Fields (in exact visual order)**:
  1. Lawyer / Advocate Name (`lawyerName`) &mdash; Mandatory text.
  2. Lawyer Designation (`lawyerDesignation`) &mdash; Mandatory dropdown.
  3. Case Pertains To (`casePertainsTo`) &mdash; Mandatory dropdown (`GOTN` / `MoRTH` / `BOTH`).
  4. Case Type (`caseType`) &mdash; Mandatory dropdown (`WP`, `WA`, `SLP`, etc.).
  5. Case Number (`caseNumber`) &mdash; Mandatory numeric input (only digits permitted).
  6. Case Year (`caseYear`) &mdash; Mandatory numeric 4-digit input (between `1900` and current year).
  7. Assistant Law Officer Toggle (`hasAssistant`) &mdash; Optional checkbox.
  8. Assistant Law Officer Name (`assistantName`) & Designation (`assistantDesignation`).

### 4.3 Stage 3: Fee Breakdown & Assistance Calculation
- **Fields**:
  - Appearance Fee (`appearanceAmount`) & Date (`appearanceDate`).
  - Conference Fee (`conferenceAmount`) & Date (`conferenceDate`).
  - Opinion / Vetting Fee (`verifyingAmount`) & Date (`verifyingDate`).
  - Auto-calculated Assistance Fee (`assistanceAmount`) & Date (`assistanceDate`).
  - Live summary card displaying Lawyer Claim, Assistant Claim, and Total Claim.

### 4.4 Stage 4: Government Order (G.O.) Workflow
- **Fields**:
  - G.O. Status (`goStatus`): `Yes` / `No` / `Not Required`.
  - When `Yes`: Status of Obtaining G.O. (`statusOfObtainingGo`), G.O. Number (`goNumber`), G.O. Date (`goDate`).

### 4.5 Stage 5: Payment Proposal Sanction & Settlement
- **Fields (in exact visual order)**:
  1. Payment Status (`paymentStatus`): `Not Settled` / `Settled`.
  2. Status of Payment Proposal (`statusOfPaymentProposal`): Dropdown representing current inter-office desk.
  3. Conditional Proposal Details (when Unsettled): Reference Letter Number & Date, Sanctioned Amount, Proceeding Letter Number & Date.
  4. Conditional Lawyer Settlement Details (when `Settled`): Amount Deposited, IT Cess, UTR / RBI Reference, Payment Date.
  5. Conditional Assistant Settlement Details: Assistant Amount Deposited, Assistant IT Cess, Assistant UTR, Assistant Payment Date, Assistant Payment Status.

---

## 5. Pendency Tracker & Pipelines Architecture

The **Fee Bill Pendency Tracker** separates claims into two independent pipelines with clean, non-jargon technical headers (max 4 words):

### 5.1 Payment Proposal Pipeline (`Payment Proposal Pipeline`)
Tracks movement across hierarchical approval stages:
1. `Pending with DE` (Division Engineer)
2. `Proposal Sent from DE to SE` (Superintending Engineer)
3. `Proposal Sent from SE to CE` (Chief Engineer)
4. `Proposal Sent from CE to MoRTH` / `Proposal Sent from CE to Government`
5. `Proposal Under Preparation`
6. `Proposal Submitted to CE`
7. `Sanction Order Awaited`
8. `Payment Sanction`

### 5.2 Government Order Pipeline (`Government Order Pipeline`)
Tracks legal clearance sanctions:
1. `Proposal Submitted to CE`
2. `Proposal Submitted to Government`
3. `Draft G.O. Under Scrutiny`
4. `Clarification Sought`
5. `G.O. Obtained`

---

## 6. API Route Contracts

### 6.1 `GET /api/fee-bills`
- **Query Params**: `search`, `circle`, `division`, `paymentStatus`, `pendencyStatus`, `includeDeleted`.
- **Response**: `{ success: true, feeBills: FeeBillRecord[], totalCount: number }`.

### 6.2 `POST /api/fee-bills`
- **Payload**: `FeeBillRecord` JSON.
- **Behavior**:
  - Checks duplicate `fee_bill_number` (returns `409 Conflict` if collision found).
  - Validates numeric `case_number` and `case_year`.
  - Maps fields 1:1 to native PostgreSQL columns.
  - Returns `{ success: true, feeBill: FeeBillRecord }`.

### 6.3 `DELETE /api/fee-bills?id=<UUID>`
- **Behavior**: Sets `delete_status = 'DELETED'` (soft-delete). Preserved for audit trail and restorable via "Show Archived".

### 6.4 `GET /api/fee-bills/master-data`
- **Response**: `{ success: true, masterData: FeeBillMasterDataConfig }` queried directly from `public.fee_bill_master_items`.

### 6.5 `POST /api/fee-bills/master-data`
- **Actions**: Granular `add`, `update`, `delete`, or full sync. Writes directly to `public.fee_bill_master_items`.

---

## 7. Mandatory Development & Invariant Rules

1. **Strict 1:1 Column Mapping**: Never bundle structured relational fields into JSONB or arbitrary objects. Always write native PostgreSQL migrations.
2. **Zero Mock Fallbacks**: Default states in components and routes must strictly be empty (`[]`, `''`, `0`, `null`).
3. **No Future Dates**: All date pickers must enforce $D \le \text{Today}$.
4. **Strict Duplicate Blocking**: No two active records may share the same `fee_bill_number`.
5. **No Grey Placeholders**: In accordance with user rules, zero placeholder suggestions across all forms.
