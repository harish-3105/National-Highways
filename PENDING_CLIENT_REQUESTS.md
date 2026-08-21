# Pending Client Requests & Future Requirements Alignment Log

> **Project**: Tamil Nadu National Highways Department Management System  
> **Status**: Active Working Specification & Implementation Blueprint  
> **Last Updated**: August 21, 2026

---

## 1. Global System Principle: Standard User vs. Admin ("Creative Mode")

* **Standard Users**: Bound strictly by all business logic, monotonic progress constraints, write-once field freezing, and rate limits.
* **Admins ("Creative Mode")**: Full override authority across the entire platform. Admins can bypass constraints, edit filled frozen columns, correct progress values backwards/forwards, bypass rate limits, and perform manual overrides for data corrections.
* **Export Formats (All Modules)**: Standardized **Excel (.xlsx) and CSV exports** across all modules instead of legacy PDF exports.

---

## 2. Ongoing Works Module Specifications

### A. Completed Works Tracking & Filtering
* **Completion Definition**: Any work reaching **100% physical progress**.
* **Auto-Hide Behavior**: Once a work reaches 100% physical progress, it automatically disappears from the default Ongoing Works list/table.
* **"Completed Works" Filter Button**: A dedicated filter button / pill located on the toolbar (`Active Works` vs `Completed Works` vs `All Works`).
* **KPI Metric Card**: A dedicated KPI summary card specifically for **Completed Works** (displaying completed count and total completed project value in Cr).

---

### B. Ingestion & Snapshot / Historical Audit Engine
* **Automated State Snapshotting**:
  * Take and store a complete historical snapshot in `major_projects_snapshots` for **every single mutation event**:
    * Bulk Excel ingestion updates (`EXCEL_UPLOAD`)
    * Manual additions (`MANUAL_ADD`)
    * Manual edits (`MANUAL_EDIT`)
    * Inline table corrections (`INLINE_EDIT`)
  * Each snapshot record captures:
    * `project_id` (foreign key)
    * Full JSON data payload / state snapshot
    * Snapshot timestamp (`snapshot_date` / `created_at`)
    * Action source (`action_source`)
    * Physical progress % & financial progress %
    * Recorded progress remarks & clearance issues
    * User identifier / role

---

### C. 35-Column Standardized Excel Layout & 11 New Fields
The departmental Excel template is standardized to **35 columns (Columns A to AI)** matching the app's database schema:

