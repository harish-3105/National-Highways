# Tamil Nadu National Highways Management System — User Guide

This guide explains how to use the website to view, add, and update records for National Highways in Tamil Nadu.

---

## 1. Getting Started

### What is this website?
A single website to manage Tamil Nadu National Highway corridors, road diagrams, maintenance warranties, ongoing construction projects, court cases, lawyer fee bills, and staff contacts.

### How to Log In
1. Open the login page, type your 10-digit mobile number, and click **Continue**.
2. **First time only:**
   - A QR code will appear on screen.
   - Open **Google Authenticator** or **Microsoft Authenticator** on your phone.
   - Tap **+** and scan the QR code with your phone camera.
   - The app will show a 6-digit code labeled `TNHighways`.
3. Type the 6-digit code from your phone and click **Verify & Sign In**.

> If you enter the wrong code 5 times, your account locks for 15 minutes. If you get a new phone or lose your code, ask your Division Admin to reset it.

### Navigation Header
The top bar stays visible on every page:
- **Module Tabs:** Click any tab (*Corridors Catalog*, *DLP Maintenance*, *Ongoing Works*, *Legal Cases*, *Fee Bills*, *Staff*) to switch pages.
- **Your Name & Role:** Click your name in the top right to see your assigned role and division, or to log out.
- **Red Alert Banner:** If shown, the system is in temporary read-only maintenance mode. You can still view data, but edits are paused.

---

## 2. Corridors Catalog (`/highways`)

View all National Highway roads in Tamil Nadu with road codes, old/new numbers, lengths, and lane counts.

### Key Summary Cards
Top cards show total kilometers across the state or your Division:
- **Total Span (km)**
- **< 2 Lane**, **2-Lane**, **2-Lane with Paved Shoulder (2L+PS)**, **4-Lane**, **6-Lane**
- Click any lane card to filter the list to only roads with that lane type. Click again to clear.

### Search and Filters
- **Search:** Type any road code (e.g. `44`, `NH-44`, `NH 844`) or location name.
- **Configuration Filter:** Filter by 2-Lane, 4-Lane, or Multi-Lane.
- **View Toggle:** Switch between **Table View** (full list with columns) and **Grid View** (cards).

### View Details & Open Road Diagram
- Click the **Eye icon** on any row to open the full summary.
- Click **Open SLD** or the **Route icon** to view the interactive road diagram.

### Exporting Data
Click **Export** at the top right to download the road list as an Excel file.

---

## 3. Road Diagrams — Straight-Line Diagram (`/highways/[id]/sld`)

An interactive visual strip map showing lanes, traffic volume, towns, and maintenance packages along a road.

### Visualizer Modes
Switch between two views using the toolbar button:
1. **Micro-Lane Mode:** Shows physical lanes. Divided 4-lane roads split into Left Side (LHS) and Right Side (RHS) around a center median. Single-carriageway roads show one combined lane strip.
2. **Traffic (PCU) Mode:** Shows traffic density bars along the road with survey years and capacity limits.

### Toolbar Controls
- **Zoom (1x to 4x):** Zoom in to see busy town stretches clearly.
- **Reverse Direction (⇄):** Flips the view from (Start → End) to (End → Start).
- **Layer Checkboxes:** Turn Towns, Road Widths, Land Width (ROW), and DPR proposals on or off.

### Maintenance (DLP) Overlay
Colored bars under the road strip show active contractor warranty packages:
- **Green:** Active warranty (more than 90 days left).
- **Amber:** Expiring soon (90 days or less left).
- **Red:** Expired warranty.

### Inspecting Stretches
Hover your mouse over any section or colored bar to see exact start/end km, section length, contractor name, road width, and traffic volume.

### How to Print or Save as PDF
1. Click **Print / Export PDF** in the top bar.
2. The page automatically formats the road into a series of **A4 Landscape sheets** with title blocks, scale pins, and legends.
3. In your browser print window, choose **Save as PDF** or select your printer.

---

