# Legal Cases & Court Proceedings Management Module — Technical Specification & Architecture

## 1. Executive Summary & Purpose

The **Legal Cases & Court Proceedings Management Module** is the core judicial litigation tracking engine for the Tamil Nadu Highways Department. It tracks proceedings across all court tiers including the Madras High Court (Principal Seat & Madurai Bench), Subordinate Courts, Special Tribunals, National Green Tribunal (NGT), and the Supreme Court of India.

Key architectural and functional principles:
1. **5-Stage Progressive Entry Lifecycle**: Structured progression through *Case Registry & Scope*, *Counter Affidavit (CA)*, *Hearing Schedule & Status*, *Interim Orders & Compliance*, and *Disposal & Appeal Track*.
2. **Strict Stage-Gating & Baseline Registry Mandate**: Stage 1 contains foundational identity fields and is 100% mandatory. Moving past Stage 1 or saving any case requires complete Stage 1 completion.
3. **Dynamic Progressive Field Disclosure**: Strict cascaded visibility driven by judicial logic (e.g. Counter Affidavit prerequisites, Compliance action paths, Disposal adverse outcomes, and GP opinion appeal gates).
4. **Zero Fallbacks & Pure Database-Driven Master Data**: 100% of dropdown selections are dynamically loaded from `public.legal_master_config` with zero mock arrays or hardcoded fallback lists.
5. **Native PostgreSQL Column Mapping**: Direct 1:1 persistence without packing structured fields into JSON/JSONB blobs.

---

## 2. Database Architecture & Schema Integrity

All legal cases are persisted in **Supabase PostgreSQL** within `public.legal_cases` and configured via `public.legal_master_config`.

### 2.1 Primary Records Table: `public.legal_cases`

| Column Name | PostgreSQL Type | Nullable / Default | Functional Purpose & Business Rules |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique immutable system identifier for the case docket. |
| `case_classification` | `VARCHAR(50)` | `NOT NULL DEFAULT 'Normal Case'` | Top-level tier: `'Normal Case'` or `'Appeal Case'`. |
| `appeal_info` | `JSONB` | `NULL` | Appellate forum particulars (Case type, number, court, limitation, condonation). |
| `case_type` | `VARCHAR(50)` | `NOT NULL` | Case type (e.g. `WP`, `WA`, `CRP`, `OSA`, `SLP`, `OS`, `LAOP`, `EP`). |
| `circle` | `VARCHAR(100)` | `NOT NULL` | Administrative Circle (e.g. Chennai, Madurai, Salem, Coimbatore). |
| `division` | `VARCHAR(100)` | `NOT NULL` | Division office jurisdiction under the selected Circle. |
| `case_number` | `VARCHAR(100)` | `NOT NULL` | Official case registration number (e.g. `WP 1234/2023`). |
| `case_year` | `VARCHAR(10)` | `NOT NULL` | 4-digit filing year (e.g. `2024`, up to current year). |
| `category` | `VARCHAR(50)` | `NULL DEFAULT NULL` | Legacy field relaxed to NULL in Migration 0027. |
| `name_of_court` | `VARCHAR(255)` | `NOT NULL` | Judicial forum (e.g. High Court of Madras, Madurai Bench, District Court). |
| `petitioner_names` | `TEXT` | `NOT NULL` | Full names of Petitioner(s) / Appellant(s). |
| `respondent_names` | `TEXT` | `NOT NULL` | Full names of Respondent(s) (Department officials / Government). |
| `case_pertains_to` | `VARCHAR(50)` | `NOT NULL DEFAULT 'GOTN'` | Jurisdiction domain: `'GOTN'`, `'MoRTH'`, `'Both'`, `'NHAI'`. |
| `nature_of_case` | `VARCHAR(100)` | `NOT NULL` | Legal nature (e.g. `Work`, `Tender`, `Land Acquisition`, `Encroachment`, `Others`). |
| `specify_nature_of_case`| `TEXT` | `NULL` | Custom descriptive text mandatory when `nature_of_case = 'Others'`. |
| `brief_of_prayer` | `TEXT` | `NOT NULL` | Summary of prayer/pleadings sought before the court. |
| `financial_implication` | `VARCHAR(100)` | `NULL` | Numeric currency value (in ₹) representing financial stake or compensation claimed. |
| `present_stage` | `VARCHAR(100)` | `NULL` | Current procedural stage (e.g. `Notice / Admission`, `Counter Affidavit Pending`, `Final Arguments`). |
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
| `final_order_remarks` | `TEXT` | `NULL` | Comprehensive closing judgment notes and remarks. |
| `delete_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'ACTIVE'` | Soft delete flag (`'ACTIVE'` / `'DELETED'`). |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last update timestamp. |

