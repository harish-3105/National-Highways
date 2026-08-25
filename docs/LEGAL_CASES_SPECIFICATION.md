# Legal Cases & Court Proceedings Management Module — Technical Specification & Architecture

## 1. Executive Summary & Purpose

The **Legal Cases & Court Proceedings Management Module** is the core judicial litigation tracking engine for the Tamil Nadu Highways Department. It tracks proceedings across all court tiers including the Madras High Court (Principal Seat & Madurai Bench), Subordinate Courts, Special Tribunals, National Green Tribunal (NGT), and the Supreme Court of India.

Key architectural and functional principles:
1. **Dynamic Stage-Gated Entry Lifecycle**: 
   - **5 Stages for Normal Cases**: *Case Registry & Scope*, *Counter Affidavit (CA)*, *Hearing Schedule & Status*, *Interim Orders & Compliance*, and *Disposal & Appeal Track*.
   - **6 Stages for Appeal Cases**: *Appeal Case Registry*, *Base / Original Case Details*, *Counter Affidavit (CA)*, *Hearing Schedule & Status*, *Interim Orders & Compliance*, and *Disposal & Higher Appeal*.
2. **Strict Stage-Gating & Baseline Registry Mandate**: 
   - For Normal cases, Stage 1 is fully mandatory.
   - For Appeal cases, both Stage 1 (Appeal Registry) and Stage 2 (Base Case Details) are fully mandatory baseline stages before advancing or saving.
3. **Dedicated Base / Original Case Integration**: Auto-fill picker allows instant copying from an existing case docket in the database, with full manual override capability.
4. **Dynamic Progressive Field Disclosure**: Strict cascaded visibility driven by judicial logic (Counter Affidavit prerequisites, Compliance action paths, Disposal adverse outcomes, and GP opinion appeal gates).
5. **Zero Fallbacks & Pure Database-Driven Master Data**: 100% of dropdown selections are dynamically loaded from `public.legal_master_config` with zero mock arrays or hardcoded fallback lists.
6. **Native PostgreSQL Column Mapping**: Direct 1:1 persistence without packing structured fields into JSON/JSONB blobs.

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
| `base_circle` | `VARCHAR(100)` | `NULL` | Administrative Circle of the original lower court case. |
| `base_division` | `VARCHAR(100)` | `NULL` | Division office of the original lower court case. |
| `base_court_name` | `VARCHAR(255)` | `NULL` | Lower / Original Court Name (e.g. Madras High Court Single Bench, Sub Court). |
| `base_case_type` | `VARCHAR(100)` | `NULL` | Original Case Type (e.g. `WP`, `OS`, `LAOP`). |
| `base_case_number` | `VARCHAR(100)` | `NULL` | Original Case Registration Number. |
| `base_case_year` | `VARCHAR(10)` | `NULL` | Original Case Filing Year. |
| `base_petitioner_names` | `TEXT` | `NULL` | Original Petitioner Name(s). |
| `base_respondent_names` | `TEXT` | `NULL` | Original Respondent Name(s). |
| `base_case_pertains_to` | `VARCHAR(50)` | `NULL` | Original Case Jurisdiction domain. |
| `base_nature_of_case` | `VARCHAR(100)` | `NULL` | Original Case Nature of Case. |
| `base_brief_of_prayer` | `TEXT` | `NULL` | Original Case Prayer / Pleadings. |
| `linked_base_case_id` | `UUID` | `NULL` | Foreign key referencing original docket in `legal_cases` if linked. |
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

### Normal Cases (5 Stages)
- **Stage 1 (Case Registry & Scope)**: Mandatory circle, division, court, caseType, caseNumber, caseYear, petitionerNames, respondentNames, casePertainsTo, natureOfCase, briefOfPrayer.
- **Stage 2 (Counter Affidavit & Financials)**: `CA Required` &rarr; `CA Due Date` + `CA Filed` &rarr; `CA Filed Date` &rarr; `Financial Implication`.
- **Stage 3 (Hearing Schedule & Status)**: Top row `Present Stage` and `Current Status`, with hearing dates validation ($D_{\text{hearing}} \ge D_{\text{filing}}$).
- **Stage 4 (Interim Orders & Compliance)**: If `Compliance Required = 'Yes'` &rarr; reveals `Compliance Period`, `CED`, `Compliance Status`, `Action Taken`.
- **Stage 5 (Disposal & Appeal Track)**: `Concluded = Yes` &rarr; `Final Order` + `Date` + `Adverse` &rarr; `Adverse = Yes` &rarr; `GP Opinion` &rarr; `Recommended / Not Required` &rarr; `Appeal Filed` &rarr; `Date` + `Remarks`.

### Appeal Cases (6 Stages)
- **Stage 1 (Appeal Case Registry)**: Mandatory appellateCourt, appealCaseType, appealCaseNumber, appealYear, appealFilingDate, limitationDueDate, condonationOfDelay, appeal Circle, Division, Appellants, Respondents, Case Pertains To, Nature of Case, Appeal Prayer.
- **Stage 2 (Base / Original Case Details)**: 
  - Optional quick auto-fill dropdown from existing cases.
  - Mandatory Base Circle, Base Division, Base Court, Base Case Type, Base Case Number, Base Case Year, Base Petitioners, Base Respondents, Base Case Pertains To, Base Nature of Case, Base Brief of Prayer.
- **Stage 3 (Counter Affidavit & Financials)**: Same progressive rules as normal cases.
- **Stage 4 (Hearing Schedule & Status)**: Same hearing schedule rules as normal cases.
- **Stage 5 (Interim Orders & Compliance)**: Same compliance rules as normal cases.
- **Stage 6 (Disposal & Higher Appeal Track)**: Same disposal cascade rules.

---

## 4. API Endpoints

- `GET /api/legal`: Fetch list of legal dockets with filtering by circle, division, classification, status, and search query.
- `POST /api/legal`: Create or update a legal docket with 100% native schema mapping.
- `DELETE /api/legal?id={id}`: Soft-delete docket (`delete_status = 'DELETED'`).
- `GET /api/legal/master-data`: Fetch all dynamic category dropdown options from database.
- `POST /api/legal/master-data`: Add custom category value to master config.
- `DELETE /api/legal/master-data`: Remove custom category value from master config.