## 4. Defect Liability Period (DLP) Maintenance (`/dlp`)

Track contractor warranty periods, maintenance packages, and road stretches without active warranty.

### 5 Work Categories
1. **Under DLP:** Standard contractor warranty (typically 5 years). The contractor must fix defects for free.
2. **Under Construction:** Ongoing road work. Automatically turns into a 5-year warranty once marked complete.
3. **PBMC (5-Year):** Long-term Performance-Based Maintenance Contract.
4. **STMC (1-Year):** Short-Term Maintenance Contract for periodic surface renewal.
5. **Under No DLP:** Stretches where warranty has expired or needs fresh repair sanction.

### Summary Cards
- **Expiry Alerts:** Works with warranty ending within 90 days or already expired.
- **Category Totals:** Total kilometers and work counts for Construction, DLP, PBMC, STMC, and No DLP.
- Click any card to filter the list.

### Viewing and Adding Records
- **See child stretches:** Click the arrow (**▸**) next to any road to expand and see every work package, contractor name, start/end dates, and days remaining.
- **Add a record:** Click **Add New**. Select the road code and division, then click **Add Stretch** to add work packages with start km, end km, contractor name, category, and dates.
- **Save:** Click **Save Record**.

### Exporting DLP Data
Click **Export** to download the maintenance list as an Excel file.

---

## 5. Ongoing Capital Works (`/ongoing-works`)

Track major road construction projects from sanction through contract award, monthly progress, delays, and land/utility clearances.

### Dashboard Filters & Sliders
- **Quick Filters:** Filter by Active Works, Works over ₹50 Crore, In Progress, Tender Stage, Delayed, or Completed.
- **Range Sliders:** Filter by physical progress %, financial spending, or months of delay.

### 6-Stage Entry Form
The form is divided into 6 tabs. You must fill mandatory fields (marked with `*`) in your current tab before clicking **Next**, but you can click **Save Draft** at any point.

1. **Stage 1 — Sanction & Scope:** Enter Name of Work (required to start), Circle, Division, Scheme (e.g. CRIDP, NH(O)), Job Number, and Sanctioned Cost in Crore.
2. **Stage 2 — Award & Contract:** Enter Letter of Acceptance (LOA) Date, Agreement Date, Contractor Name, Contract Value, and Site Handover Date.
3. **Stage 3 — Physical & Financial Progress:** Enter current Physical Progress %, completed lengths (prior years, this year, total), and spending in Crore. The system calculates financial progress % automatically.
4. **Stage 4 — Overruns & EOT:** Enter original completion date vs target completion date. The system calculates delay automatically. Enter Extension of Time (EOT) dates and delay reasons.
5. **Stage 5 — Statutory Clearances:** Track 5 clearance types: Land Acquisition (LA), Forest approvals, Utility shifting (TANGEDCO / TWAD), Railway ROB/RUB clearances, and other local issues.
6. **Stage 6 — Column 27 Field Log:** A separate notes box for Chief Engineer (CE) and Superintending Engineer (SE) inspection remarks and review meeting notes.

### Viewing Snapshot History
Click the **Clock icon** on any project row to open the history window. This shows past monthly progress percentages and spending over time.

### Exporting Works
Click **Export** to download the project list with spending and delay figures to Excel.

---

## 6. Legal Cases & Court Litigation (`/legal`)

Track High Court (Chennai and Madurai Bench) and District Court cases.

### Two Case Types
1. **Normal Cases:** Original petitions (WP, WMP, OS, LAOP).
2. **Appeal Cases:** Higher court appeals (Writ Appeal - WA, CMA, SLP, Review Petition).

