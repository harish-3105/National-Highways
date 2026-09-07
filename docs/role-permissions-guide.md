# Role Hierarchy, Permissions & Scoping Guide

This guide explains how user roles work, how geographic access is controlled, what each permission allows, and how to assign roles to staff.

---

## 1. Role System Basics

### Job Title vs Security Role
- **Job Title (Designation):** The officer's real government post (e.g. *Divisional Engineer*, *Assistant Engineer*). This shows on their contact card.
- **Security Role:** What the officer can click and edit on the website (e.g. *Division Admin*, *Field Executive*, *Viewer*).
- An officer keeps their real job title regardless of which website role they are given.

---

## 2. Role Ranks

Higher rank = more access.

- **100 — Super Admin:** full access, whole state
- **80 — Chief Engineer:** whole state
- **60 — Circle Admin:** their Circle
- **40 — Division Admin:** their Division
- **20 — Field Staff:** enters daily data
- **0 — Viewer:** view only

### Rules
1. **You can only assign roles ranked below your own.** A Division Admin (Rank 40) can assign a Field Staff role (Rank 20), but cannot assign a Circle Admin role (Rank 60) or another Division Admin role (Rank 40).
2. **You can't give a permission you don't have.** When creating a custom role, you can only check boxes for permissions you personally hold.
3. **Super Admin and Viewer can't be changed or deleted.** These are permanent starting roles.

---

## 3. Role Studio (`/staff` → Role Studio)

Admins with role management access can open the **Role Studio** modal to manage custom roles:
- **Create a role:** Click **New Role**, type a name, choose its starting scope (Division, Circle, or Statewide), check the permissions it should have, and click **Save**.
- **Edit permissions:** Select any custom role from the list, check or uncheck permission boxes, and save.
- **Reorder ranks:** Drag and drop custom roles up or down in the list to change their rank order.
- **Delete a role:** Click the trash icon on a custom role. Any staff currently assigned to that role will automatically switch to the Viewer role.

---

## 4. How Geographic Access Works

Access has two separate controls: **what you can see** and **what you can edit**.

### What You Can See
- **Division Only (Default):** You only see roads, projects, contracts, and court cases belonging to your assigned Division.
- **Statewide View:** If your role includes statewide view access, you can see all records across every Division in Tamil Nadu.

### What You Can Edit
- **Division Only (Default):** You can only add, edit, or archive records inside your own assigned Division. Edits to other divisions are blocked.
- **Statewide Edit:** If your role includes statewide edit access, you can edit records in any Division across the state.

---

## 5. Permissions List by Module

### System & Security
- `system:lockdown_toggle` — Turn the statewide emergency read-only freeze on or off.
- `system:audit_view` — View the statewide audit log page.
- `system:audit_export` — Download the audit log to Excel.
- `system:view_archived` — Turn on the "Show Archived" toggle to see deleted items.
- `system:creative_mode` — Bypass progression rules to correct historical milestones.
- `system:bypass_validation` — Save incomplete drafts without filling all required fields.
- `system:hard_delete` — *Note: Permanently blocked for all users in the website. Records are always archived, never permanently erased.*

### Jurisdiction & Scoping
- `jurisdiction:view_statewide` — View records across all divisions in Tamil Nadu.
- `jurisdiction:edit_statewide` — Add and edit records across all divisions in Tamil Nadu.
- `jurisdiction:reassign_division` — Reassign an existing project or contract to a different Division.

### Roles & Users
- `roles:view` — Open and view the Role Studio.
- `roles:create` — Create new custom roles.
- `roles:edit` — Change permissions on custom roles.
- `roles:delete` — Delete custom roles.
- `roles:reorder` — Drag and drop custom roles to change their rank order.
- `roles:assign` — Assign a role to a staff member.
- `users:view` — View user account logins and phone numbers.
- `users:create` — Create user login profiles.
- `users:edit` — Edit user login details and mobile numbers.
- `users:delete` — Deactivate user accounts.
- `users:reset_2fa` — Reset a user's 2FA login so they can scan a fresh QR code.
- `users:unlock` — Unlock an account locked by 5 failed OTP attempts.

### Master Data Dropdowns
- `master_data:manage` — Global access to manage all dropdown options.
- `highways:master_data_manage` — Manage road configurations and pavement types.
- `dlp:master_data_manage` — Manage maintenance schemes and categories.
- `legal:master_data_manage` — Manage court names, case types, and stages.
- `fee_bills:master_data_manage` — Manage G.O. approval stages and claim types.
- `works:master_data_manage` — Manage capital schemes and delay reasons.
- `staff:master_data_manage` — Manage departmental offices, sections, and designations.

### Ongoing Capital Works
- `works:view` — View the ongoing works dashboard.
- `works:create` — Add a new road construction project.
- `works:edit_basic` — Edit project names, sanctioned costs, and job numbers.
- `works:edit_progress` — Update monthly physical %, spending, and remarks.
- `works:edit_clearances` — Update land, forest, and utility clearance stages.
- `works:edit_financials` — Update bills and contractor payments.
- `works:edit_delays` — Update delay classifications and extension reasons.
- `works:override_frozen` — Edit locked project baseline details (e.g. sanctioned cost).
- `works:delete` — Move a project to the archive.
- `works:restore` — Restore an archived project back to the active list.
- `works:bulk_delete` — Move multiple selected projects to the archive at once.
- `works:bulk_restore` — Restore multiple selected projects back to the active list at once.
- `works:export` — Download projects to Excel.
- `works:create_snapshot` — Manually trigger a statewide monthly progress snapshot.
- `works:view_history` — View past monthly progress milestones and snapshot history.