| Col | Excel Letter | Field Name / Header | Schema Key | Type |
|---|---|---|---|---|
| 1 | **A** | Sl. No. | `s_no` | Integer |
| 2 | **B** | Name of the project | `name_of_work` | Text |
| 3 | **C** | PMIS/ OCMS/ PMG Id | `pmis_id` | Text |
| 4 | **D** | Old NH / New No. | `old_new_nh` | Text |
| 5 | **E** | Annual Plan (FY) | `scheme` | Text |
| 6 | **F** | Length in km | `length_km` | Numeric(10,3) |
| 7 | **G** | Job No. | `job_no` | Text |
| 8 | **H** | Date of Sanction / Revision | `sanction_date` | Text |
| 9 | **I** | TPC Rs.in Crore | `project_cost_cr` | Numeric(12,2) |
| 10 | **J** | Date of Loa *(New)* | `loa_date` | Text |
| 11 | **K** | Date of Agreement *(New)* | `agreement_date` | Text |
| 12 | **L** | Contract Value *(New)* | `contract_value_cr` | Numeric(12,2) |
| 13 | **M** | Date of Handing over of site *(New)* | `site_handover_date` | Text |
| 14 | **N** | Date of Start/ Appointed Date | `appointed_date` | Text |
| 15 | **O** | Completed Length till 31.03.2026 | `completed_length_prior_km` | Numeric(10,3) |
| 16 | **P** | Completed length in 2026-27 | `completed_length_current_fy_km` | Numeric(10,3) |
| 17 | **Q** | Total Completed Length (km) | `total_completed_length_km` | Numeric(10,3) |
| 18 | **R** | Cumm. phy. Prog. (%) | `progress_percent` | Numeric(5,2) |
| 19 | **S** | Revised cost / Anticipated cost in Cr. | `revised_cost_cr` | Numeric(12,2) |
| 20 | **T** | Increase in cost due to RCE | `cost_increase_rce_cr` | Numeric(12,2) |
| 21 | **U** | Expenditure upto 31-03-2026 in Cr. | `expenditure_prior_cr` | Numeric(12,2) |
| 22 | **V** | Expenditure in Cr. 2026-27 | `expenditure_current_fy_cr` | Numeric(12,2) |
| 23 | **W** | Cumm. Fin. Prog. Cr | `cumm_financial_expenditure_cr` | Numeric(12,2) |
| 24 | **X** | Cumulative expenditure of Contract value *(New)* | `contract_cum_expenditure_cr` | Numeric(12,2) |
| 25 | **Y** | Likely date of completion | `likely_completion_date` | Text |
| 26 | **Z** | Scheduled date of completion | `scheduled_completion_date` | Text |
| 27 | **AA** | Likely/ Actual date of completion | `probable_completion_date` | Text |
| 28 | **AB** | Time over run in years | `time_overrun_years` | Numeric(5,2) |
| 29 | **AC** | EOT Granted Till | `eot_granted_till` | Text |
| 30 | **AD** | Further EOT Proposal with the Agency | `eot_proposal_agency` | Text |
| 31 | **AE** | COS | `cos_details` | Text |
| 32 | **AF** | Divisional Engineer Name / PH no. | `de_name_phone` | Text |
| 33 | **AG** | Contractor | `contractor_name` | Text |
| 34 | **AH** | Detailed Stage (Col 27) | `detailed_stage_status` | Text |
| 35 | **AI** | Updated Division & Date | `updated_division_date` | Text |

**Dedicated Platform & Issue Bottleneck Fields (6 Additional Columns)**:
* `progress_remarks` — Dedicated progress remarks *(Section 2)*
* `issue_land` — Land Acquisition issues & status *(Section 4)*
* `issue_forest` — Forest clearance bottlenecks *(Section 4)*
* `issue_utility` — Utility shifting (TANGEDCO / Water / EB) *(Section 4)*
* `issue_railways` — Railways / ROB / RUB clearances *(Section 4)*
* `issue_others` — Other clearance / inter-departmental remarks *(Section 4)*

---

### D. "Write-Once / Freeze-When-Filled" Rule (Columns A to N & Column Z)
* **Progressive / Relaxed Entry**:
  * Remove strict mandatory constraints across the entry form (only **`Name of Work`** is required to initialize/draft a project record).
  * Field engineers can enter whatever partial data is available at that stage of the project lifecycle.
* **Freeze-When-Filled Rule**:
  * **When Blank (`null` / empty)**: Standard users can enter and save a value into any frozen column (A–N, Z) at any point in time.
  * **When Filled (has existing data)**: The field immediately **locks / freezes** for standard users (cannot be edited via form or overwritten by Excel bulk upload).
  * **Admin ("Creative Mode")**: Retains full authority to edit or correct frozen fields at any time.

---

### E. Progress Delta Visuals (Section 2)
* Display the **delta change in %** (`+X%`) compared to the immediate previous snapshot directly within or next to the Physical & Financial progress bars.
* Display dedicated `progress_remarks` within Section 2.

---

### F. Dedicated Historical Snapshot Timeline & Chart View
* **Trading-Style Time-Series Line Chart**:
  * **X-Axis**: Snapshot dates chronologically.
  * **Y-Axis**: Progress Percentage (0% to 100%).
  * **Dual Trendlines**: Physical Progress (%) vs. Financial Progress (%) with interactive hover tooltips (showing delta %, update source, and remarks).
* **Chronological Snapshot History Grid**:
  * Clean, scrollable table listing every historical snapshot, capture timestamp, mutation source, progress deltas, and issue notes.

---

### G. Validation Rules
* **Monotonic Progress Increase**:
  * Physical Progress (%) and Financial Progress (%) can **only increase or remain unchanged** compared to the latest recorded snapshot value (unless overridden by an Admin in Creative Mode).
