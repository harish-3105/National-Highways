# Legal Cases & Court Proceedings Management Module — Technical Specification & Architecture

## 1. Executive Summary & Operational Scope

The **Legal Cases & Court Proceedings Management Module** is the enterprise judicial litigation management system for the Tamil Nadu Highways Department. It tracks all legal proceedings, counter affidavits, hearing dates, interim injunctions, compliance deadlines, judgments, adverse outcomes, Government Pleader (GP) opinions, and appeal tracks across all court forums:
- High Court of Judicature at Madras (Principal Seat, Chennai)
- High Court of Judicature at Madras (Madurai Bench)
- Supreme Court of India (SLP / Civil Appeals)
- Subordinate Courts (District Courts, Sub Courts, Munsif Courts)
- Special Tribunals (Land Acquisition Tribunals / LAOP, Arbitration Panels, National Green Tribunal / NGT)

### Core Architectural Workflows
1. **Dynamic Stage-Gated Entry Lifecycle**:
   - **5 Stages for Normal Cases**: *Case Registry & Scope*, *Counter Affidavit (CA)*, *Hearing Schedule & Status*, *Interim Orders & Compliance*, and *Disposal & Appeal Track*.
   - **6 Stages for Appeal Cases**: *Appeal Case Registry*, *Base / Original Case Details*, *Counter Affidavit (CA)*, *Hearing Schedule & Status*, *Interim Orders & Compliance*, and *Disposal & Higher Appeal*.
2. **Strict Stage-Gating & Baseline Identity Mandate**:
   - For **Normal Cases**, Stage 1 (*Case Registry*) is 100% mandatory before advancing or saving.
   - For **Appeal Cases**, both Stage 1 (*Appeal Registry*) and Stage 2 (*Base Case Details*) are fully mandatory baseline stages.
3. **Dedicated Base / Original Case Integration**:
   - Appeal cases feature an optional auto-fill dropdown that searches existing dockets in the database and instantly copies all lower court particulars (Circle, Division, Court, Case Type, Number, Year, Parties, Nature, and Prayer) while keeping them fully editable.
4. **Step-by-Step Cascaded Progressive Visibility**:
   - Strict conditional gating across all stages (CA filing dates, compliance periods, disposal order cascades, and GP opinion appeal initiation).
5. **Zero Fallbacks & Pure Database-Driven Master Data**:
   - 100% of dropdown selections are dynamically loaded from `public.legal_master_config` with zero mock arrays or hardcoded fallback lists.
6. **Native PostgreSQL Column Mapping**:
   - Direct 1:1 persistence without packing structured fields into JSON/JSONB blobs.

---

## 2. Database Architecture & Schema Integrity

All legal cases are persisted in **Supabase PostgreSQL** in `public.legal_cases` and configured via `public.legal_master_config`.

### 2.1 Primary Records Table: `public.legal_cases`

