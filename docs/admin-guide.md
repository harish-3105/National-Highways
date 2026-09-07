# Tamil Nadu National Highways Management System — Administrator Guide

This guide explains how administrators manage system dropdown options, approve overrides, restore archived data, manage staff roles, reset logins, and view audit history.

---

## 1. Admin Basics & System Rules

### Admin Levels
- **Super Admin (Rank 100):** Full access across the entire state. Manages roles, system settings, and emergency freeze.
- **Chief Engineer / Head Office Admin (Rank 80):** Full statewide access for road projects, maintenance, and legal cases.
- **Circle Admin / Superintending Engineer (Rank 60):** Manages all records and staff across divisions in their Circle.
- **Division Admin / Divisional Engineer (Rank 40):** Manages records, assigns field staff roles, and reviews claims in their Division.

### How Delete and Archive Works
Records on this website are never permanently erased. Deleting an item only hides it from the active list.

- **Delete an item:** Click **Delete**. The item moves to the archive.
- **See archived items:** Click **Show Archived** at the top of the module page.
- **Restore an item:** Find the item in the archived list and click **Restore** (circular arrow icon). It returns to the active list immediately.
- **Permanent deletion:** Permanent erasing is blocked for all users, including Super Admins. This keeps audit history safe.

### Statewide Emergency Freeze (Lockdown)
Super Admins can freeze edits statewide during system maintenance or year-end reviews.
- **To turn on:** Click the **Lockdown** toggle in the top bar.
- **What happens:** Non-admin users can still view all data, but cannot add, edit, or delete anything. A red warning banner appears on all screens.
- **To turn off:** Click the toggle again to return to normal write access.

---

## 2. Managing Dropdown Options (Master Data)

Every module has a **Master Config** button at the top. Admins can add, rename, or deactivate dropdown choices without waiting for developer changes.

- **Ongoing Works Dropdowns:** Funding Schemes (e.g. CRIDP, NH(O)), Work Stages (Tender, In Progress, Completed), Delay Reasons (Land Acquisition, TANGEDCO utility shifting, etc.), and Circle/Division links.
- **DLP Maintenance Dropdowns:** Maintenance Schemes (DLP, Construction, PBMC, STMC, No DLP) and Circle/Division links.
- **Corridors Catalog Dropdowns:** Lane Configurations (2-Lane, 4-Lane Divided) and Pavement Types (BT, CC).
- **Legal Cases Dropdowns:** Court Names (High Court Madras, Sub Courts), Case Types (WP, WA, OS, LAOP), Current Stages (Notice Stage, For Counter), and Government Pleader (GP) Opinions.
- **Fee Bills Dropdowns:** G.O. Approval Stages, Claim Types (Appearance, Drafting, Conference), and Lawyer Posts (Special GP, Additional GP).
- **Staff Directory Dropdowns:** 7-tier organizational units from top offices down to sections and job posts.

---

## 3. Ongoing Works Administration

### Editing Frozen Project Information
To prevent accidental changes to approved project baselines, key fields (sanctioned cost, agreement cost, original completion date, job number) are locked once entered.
- **Who can edit:** Admins with frozen override access or Super Admins.
- **How to edit:** Open the project edit form. Locked fields will show an unlock badge. Update the values and click **Save**. The change is recorded in the audit log.

### Validation Bypass (Creative Mode)
Admins with bypass access can save incomplete drafts without filling every mandatory field. This helps when entering old historical projects where some dates are still being tracked down.

### Freezing Monthly Progress Snapshots
The system records a snapshot whenever a project is edited. Admins can also take a statewide snapshot of all active projects at once:
- Click **Trigger Monthly Snapshot** in the Ongoing Works header.
- The system freezes the current physical %, financial spending, and delay status for all active projects.

### Archiving and Restoring Projects
- **Archive:** Click **Delete** on a project row. It moves to the archive.
- **Restore:** Turn on **Show Archived**, find the project, and click **Restore** (or select multiple projects and click **Bulk Restore**).

---

## 4. Road Diagrams & Corridors Administration

### Managing Sub-Chainages
Admins can split highway corridors into discrete sub-chainage sections:
- Add micro-lane sections with start km, end km, road width (m), and pavement type (BT vs CC).
- Update Passenger Car Unit (PCU) traffic survey census counts and survey years.