### Normal Case Steps (5 Tabs)
1. **Stage 1 — Case Registry:** Circle, Division, Court Name, Case Type, Case Number, Year, Parties, and Prayer.
2. **Stage 2 — Counter Affidavit (CA):** CA required (Yes/No), draft prepared date, GP vetted date, filed date, and financial claim amount in Lakhs.
3. **Stage 3 — Hearing Schedule:** Current stage (e.g. Notice Stage, For Counter, Final Hearing), last hearing date, next hearing date, and lawyer name.
4. **Stage 4 — Interim Orders:** Stay/injunction granted (Yes/No), court directions, compliance due date, and action taken.
5. **Stage 5 — Disposal & Appeal:** Final order date, outcome (Allowed/Dismissed/Disposed), adverse findings, and Government Pleader (GP) appeal advice.

### Appeal Case Steps (5 Tabs)
1. **Stage 1 — Appeal Registry:** Appellate court, appeal type (WA, SLP), appeal number, and year.
2. **Stage 2 — Base Case Link:** Original case number, original court, and original judgment date.
3. **Stage 3 — Limitation Delay & GP Opinion:** Certified copy dates and calculated delay under Section 5.
4. **Stage 4 — Hearing & Stay:** Appeal hearing date and interim stay status.
5. **Stage 5 — Final Order:** Final appeal judgment and closure.

---

## 7. Legal Fee Bills Portal (`/fee-bills`)

Manage lawyer appearance bills, automatic junior fee calculation, Government Order (G.O.) approvals, and bank ECS payments.

### 3 Workspace Views
Switch views using the top workspace buttons:
1. **Ledger View:** Table of all lawyer bills with payment statuses (Pending, In Progress, Settled).
2. **Pendency Tracker:** Visual pipeline showing where bills are currently waiting:
   $$\text{Division (DE)} \longrightarrow \text{Circle (SE)} \longrightarrow \text{Head Office (CE)} \longrightarrow \text{Secretariat (G.O.)} \longrightarrow \text{Treasury (ECS)}$$
3. **Financial Analytics:** Charts showing spending by Division and fees by claim type.

### 4-Stage Bill Entry Form
1. **Stage 1 — Voucher Details:** Bill number, bill date, date received in division, lawyer name, lawyer post, and case number.
2. **Stage 2 — Fee Amounts & 1/3rd Rule:**
   - Enter Senior Appearance Fee, Conference Fee, and Drafting Fee.
   - The system **automatically calculates the Junior Assistant Fee** as exactly $\frac{1}{3}$ of the senior fee.
   - Total claim amount updates automatically.
3. **Stage 3 — G.O. Approval:** Enter proposal submission date, movement steps, G.O. sanction number, and sanctioned amount.
4. **Stage 4 — Payment:** Enter settled amount, Income Tax deduction, net payment, bank UTR/ECS reference number, and payment date. Separate boxes exist for senior and junior payments.

---

## 8. Departmental Staff Directory (`/staff`)

Find contact and posting details for officers across the department.

### 7 Cascading Dropdowns
Filter staff step-by-step from top office down to section:
$$\text{Office} \longrightarrow \text{Circle} \longrightarrow \text{Division} \longrightarrow \text{Sub-Division} \longrightarrow \text{Section} \longrightarrow \text{Sub-Section} \longrightarrow \text{Designation}$$

### Search & Profile Card
- Type any name, 10-digit mobile number, or email into the search box.
- Click the **Eye icon** on any staff row to see full contact details, office unit, and direct call/email links.
- Click **Export** to download the phone and email directory to Excel.

---

## 9. Common Questions

**Q: Why can't I click Next to the next tab in an entry form?**  
A: You must fill in all fields marked with an asterisk (`*`) in your current tab first. You can still save an initial draft by clicking **Save Draft**.

**Q: Why can't I see records from other divisions?**  
A: Your account is set to your own Division. You only see records for other divisions if you have statewide view access.

**Q: What if I lose my phone or 2FA code?**  
A: Ask your Division Admin or Super Admin to click **Reset 2FA** on your staff profile. You can then scan a fresh QR code at your next login.

**Q: How do I print road diagrams cleanly?**  
A: Open the road diagram, click **Print / Export PDF**, and select **Landscape** in your browser print window. The system automatically splits long roads across clean printable sheets.