| Column Name | PostgreSQL Type | Nullable / Default | Functional Purpose & Business Rules |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique immutable system identifier for the case docket. |
| `case_classification` | `VARCHAR(50)` | `NOT NULL DEFAULT 'Normal Case'` | Top-level case tier: `'Normal Case'` or `'Appeal Case'`. |
| `appeal_info` | `JSONB` | `NULL` | Appellate forum particulars (Case type, number, court, filing date, limitation, condonation). |
| `case_type` | `VARCHAR(50)` | `NOT NULL` | Case type (e.g. `WP`, `WA`, `CRP`, `OSA`, `SLP`, `OS`, `LAOP`, `EP`). |
| `circle` | `VARCHAR(100)` | `NOT NULL` | Administrative Circle (e.g. Chennai, Madurai, Salem, Coimbatore, Tiruchirappalli). |
| `division` | `VARCHAR(100)` | `NOT NULL` | Division office jurisdiction under the selected Circle. |
| `case_number` | `VARCHAR(100)` | `NOT NULL` | Official case registration number (e.g. `WP 1234/2023`). |
| `case_year` | `VARCHAR(10)` | `NOT NULL` | Strict 4-digit filing year (e.g. `2024`, up to current year). |
| `category` | `VARCHAR(50)` | `NULL DEFAULT NULL` | Legacy field relaxed to NULL in Migration 0027. Removed from UI. |
| `name_of_court` | `VARCHAR(255)` | `NOT NULL` | Judicial forum (e.g. High Court of Madras, Madurai Bench, District Court). |
| `petitioner_names` | `TEXT` | `NOT NULL` | Full names of Petitioner(s) / Appellant(s). |
| `respondent_names` | `TEXT` | `NOT NULL` | Full names of Respondent(s) (Department officials / Government). |
| `case_pertains_to` | `VARCHAR(50)` | `NOT NULL DEFAULT 'GOTN'` | Jurisdiction domain: `'GOTN'`, `'MoRTH'`, `'Both'`, `'NHAI'`. |
| `nature_of_case` | `VARCHAR(100)` | `NOT NULL` | Legal nature (e.g. `Work`, `Tender`, `Land Acquisition`, `Encroachment`, `Service Matters`, `Others`). |
| `specify_nature_of_case`| `TEXT` | `NULL` | Custom descriptive text mandatory when `nature_of_case = 'Others'`. |
| `brief_of_prayer` | `TEXT` | `NOT NULL` | Summary of prayer/pleadings sought before the court. |
| `base_circle` | `VARCHAR(100)` | `NULL` | Administrative Circle of the original lower court case (Appeal Stage 2). |
| `base_division` | `VARCHAR(100)` | `NULL` | Division office of the original lower court case (Appeal Stage 2). |
| `base_court_name` | `VARCHAR(255)` | `NULL` | Lower / Original Court Name (e.g. Madras High Court Single Bench, Sub Court). |
| `base_case_type` | `VARCHAR(100)` | `NULL` | Original Case Type (e.g. `WP`, `OS`, `LAOP`). |
| `base_case_number` | `VARCHAR(100)` | `NULL` | Original Case Registration Number. |
| `base_case_year` | `VARCHAR(10)` | `NULL` | Original Case Filing Year (4 digits). |
| `base_petitioner_names` | `TEXT` | `NULL` | Original Petitioner Name(s). |
| `base_respondent_names` | `TEXT` | `NULL` | Original Respondent Name(s). |
| `base_case_pertains_to` | `VARCHAR(50)` | `NULL` | Original Case Jurisdiction domain (`GOTN`, `MoRTH`, `Both`). |
| `base_nature_of_case` | `VARCHAR(100)` | `NULL` | Original Case Nature of Case. |
| `base_brief_of_prayer` | `TEXT` | `NULL` | Original Case Prayer / Pleadings summary. |
| `linked_base_case_id` | `UUID` | `NULL` | Foreign key referencing original docket in `legal_cases` if linked. |
| `financial_implication` | `VARCHAR(100)` | `NULL` | Numeric currency value (in ₹) representing financial stake or compensation claimed. |
| `present_stage` | `VARCHAR(100)` | `NULL` | Current procedural stage (e.g. `Notice / Admission`, `Counter Affidavit Pending`, `Arguments`, `Disposed`). |
| `current_status` | `VARCHAR(100)` | `NULL` | High-level status (e.g. `Pending`, `Disposed`, `Stay Granted`, `Interim Order`). |
| `ca_required` | `VARCHAR(20)` | `NULL` | Counter Affidavit mandate: `'Yes'`, `'No'`, `'Not Required'`. |
| `ca_filed` | `VARCHAR(30)` | `NULL` | CA filing status: `'Yes'`, `'No'`, `'Under Preparation'`. |
| `ca_due_date` | `DATE` | `NULL` | Target date to file Counter Affidavit. |
| `ca_filed_date` | `DATE` | `NULL` | Actual filing date of CA (conditional on `ca_filed = 'Yes'`). |
| `last_hearing_date` | `DATE` | `NULL` | Date of last appearance ($D \ge D_{\text{filing}}$). |
| `next_hearing_date` | `DATE` | `NULL` | Date of upcoming hearing ($D \ge D_{\text{last\_hearing}}$ and $D \ge D_{\text{filing}}$). |
| `next_listing_purpose`| `VARCHAR(255)` | `NULL` | Listed purpose (e.g. `For Filing Counter`, `For Final Arguments`). |
| `interim_order_direction`| `TEXT` | `NULL` | Operative directions of any interim order / stay. |
| `interim_order_date` | `DATE` | `NULL` | Date of interim order issuance. |
| `compliance_required` | `VARCHAR(20)` | `NULL` | Compliance mandate: `'Yes'`, `'No'`, `'Not Applicable'`. |
| `compliance_period` | `VARCHAR(100)` | `NULL` | Textual duration prescribed by court (e.g. `8 weeks`, `3 months`). |
| `compliance_end_date` | `DATE` | `NULL` | Compliance End Date (CED) deadline. |
| `action_taken_details_for_compliance`| `TEXT` | `NULL` | Action taken by department to implement directions. |
| `compliance_status` | `VARCHAR(50)` | `NULL` | Compliance tracking status (`'Complied'`, `'Pending'`). |
| `final_result` | `VARCHAR(20)` | `NULL` | Concluded / Disposed indicator (`'Yes'`, `'No'`). |
| `final_result_order` | `TEXT` | `NULL` | Final judgment / operative order summary. |
| `final_order_date` | `DATE` | `NULL` | Date of final court order (mandatory when `final_result = 'Yes'`). |
| `adverse_to_department`| `VARCHAR(20)` | `NULL` | Finding outcome: `'Yes'`, `'No'`, `'Neutral'`. |
| `gp_opinion` | `VARCHAR(100)` | `NULL` | Government Pleader legal advice on appeal feasibility. |
| `appeal_filed` | `VARCHAR(30)` | `NULL` | Appeal decision (`'Yes'`, `'No'`, `'Under Proposal'`). |
| `appeal_filed_date` | `DATE` | `NULL` | Date appeal was lodged in appellate forum. |
| `linked_appeal_case_id`| `UUID` | `NULL` | Foreign key referencing generated appeal case. |
| `final_order_remarks` | `TEXT` | `NULL` | Comprehensive closing judgment notes and remarks. |
| `delete_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'ACTIVE'` | Soft delete flag (`'ACTIVE'` / `'DELETED'`). |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last update timestamp. |

