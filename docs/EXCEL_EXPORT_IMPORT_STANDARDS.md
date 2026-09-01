# Excel Export & Import Design Standards & Specification

## 1. Overview & Objective
This specification defines the universal spreadsheet formatting, styling, alignment, and column mapping standards for all 6 modules across the Tamil Nadu National Highways platform.

All modules share a unified, symmetrical schema-driven architecture:
* **Exporting Data**: Dumps database records with decorated headers, custom alignments, and auto-adjusted column dimensions.
* **Import Template**: The official import template is an empty export (0 data rows) containing the exact canonical header row.
* **Importing Data**: Consumes spreadsheets following this template, mapping headers 1:1 back to strongly-typed PostgreSQL columns.

---

## 2. Universal Visual & Formatting Patterns

### 2.1 Header Styling
* **Header Background Color**: Single unified **Pastel Cream** (`#FFF2CC`) across all column headers.
* **Header Font**: `Arial` or `Calibri`, **Bold**, 11pt, Dark Slate text (`#1E293B` / `#000000`).
* **Header Alignment**: Centered horizontally (`horizontal: 'center'`) and vertically (`vertical: 'middle'`), with text wrap enabled (`wrapText: true`).
* **Header Row Height**: Minimum 28pt to accommodate multi-line wrapped titles cleanly.
* **Freeze Panes**: Row 1 (Header row) is permanently frozen so it remains visible upon vertical scrolling.
* **Auto-Filter**: Enabled across the entire header range (`A1:N1`).

### 2.2 Data Rows Alignment & Number Formatting Rules

| Data Category | Examples / Fields | Horizontal Alignment | Vertical Alignment | Number Format / Presentation |
| :--- | :--- | :---: | :---: | :--- |
| **Serial Numbers & IDs** | `Sl. No.`, `ID`, `PMIS ID` | **Center** | Middle | `0` (Whole integer) |
| **Codes & References** | `Job No.`, `Road Code (NH-181)`, `Old/New NH` | **Center** | Middle | Text string |
| **Financial Years & Dates** | `Annual Plan (FY)`, `AS Date`, `Agreement Date` | **Center** | Middle | `YYYY-MM-DD` or `DD-MM-YYYY` |
| **Work Titles & Descriptions** | `Name of Project`, `Stretch Name`, `Scope` | **Left** | Middle | Text with `wrapText: true` |
| **Divisions, Circles & Names** | `Division`, `Circle`, `Contractor Name`, `DE Name` | **Left** | Middle | Text string |
| **Financials (₹ Cr / Lakhs)** | `TPC`, `Contract Value`, `Expenditure`, `AS Amount` | **Right** | Middle | `#,##0.00` |
| **Engineering Measurements** | `Length in km`, `From/To Chainage` | **Right** | Middle | `#,##0.000` or `#,##0.00` |
| **Counts & Traffic Volumes** | `PCU Count`, `No. of Contracts`, `Vehicles/day` | **Right** | Middle | `#,##0` |
| **Percentages** | `Cumulative Physical %`, `Financial %` | **Right** | Middle | `0.0%` |
| **Remarks & Status Notes** | `Clearance Issues`, `Delay Remarks`, `Stage` | **Left** | Middle | Text with `wrapText: true` |

### 2.3 Cell Dimensions & Auto-Fit Rules
* **Auto-calculated Widths**: Minimum width = `max(headerLength, maxCellContentLength) + 4` padding characters.
* **Column Bounds**:
  * Fixed Narrow (IDs, S.No, FY, Codes): `8` to `16` characters.
  * Measures & Financials: `14` to `20` characters.
  * Descriptions & Project Names: `45` to `65` characters.
* **Cell Borders**: Thin soft gray border (`#CBD5E1`) around every cell (header and data).

---

## 3. Universal Row & Column Export Controls (UX Specification)

Every module's export trigger opens a standardized `<ExportDataModal />` providing:
1. **Row Scope Selection**:
   * `All Records` (Total database / module count)
   * `Filtered List` (Records matching current active search, division, scheme, or status filters)
   * `Selected / Checked Rows` (Only rows manually ticked in the table view)
2. **Column Scope Selection**:
   * Checkbox list of all available columns with grouped categories.
   * `Select All` and `Reset Defaults` quick action buttons.
3. **Format Selection**:
   * `Excel Workbook (.xlsx)` (Full styling, cream header, alignments, auto-widths)
   * `CSV Document (.csv)` (Plain-text standard format)

---

## 4. Module Symmetrical Pipeline Architecture

```
+-------------------------------------------------------------+
|               Module Column Schema Definition               |
|  (Key, Header Label, Category, DataType, Align, Default)   |
+-------------------------------------------------------------+
               /                              \
              /                                \
             v                                  v
+------------------------+          +------------------------+
|      EXCEL EXPORT      |          |      EXCEL IMPORT      |
|                        |          |                        |
| • Apply Cream Headers  |          | • Validate Header Row  |
| • Justify values       |          | • Row-by-Row Parse     |
| • Auto-fit widths      |          | • Type Validation      |
| • Stream .xlsx / .csv  |          | • Direct DB Mutation   |
+------------------------+          +------------------------+
             |                                  ^
             v                                  |
     +---------------+                          |
     | Downloaded    |--------------------------+
     | Spreadsheet   | (0-row export acts as
     | (.xlsx/.csv)  |  official template)
     +---------------+
```

---

## 5. Implementation Roadmap
1. **Universal Export Engine**: Set up `exceljs` powered export generator implementing the cream headers and auto-justifications.
2. **Reusable `<ExportDataModal />`**: Generalize the UI component for all 6 modules.
3. **Module Rollout**: Connect each of the 6 modules with its respective column schema.
4. **Import Engine**: Implement the matching parser utilizing the identical column definitions.