### Restoring Archived Corridors
Turn on **Show Archived** on the Corridors Catalog page, locate the deleted road code, and click **Restore**.

---

## 5. DLP Maintenance Administration

### Granting Warranty Extensions
When a contractor is granted an official extension of their defect liability period:
1. Open the DLP record and click **Edit**.
2. Update the **DLP Till Date** to the new expiry date and record the extension letter reference.
3. Click **Save**. The countdown timer updates automatically.

### Archiving and Restoring DLP Packages
- **Archive:** Click **Delete** on a corridor. The corridor and all its child work stretches move to the archive safely.
- **Restore:** Turn on **Show Archived** and click **Restore**. The corridor and all its work stretches return to the active list.

---

## 6. Legal Cases Administration

### Converting a Case into an Appeal (WP to WA / SLP)
When the department receives an order and decides to appeal to a higher court:
1. Open the original case and click **Initiate Higher Appeal**.
2. Select the appellate court (e.g. Division Bench High Court Madras or Supreme Court).
3. The system automatically creates the new Appeal Case, links the original case details, and calculates the Section 5 limitation delay.

### Recording Final Judgments
1. Open the case and go to the **Disposal** tab.
2. Enter the final order date, judgment result (Allowed / Dismissed / Disposed), and flag whether compliance is required.
3. Record the Government Pleader's advice on whether to appeal.

### Assigning Law Officers
Open the case, select the assigned Special Government Pleader (Spl. GP) or Standing Counsel, and save.

---

## 7. Fee Bills Administration

### Overriding the 1/3rd Junior Fee Rule
By default, junior assistant fees are automatically capped at $\frac{1}{3}$ of the senior fee. For special cases with government approval for higher fees:
1. Turn on the **Override 1/3rd Rule** switch in the fee form.
2. Type the approved fee amount and enter the government reference letter details.
3. Click **Save**.

### Recording G.O. Approvals and Bank Payments
- **Record G.O.:** Go to Stage 3 of the fee bill, enter the G.O. Number, G.O. Date, and sanctioned amount.
- **Record Bank Payment:** Go to Stage 4, enter the settled amount, Income Tax deduction, bank UTR/ECS reference number, and credit date.

### Checking Movement History
Click the **Audit icon** (shield) on any bill to see the exact time, date, and officer name for every step from division submission to bank credit.

---

## 8. Staff Management, Logins & 2FA Reset

### Adding a New Staff Member
1. Go to **Staff Portal (`/staff`)** and click **Add New Staff**.
2. **Step 1:** Enter Full Name, Designation, 10-Digit Mobile Number, and Email.
3. **Step 2:** Select the 6-tier posting (Office down to Section).
4. **Step 3:** Choose their security role from the dropdown.
5. Click **Save**. The user account is created automatically.

### Resetting a Staff Member's 2FA Login
If an officer gets a new phone or loses their authenticator code:
1. Find the officer in the Staff Directory.
2. Click **Reset 2FA** on their profile card and confirm.
3. The old login link is cleared. The next time the officer logs in with their mobile number, a fresh QR code will appear on screen for them to scan.

### Unlocking a Locked Account
If an officer enters the wrong code 5 times and gets locked out for 15 minutes:
1. Find the officer in the Staff Directory.
2. Click **Unlock User**.
3. The 15-minute lockout is cleared immediately.

### Staff Archive & Restore Workflow
- **Deactivate/Archive a staff member:** Click **Delete** on their staff row. Their account is deactivated and moved to the archive.
- **View archived staff:** Click **Show Archived** at the top of the Staff Directory.
- **Restore a staff member:** Find the officer in the archived list and click **Restore** (circular arrow icon). Their profile and account are reactivated immediately.

---

## 9. Statewide Audit History (`/admin/audit`)

Every add, edit, archive, restore, and role change is permanently recorded in the Audit Log.

- **Open Audit Log:** Click your name in the top right and choose **Statewide Audit Logs**.
- **Search & Filter:** Search by officer phone number, officer name, or record title. Filter by module or action (Create, Update, Delete, Restore, Lockdown).
- **See Exact Changes (Red / Green Diffs):** Click the **Eye icon** on any log row:
  - **Red text:** Old value that was changed or removed.
  - **Green text:** New value entered.
- **Export Audit Log:** Click **Export to Excel** to download the complete audit trail.