---

### 2.2 Master Configuration Table: `public.legal_master_config`

Stores dynamic master items configured by administrators:
```sql
CREATE TABLE public.legal_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    item_value VARCHAR(255) NOT NULL,
    parent_value VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Configured Categories:**
- `circles`: Administrative circles (Chennai, Madurai, Salem, etc.)
- `divisions`: Divisions linked to parent circles via `parent_value`
- `caseTypes`: Case classifications (WP, WA, CRP, OSA, SLP, OS, LAOP, EP)
- `courtNames`: Judicial forums (High Court Principal Bench, Madurai Bench, etc.)
- `casePertainsTo`: Jurisdictions (`GOTN`, `MoRTH`, `Both`, `NHAI`)
- `natureOfCases`: Legal nature (`Work`, `Tender`, `Land Acquisition`, `Encroachment`, `Others`)
- `presentStages`: Court stages (`Notice / Admission`, `Counter Pending`, `Arguments`, `Disposed`)
- `caseStatuses`: Docket statuses (`Pending`, `Disposed`, `Stay Granted`, `Interim Order`)
- `appealCaseTypes`: Appellate types (`Writ Appeal (WA)`, `Special Leave Petition (SLP)`, etc.)
- `appellateCourts`: Appellate forums (`High Court Division Bench`, `Supreme Court of India`)
- `condonationOfDelays`: Condonation statuses (`Pending`, `Allowed / Condoned`, `Dismissed`, `Not Applicable`)
- `gpOpinions`: GP advice (`Opinion Pending`, `Recommended for Appeal`, `Not Recommended for Appeal`, `Not Required`)
- `complianceStatuses`: Compliance states (`Complied`, `Pending`)

---

## 3. Core Business Logic & Step-by-Step Cascades

### 3.1 Appeal Limitation & Delay Calculation Engine
When an Appeal Case is registered:
$$\text{delayDays} = \max\left(0, \left\lfloor \frac{\text{appealFilingDate} - \text{limitationDueDate}}{86,400,000} \right\rfloor\right)$$

- If $\text{appealFilingDate} > \text{limitationDueDate}$:
  - `delayInFilingAppeal` $\leftarrow$ `'Yes'`
  - `delayPeriodDays` $\leftarrow$ calculated days overrun
  - Renders prominent amber alert badge: `⚠️ Appeal Filing Overran Limitation by X Days`
  - Requires mandatory `condonationOfDelay` selection (`Allowed / Condoned`, `Pending`, etc.).
- If $\text{appealFilingDate} \le \text{limitationDueDate}$:
  - `delayInFilingAppeal` $\leftarrow$ `'No'`
  - `delayPeriodDays` $\leftarrow$ `0`

---

### 3.2 Progressive Visibility & Cascading Disclosure Rules

#### Stage 1: Case Registry & Nature of Case
- If `natureOfCase === 'Others'` or `'Other'`:
  - Dynamically displays **Specify Nature of Case** text input.
  - Mandatory field; saves into dedicated column `specify_nature_of_case`.

#### Stage 2: Base / Original Case Details (Appeal Cases Only)
- Top bar contains **Auto-Fill from Existing Case Docket (Optional)**.
- Selecting an existing docket copies:
  - `baseCircle` $\leftarrow$ `matched.circle`
  - `baseDivision` $\leftarrow$ `matched.division`
  - `baseCourtName` $\leftarrow$ `matched.nameOfCourt`
  - `baseCaseType` $\leftarrow$ `matched.caseType`
  - `baseCaseNumber` $\leftarrow$ `matched.caseNumber`
  - `baseCaseYear` $\leftarrow$ `matched.caseYear`
  - `basePetitionerNames` $\leftarrow$ `matched.petitionerNames`
  - `baseRespondentNames` $\leftarrow$ `matched.respondentNames`
  - `baseCasePertainsTo` $\leftarrow$ `matched.casePertainsTo`
  - `baseNatureOfCase` $\leftarrow$ `matched.natureOfCase`
  - `baseBriefOfPrayer` $\leftarrow$ `matched.briefOfPrayer`
  - `linkedBaseCaseId` $\leftarrow$ `matched.id`
- All fields remain fully editable after auto-filling.

#### Stage 3 (or Stage 2 for Normal): Counter Affidavit (CA) & Financial Implication
```
CA Required (Yes / No / Not Required)
   │
   ├── If 'No' or 'Not Required' ──► (Stops CA cascade; reveals Financial Implication)
   │
   └── If 'Yes' ──► Reveals CA Due Date + CA Filed (Yes / No / Under Preparation)
                       │
                       ├── If CA Filed = 'No' / 'Under Preparation' ──► (Stops)
                       │
                       └── If CA Filed = 'Yes' ──► Reveals CA Filed Date
                                                      │
                                                      └──► Financial Implication (in ₹, Numeric)