---

## 3. Progressive Validation & Cascading Business Logic

### Stage 1: Case Registry & Scope (Fully Mandatory)
- Visual Container: Rendered cleanly with standard form styling and a subtle section header without colored purple boxes.
- Removed Fields: `Appeal Level` and `Category` completely removed.
- Condition for "Others": When `natureOfCase = 'Others'` (or `'Other'`), `specifyNatureOfCase` text input becomes visible and mandatory.
- Blocking Gate: Next stage navigation and docket persistence are strictly blocked until all Stage 1 fields are filled.

### Stage 2: Counter Affidavit & Financial Implication
- Starts with `CA Required` (`'Yes'`, `'No'`, `'Not Required'`).
- If `CA Required = 'Yes'` &rarr; reveal `CA Due Date` and `CA Filed` (`'Yes'`, `'No'`, `'Under Preparation'`).
- If `CA Filed = 'Yes'` &rarr; reveal `CA Filed Date`.
- Numeric `Financial Implication (₹)` is positioned directly after `CA Filed Date`.

### Stage 3: Hearing Schedule & Status
- `Present Stage` and `Current Status` are positioned at the very top of Tab 3.
- Date Validation: Hearing dates (`lastHearingDate`, `nextHearingDate`) must be on or after the Filing Date ($D_{\text{hearing}} \ge D_{\text{filing}}$) and `nextHearingDate` $\ge$ `lastHearingDate`.

### Stage 4: Interim Orders & Compliance
- Starts with `Interim Order Direction`, `Interim Order Date`, and `Compliance Required`.
- If `Compliance Required = 'No'` or `'Not Applicable'` &rarr; hide all further compliance fields.
- If `Compliance Required = 'Yes'` &rarr; reveal `Compliance Period (Text)`, `Compliance End Date (CED)`, `Compliance Status`, and `Action Taken Details for Compliance`.

### Stage 5: Disposal & Appeal Track
- Starts with `Case Concluded / Disposed?` (`'Yes'`, `'No'`).
- If `'No'` &rarr; hide all subsequent fields.
- If `'Yes'` &rarr; reveal:
  1. `Final Order` (text field)
  2. `Final Order Date` (mandatory)
  3. `Adverse to Department?` (`'Yes'`, `'No'`, `'Neutral'`)
- If `Adverse to Department? = 'Yes'` &rarr; reveal ONLY `GP Opinion` (`'Opinion Pending'`, `'Recommended for Appeal'`, `'Not Recommended for Appeal'`, `'Not Required'`).
- If `GP Opinion` is `'Recommended for Appeal'` (exact match, excluding 'Not Recommended') OR `'Not Required'` &rarr; reveal `Appeal Filed?` (`'Yes'`, `'No'`, `'Under Proposal'`).
- If `Appeal Filed? = 'Yes'` &rarr; reveal `Appeal Filed Date` and `Final Judgment Summary & Remarks`.

---

## 4. API Endpoints

- `GET /api/legal`: Fetch list of legal dockets with filtering by circle, division, classification, status, and search query.
- `POST /api/legal`: Create or update a legal docket with 100% native schema mapping.
- `DELETE /api/legal?id={id}`: Soft-delete docket (`delete_status = 'DELETED'`).
- `GET /api/legal/master-data`: Fetch all dynamic category dropdown options from database.
- `POST /api/legal/master-data`: Add custom category value to master config.
- `DELETE /api/legal/master-data`: Remove custom category value from master config.