### Corridors Catalog & Road Diagrams
- `highways:view` — View master highway corridors and road diagrams.
- `highways:create` — Add a new highway corridor.
- `highways:edit` — Edit corridor lengths, lane configurations, and endpoints.
- `highways:delete` — Move a corridor to the archive.
- `highways:restore` — Restore an archived corridor back to active status.
- `highways:bulk_delete` — Move multiple selected corridors to the archive at once.
- `highways:bulk_restore` — Restore multiple selected corridors back to active status at once.
- `highways:export` — Download corridor catalog to Excel.
- `sub_chainages:view` — View micro-lane road geometry and traffic volume data.
- `sub_chainages:create` — Add a new sub-chainage stretch.
- `sub_chainages:edit` — Edit road width, pavement type, and town bounds.
- `sub_chainages:delete` — Move a sub-chainage stretch to the archive.
- `sub_chainages:restore` — Restore an archived sub-chainage stretch.
- `sld:view` — Open and interact with the Straight-Line Diagram visualizer.
- `sld:print_export` — Format and print multi-page A4 landscape road diagram sheets.

### DLP Maintenance
- `dlp:view` — View maintenance corridors and work packages.
- `dlp:create` — Add a new maintenance package.
- `dlp:edit` — Edit contractor details, dates, and warranty status.
- `dlp:extend_date` — Formally extend warranty end dates.
- `dlp:delete` — Move a maintenance corridor and its stretches to the archive.
- `dlp:restore` — Restore an archived maintenance corridor and its stretches.
- `dlp:stretches_manage` — Add, edit, or remove child work stretches within a package.
- `dlp:bulk_delete` — Move multiple selected maintenance packages to the archive at once.
- `dlp:bulk_restore` — Restore multiple selected maintenance packages at once.
- `dlp:export` — Download maintenance records to Excel.

### Legal Litigation
- `legal:view` — View court cases.
- `legal:create` — Add a new court case.
- `legal:edit` — Update hearing dates, counter status, and orders.
- `legal:convert` — Convert an original case into a higher court appeal (WA / SLP).
- `legal:record_judgment` — Record final judgments and compliance closures.
- `legal:assign_officer` — Assign Government Pleaders or Standing Counsels.
- `legal:delete` — Move a court case to the archive.
- `legal:restore` — Restore an archived court case back to the active list.
- `legal:bulk_delete` — Move multiple selected court cases to the archive at once.
- `legal:bulk_restore` — Restore multiple selected court cases back to the active list at once.
- `legal:export` — Download court case register to Excel.

### Legal Fee Bills
- `fee_bills:view` — View lawyer fee bills.
- `fee_bills:create` — Submit a new lawyer fee voucher.
- `fee_bills:edit` — Update bill movement stages, G.O. details, and payments.
- `fee_bills:process_go` — Record G.O. sanction numbers and amounts.
- `fee_bills:process_payment` — Record treasury bill numbers and bank credit dates.
- `fee_bills:override_calc` — Override the automatic 1/3rd junior fee rule.
- `fee_bills:delete` — Move a fee voucher to the archive.
- `fee_bills:restore` — Restore an archived fee voucher back to active status.
- `fee_bills:bulk_delete` — Move multiple selected fee vouchers to the archive at once.
- `fee_bills:bulk_restore` — Restore multiple selected fee vouchers at once.
- `fee_bills:export` — Download fee bills to Excel.
- `fee_bills:view_audit` — View timestamps for all 5 movement steps.

### Staff Directory
- `staff:view` — View staff profiles and contact details.
- `staff:create` — Add a new staff member.
- `staff:edit` — Edit staff phone numbers, postings, and designations.
- `staff:transfer` — Process staff transfers and seat relocations.
- `staff:assign_role` — Assign a security role to an officer.
- `staff:delete` — Deactivate a staff member and archive their profile.
- `staff:restore` — Restore an archived staff member and reactivate their account.
- `staff:bulk_delete` — Deactivate and archive multiple selected staff at once.
- `staff:export` — Download staff directory to Excel.

> *Note on Staff Restores: The system supports individual `staff:restore` to reactivate staff profiles. There is no bulk restore for staff.*

---

## 6. How to Add and Set Up a New Staff Member

### Step 1: Add the Staff Member
1. Go to **Staff Portal (`/staff`)** and click **Add New Staff**.
2. **Tab 1:** Enter Full Name, Designation, 10-Digit Mobile Number, and Email.
3. **Tab 2:** Select their 6-tier posting (Office, Circle, Division, Sub-Division, Section, Sub-Section).

### Step 2: Choose Their Role
1. In the **Security Role** dropdown, select a role:
   - For field engineers: *Field Staff*
   - For division engineers: *Division Admin*
   - For read-only staff: *Viewer*
2. The dropdown will only show roles ranked below yours.
3. Click **Save Staff Member**. The user account is created automatically.

### Step 3: First-Time Login on Phone
1. Have the officer open the website on their computer and type their mobile number.
2. A QR code will appear on screen.
3. The officer opens **Google Authenticator** on their smartphone, taps **+**, and scans the QR code.
4. They type the 6-digit code from their phone into the website and click **Verify & Sign In**.

### Step 4: Promotions & Transfers
1. When an officer is promoted or transferred, click **Edit** on their profile in `/staff`.
2. Update their posting to the new division.
3. Update their role if they received a promotion.
4. Click **Save Changes**. Their new division access takes effect on their next login.

### Step 5: Handling Lost Phones & Lockouts
- **Lost Phone / New Phone:** Find the officer in `/staff` and click **Reset 2FA**. The next time they log in, a fresh QR code will appear for them to scan.
- **15-Minute Lockout:** If locked out by 5 wrong codes, click **Unlock User** to clear the timer immediately.