```

#### Stage 4 (or Stage 3 for Normal): Hearing Schedule & Status
- **Top Row**: `Present Stage` and `Current Status` are placed at the very top.
- **Date Validations**:
  1. $D_{\text{last\_hearing}} \ge D_{\text{filing}}$ (Hearing date cannot precede case filing date).
  2. $D_{\text{next\_hearing}} \ge D_{\text{filing}}$.
  3. $D_{\text{next\_hearing}} \ge D_{\text{last\_hearing}}$ (Next hearing cannot precede last hearing).

#### Stage 5 (or Stage 4 for Normal): Interim Orders & Compliance Track
```
Compliance Required (Yes / No / Not Applicable)
   │
   ├── If 'No' or 'Not Applicable' ──► (Hides all subsequent compliance fields)
   │
   └── If 'Yes' ──► Reveals:
                       1. Compliance Period (Text input, e.g. "8 weeks", "3 months")
                       2. Compliance End Date (CED, Date picker)
                       3. Compliance Status (Dropdown: Complied / Pending)
                       4. Action Taken Details for Compliance (Textarea)
```

#### Stage 6 (or Stage 5 for Normal): Disposal & Appeal Track
```
Case Concluded / Disposed? (Yes / No)
   │
   ├── If 'No' ──► (Hides all subsequent fields)
   │
   └── If 'Yes' ──► Reveals:
                       1. Final Order (Text input)
                       2. Final Order Date (Mandatory Date picker)
                       3. Adverse to Department? (Yes / No / Neutral)
                             │
                             ├── If 'No' or 'Neutral' ──► (Stops cascade)
                             │
                             └── If 'Yes' ──► Reveals ONLY GP Opinion
                                                 │
                                                 ├── If 'Opinion Pending' or 'Not Recommended for Appeal' ──► (Stops)
                                                 │
                                                 └── If 'Recommended for Appeal' OR 'Not Required' ──► Reveals Appeal Filed?
                                                                                                         │
                                                                                                         ├── If 'No' / 'Under Proposal' ──► (Stops)
                                                                                                         │
                                                                                                         └── If 'Yes' ──► Reveals Appeal Filed Date + Final Judgment Summary
