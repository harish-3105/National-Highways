# Pending Client Requests & Future Requirements

> **Note**: This document tracks requirements, features, and constraints requested by stakeholders that are pending client-provided assets (e.g. updated Excel format) or slated for future implementation.

---

## 1. Global System Principle: User vs. Admin ("Creative Mode")

* **Standard Users**: Bound strictly by all business logic, validation rules, monotonic progress checks, field freezing, and rate limits.
* **Admins ("Creative Mode")**: Full override authority across the entire platform. Admins can bypass constraints, edit frozen columns, correct progress values backwards/forwards, bypass rate limits, and perform manual overrides for data corrections.
* **Export Formats (All Modules)**: Replace / prioritize **Excel (.xlsx) and CSV exports** across **all modules** instead of PDF exports.

---

## 2. Ongoing Works Module

### A. Completed Works Tracking & Filtering
* **Completion Definition**: Any work reaching **100% physical progress**.
* **Auto-Hide Behavior**: Once a work reaches 100% completion, it automatically disappears from the default Ongoing Works list/table.
* **"Completed Works" Filter Button**: A dedicated filter button located near the filter bar. When clicked/toggled, it switches the view to display only completed works.
* **KPI Metric Card**: Add a new KPI card specifically for **Completed Works** (displaying count and relevant summary totals).

---

### B. Ingestion & Snapshot/History Tracking Workflow
* **Excel Ingestion (Upsert & Archiving)**:
  * **Existing Work Detected**: Before updating an existing work with incoming Excel data, take a **complete snapshot** of the current state and archive it into a history log, then update the active record in the database.
  * **New Work**: Insert directly into the database as a new record.
* **Comprehensive Audit & Snapshot Logging**:
  * Take and store a full historical snapshot for **every single mutation event** (Excel bulk ingestion, manual addition, manual editing, inline updates).
  * Each snapshot record must capture:
    * Full data payload / state
    * Timestamp of the event
    * Action source (e.g. `EXCEL_UPLOAD`, `MANUAL_EDIT`, `MANUAL_ADD`)
    * User identifier / role

---

### C. Column Immutability & Excel Template Updates
* **Excel Format Update (Waiting on Client)**:
  * Client will provide an updated Excel template with **4 additional columns**.
  * Once provided: update parser, DB schema, TypeScript types, and UI views.
* **Frozen vs. Mutable Columns**:
  * **Frozen Columns (~20 fields)**: Base identity and sanction attributes remain locked/immutable after initial creation during regular user updates.
  * **Mutable Columns (~7 fields)**: Only specific progress and status fields (e.g. Physical %, Financial %, Expenditure, Issues, Remarks, Status) can change across snapshots.

---

### D. Progress Delta Visuals (Section 2)
* **Target Area**: Section 2 in viewing options (**Physical & Financial Progress**).
* **Delta Indicator**: Display the **delta / change in %** (`+X%`) compared to the immediate previous snapshot directly within or next to the Physical & Financial progress bars.
* **Remarks Field**: Add a dedicated **Remarks** field/column specifically within Section 2.

---

### E. Dedicated Snapshot Timeline & Table Page (Chart View)
* **New Dedicated Page / View** (similar in depth to SLD):
* **Trading-Style Line Chart (Time Series)**:
  * **X-Axis**: Time / Snapshot Dates.
  * **Y-Axis**: Progress % / Change in %.
  * **Dual Trendlines**: Plots **Physical Progress (%)** and **Financial Progress (%)** on the same chart for direct correlation.
  * **Data Points & Tooltips**: Interactive markers showing snapshot date, incremental delta %, remarks, and update source.
* **Historical Snapshot Data Grid (Below Chart)**:
  * Clean, scrollable Excel/DB-style table listing all historical snapshots chronologically row-by-row.
  * Displays the mutable columns at each snapshot timestamp to trace evolution over time.

---

### F. New "Issues" Section (Between Section 3 & 4)
* **Location**: Placed between Section 3 and Section 4 in the viewing options.
* **Fields (5 String/Text/Remarks fields)**:
  1. `Land Acquisition`
  2. `Forest`
  3. `Utility`
  4. `Railways`
  5. `Others`

---

### G. Validation Rules & Constraints
* **Monotonic Progress Increase**:
  * Physical Progress (%) and Financial Progress (%) can **only increase or remain unchanged**. Progress cannot decrease from its latest value.
  * Universal constraint enforced on user uploads and edits (Admin exempt).
* **Update Frequency Restriction (Tentative / Exploratory)**:
  * Limit regular user updates to once every 24 hours per work record.
  * *(Flagged for further refinement with client on exact rules).*