```

---

### 3.3 Exact Matching vs Substring Flaw Prevention
In GP Opinion evaluation, `'Not Recommended for Appeal'` contains the substring `'Recommended'`.
To prevent false-positive appeal triggering, the helper function `isAppealRecommended` uses strict exact matching:
```typescript
const isAppealRecommended = (opinion: string | undefined): boolean => {
  if (!opinion) return false;
  const clean = opinion.trim().toLowerCase();
  if (clean.includes('not recommended')) return false;
  return (
    clean === 'recommended for appeal' ||
    clean === 'recommended' ||
    clean === 'not required' ||
    clean === 'fit for appeal'
  );
};
```

---

## 4. Stage-Gated Lifecycle Entry & Progressive Validation

```
NORMAL CASES (5 Stages):
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│         STAGE 1         │──►│         STAGE 2         │──►│         STAGE 3         │──►│         STAGE 4         │──►│         STAGE 5         │
│  Case Registry & Scope  │   │ Counter Affidavit & Fin │   │Hearing Schedule & Status│   │   Interim & Compliance  │   │  Disposal & Appeal Track│
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘

APPEAL CASES (6 Stages):
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│         STAGE 1         │──►│         STAGE 2         │──►│         STAGE 3         │──►│         STAGE 4         │──►│         STAGE 5         │──►│         STAGE 6         │
│  Appeal Case Registry   │   │ Base/Original Case Info │   │ Counter Affidavit & Fin │   │Hearing Schedule & Status│   │   Interim & Compliance  │   │ Disposal & Higher Appeal│
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

### Stage-Gating Invariants:
1. **Mandatory Baseline Stages**:
   - For Normal Cases, Stage 1 is fully mandatory.
   - For Appeal Cases, Stage 1 AND Stage 2 are fully mandatory.
2. **Selective Forward Validation**:
   - Advancing to Stage $N+1$ validates all fields up to Stage $N$.
   - Saving a docket on Stage $N$ validates up to Stage $N$ without blocking on incomplete future stages.
3. **Clean Visual Styling**:
   - Appellate particulars are rendered cleanly matching standard form typography under a clean section header, completely eliminating colored purple boxes or heavy borders.

---

## 5. Dashboard & Litigation Analytics

### 5.1 Real-Time KPI Stat Cards
1. **Total Legal Dockets**: Active litigation cases tracked across all courts.
2. **Counter Affidavit Pending**: Cases where `caRequired === 'Yes'` and `caFiled !== 'Yes'`.
3. **Compliance Action Due**: Cases with active interim orders and `complianceStatus === 'Pending'`.
4. **Disposed & Final Orders**: Total concluded cases, with direct breakdown of **In Favour** vs **Adverse to Department**.

### 5.2 Filter Toolbar & Case Data Table
- **Search Input**: Full-text searching across Case Number, Court, Petitioner, Respondent, and Prayer.
- **Classification Filter**: `All Classifications`, `Normal Case`, `Appeal Case`.
- **Circle & Division Filters**: Cascading geographic jurisdiction filtering.
- **Status Filter**: Real-time filtering by procedural status (`Pending`, `Disposed`, `Stay Granted`, `Interim Order`).
- **CA Status Filter**: `All CA Statuses`, `CA Filed (Yes)`, `CA Pending (No)`.
- **Archived Toggle**: View soft-deleted records for audit compliance.

### 5.3 Quick Actions
- **View Docket**: Opens `CaseViewModal` with dynamic 5/6-stage stepper and print letterhead export.
- **Edit Docket**: Opens `CaseEntryForm` pre-populated with all docket data.
- **Delete Docket**: Opens `DeleteLegalCaseModal` with soft-deletion confirmation.
- **Save & Create Appeal**: Automatically saves a lower court case and opens a new Appeal Case docket with all Base Case particulars pre-filled and linked.

---

## 6. API Route Contracts

### 6.1 `GET /api/legal`
- **Query Params**: `circle`, `division`, `classification`, `status`, `search`, `includeDeleted`.
- **Response**: `{ success: true, cases: LegalCaseData[], totalCount: number }`.

### 6.2 `POST /api/legal`
- **Payload**: `LegalCaseData` JSON.
- **Behavior**:
  - Validates required baseline identity fields.
  - Maps 1:1 to dedicated PostgreSQL columns (`base_circle`, `base_court_name`, `specify_nature_of_case`, `financial_implication`, `compliance_period`, `final_result_order`).
  - Surfaces raw database errors immediately if any SQL violation occurs.
  - Returns `{ success: true, case: LegalCaseData }`.

### 6.3 `DELETE /api/legal?id=<UUID>`
- **Behavior**: Sets `delete_status = 'DELETED'` (soft-delete), preserving historical audit trail.

### 6.4 `GET /api/legal/master-data`
- **Response**: Dynamic master configuration JSON queried directly from `public.legal_master_config`.

### 6.5 `POST /api/legal/master-data`
- **Behavior**: Inserts or updates custom category dropdown item in `public.legal_master_config`.

### 6.6 `DELETE /api/legal/master-data?id=<UUID>`
- **Behavior**: Deletes category configuration item from database.

---

## 7. Mandatory Invariants & Agent Rules Compliance

1. **Strict 1:1 PostgreSQL Column Mapping**: Every structured field is persisted in dedicated native columns. Zero JSON/JSONB packing of relational fields.
2. **Zero Mock Fallbacks**: Master data dropdowns and component initial states are strictly empty (`[]`, `''`, `null`). Zero hardcoded placeholder arrays.
3. **Schema Migration Integrity**: All database alterations are captured in sequential SQL migration files (`0005`, `0023`, `0027`, `0028`).
4. **Error Transparency**: Raw database errors are surfaced directly without silent catching or masking.
