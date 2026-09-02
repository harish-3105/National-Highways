-- ============================================================================
-- Migration 0043: Master Auth, Discord-Style Dynamic RBAC & Google Sheets Audit Logs
-- ============================================================================

-- 1. Master Permissions Catalog (45 Atomic Permissions)
CREATE TABLE IF NOT EXISTS public.permissions (
  code VARCHAR(100) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  label VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dynamic Ordered Roles (Discord-Style Position Stack)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  position INT NOT NULL UNIQUE, -- Higher number = Higher authority (Admin=999999, Viewer=0)
  default_scope VARCHAR(50) NOT NULL DEFAULT 'DIVISION' 
    CHECK (default_scope IN ('STATEWIDE', 'CIRCLE', 'DIVISION', 'SUB_DIVISION')),
  is_system_role BOOLEAN NOT NULL DEFAULT false, -- true for Admin & Viewer (prevents deletion)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_position ON public.roles(position DESC);

-- 3. Role-to-Permission Junction Table (Checkbox Matrix)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);

-- 4. User Profiles & Seat Binding (Mobile Phone & TOTP)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,     -- Primary Login Identifier
  full_name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  jurisdiction_scope VARCHAR(50) NOT NULL DEFAULT 'DIVISION'
    CHECK (jurisdiction_scope IN ('STATEWIDE', 'CIRCLE', 'DIVISION', 'SUB_DIVISION')),
  circle VARCHAR(100),
  division VARCHAR(100),
  sub_division VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Authenticator App (RFC 6238 TOTP)
  totp_secret TEXT NOT NULL,                     -- Base32 Secret Key
  totp_enabled BOOLEAN NOT NULL DEFAULT false,  -- True once initial QR verified
  totp_verified_at TIMESTAMPTZ,
  
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role_id);

-- 5. Google Sheets-Style Immutable Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  user_jurisdiction VARCHAR(100),
  
  module VARCHAR(50) NOT NULL,            -- 'ONGOING_WORKS', 'DLP', 'LEGAL', 'FEE_BILLS', 'HIGHWAYS', 'ROLES'
  action VARCHAR(50) NOT NULL,            -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOCKDOWN_TOGGLE'
  entity_id VARCHAR(100) NOT NULL,
  entity_title VARCHAR(255),
  
  changes_summary TEXT,
  field_changes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { field, label, old_value, new_value }
  snapshot_before JSONB,
  snapshot_after JSONB,
  
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_phone ON public.audit_logs(user_phone);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(module, entity_id);

-- Append-Only Security Rules (Zero updates or deletes)
CREATE OR REPLACE RULE no_audit_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_audit_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- 6. Master Lockdown & System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
  is_lockdown_active BOOLEAN NOT NULL DEFAULT false,
  lockdown_reason TEXT,
  locked_by UUID REFERENCES public.user_profiles(id),
  locked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. Seed Permissions (45 Atomic Permissions)
-- ============================================================================
INSERT INTO public.permissions (code, module, label, description) VALUES
-- System Governance
('system:lockdown_toggle', 'System', 'Master Lockdown Toggle', 'Toggle statewide emergency read-only freeze switch'),
('system:audit_view', 'System', 'View Audit Logs', 'View historical snapshot diffs and mutation audit logs'),
('system:creative_mode', 'System', 'Admin Creative Mode', 'Bypass monotonic progress checks and edit frozen baseline columns'),

-- Roles & Users Management
('roles:view', 'Roles & Users', 'View Role Catalog', 'View roles and permission configurations'),
('roles:manage', 'Roles & Users', 'Create & Manage Roles', 'Create and modify roles strictly below own hierarchy position'),
('roles:assign', 'Roles & Users', 'Assign Roles to Staff', 'Assign roles to staff members below own hierarchy position'),
('users:create', 'Roles & Users', 'Create User Accounts', 'Provision new staff logins with mobile phone number'),
('users:edit', 'Roles & Users', 'Edit User Accounts', 'Update staff mobile number and active status'),
('users:delete', 'Roles & Users', 'Deactivate Users', 'Suspend or soft-delete user accounts'),
('users:reset_2fa', 'Roles & Users', 'Reset Staff 2FA', 'Issue fresh QR code onboarding for staff who lost their device'),

-- Dynamic Master Data
('master_data:view', 'Master Data', 'View Master Lookups', 'View Circles, Divisions, Schemes, G.O. Stages, and Case Types'),
('master_data:manage', 'Master Data', 'Manage Master Lookups', 'Add, edit, and reorder dynamic dropdown values and hierarchies'),

-- Ongoing Works Module
('works:view', 'Ongoing Works', 'View Works Dashboard', 'Read access to ongoing capital projects and status cards'),
('works:create', 'Ongoing Works', 'Create Work Draft', 'Initiate new capital project record'),
('works:edit_basic', 'Ongoing Works', 'Edit Sanction & Tender', 'Modify Administrative/Technical sanction and contractor data'),
('works:edit_progress', 'Ongoing Works', 'Update Physical Progress', 'Update physical progress %, civil stage, and target dates'),
('works:edit_clearances', 'Ongoing Works', 'Manage Clearances & LA', 'Update Forest, Utility, and Land Acquisition status'),
('works:edit_financials', 'Ongoing Works', 'Edit Financials & RCE', 'Modify Revised Cost Estimates and financial expenditure'),
('works:edit_delays', 'Ongoing Works', 'Manage Delays & EOT', 'Record delay reasons and Extension of Time proposals'),
('works:override_frozen', 'Ongoing Works', 'Override Frozen Columns', 'Modify frozen baseline columns (Cols A-N, Z) on existing works'),
('works:delete', 'Ongoing Works', 'Soft Delete Works', 'Soft delete capital project records with audit reason'),
('works:export', 'Ongoing Works', 'Export Works Registers', 'Generate and download 35-column Excel (.xlsx) work registers'),
('works:view_history', 'Ongoing Works', 'View Snapshot Diffs', 'View monthly snapshot trendlines and audit diff history'),

-- Master Highways Catalog & SLD
('highways:view', 'Highways Catalog', 'View Highways Catalog', 'Read access to Level 1 highway corridors'),
('highways:create', 'Highways Catalog', 'Add Highway Corridor', 'Register new Level 1 highway corridor'),
('highways:edit', 'Highways Catalog', 'Edit Highway Corridor', 'Modify highway classification, start/end points, and lengths'),
('highways:delete', 'Highways Catalog', 'Delete Highway Corridor', 'Soft delete highway corridor records'),
('highways:export', 'Highways Catalog', 'Export Highway Data', 'Download corridor registers to Excel'),
('sub_chainages:create', 'Highways Catalog', 'Add Level 2 Sub-Stretch', 'Add micro-lane geometry and traffic PCU stretches'),
('sub_chainages:edit', 'Highways Catalog', 'Edit Level 2 Sub-Stretch', 'Modify chainages, ROW widths, and traffic counts'),
('sub_chainages:delete', 'Highways Catalog', 'Delete Level 2 Sub-Stretch', 'Delete sub-chainage stretches'),
('sld:print_export', 'Highways Catalog', 'Print & Export SLD', 'Export Straight-Line Diagram to landscape PDF/Paper'),

-- DLP Maintenance Module
('dlp:view', 'DLP Maintenance', 'View DLP Stretches', 'Read access to warranty contracts and calendar filters'),
('dlp:create', 'DLP Maintenance', 'Add DLP Contract', 'Register new maintenance package and child sub-contracts'),
('dlp:edit', 'DLP Maintenance', 'Edit DLP Contract', 'Modify contract specs, contractor names, and road widths'),
('dlp:extend_date', 'DLP Maintenance', 'Extend DLP Warranty', 'Grant official DLP date extensions'),
('dlp:delete', 'DLP Maintenance', 'Soft Delete DLP Contract', 'Soft delete DLP warranty records'),
('dlp:export', 'DLP Maintenance', 'Export DLP Registers', 'Export 26-column maintenance registers to Excel'),

-- Legal Cases Module
('legal:view', 'Legal Cases', 'View Legal Cases', 'Read access to High Court and District Court cases'),
('legal:create', 'Legal Cases', 'Register New Case', 'File new litigation record (WP/WA, prayers, respondent)'),
('legal:edit', 'Legal Cases', 'Update Case Status', 'Update hearing dates, counter affidavits, and conversions'),
('legal:record_judgment', 'Legal Cases', 'Record Final Judgment', 'Enter final court orders, compliance, and contempt filings'),
('legal:delete', 'Legal Cases', 'Soft Delete Legal Case', 'Soft delete legal case records'),
('legal:export', 'Legal Cases', 'Export Legal Briefs', 'Download legal registers and pendency reports to Excel'),

-- Legal Fee Bills Portal
('fee_bills:view', 'Fee Bills Portal', 'View Fee Bills', 'Read access to fee vouchers and pendency tracker'),
('fee_bills:create', 'Fee Bills Portal', 'Create Fee Voucher', 'Create new 5-stage voucher for Law Officers'),
('fee_bills:edit', 'Fee Bills Portal', 'Edit Fee Voucher', 'Modify advocate particulars and claim amounts'),
('fee_bills:process_go', 'Fee Bills Portal', 'Process G.O. Workflow', 'Update Government Order acquisition status and details'),
('fee_bills:process_payment', 'Fee Bills Portal', 'Process Payment Settlement', 'Enter Treasury token, UTR, and ECS disbursement'),
('fee_bills:delete', 'Fee Bills Portal', 'Soft Delete Fee Voucher', 'Soft delete fee voucher records'),
('fee_bills:export', 'Fee Bills Portal', 'Export Fee Statements', 'Export fee vouchers and tax deductions to Excel'),
('fee_bills:view_audit', 'Fee Bills Portal', 'View Fee Audit Logs', 'View 1/3rd auto-calculator verification checks'),

-- Staff Directory Module
('staff:view', 'Staff Directory', 'View Staff Directory', 'Read access to staff directory and posting units'),
('staff:create', 'Staff Directory', 'Add Staff Record', 'Add personnel with 6-tier posting hierarchy'),
('staff:edit', 'Staff Directory', 'Edit Staff Record', 'Update contact info, seat, or transfer posting location'),
('staff:delete', 'Staff Directory', 'Deactivate Staff Record', 'Archive or deactivate personnel records'),
('staff:export', 'Staff Directory', 'Export Staff Roster', 'Download staff directory to Excel')
ON CONFLICT (code) DO UPDATE SET 
  module = EXCLUDED.module,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- ============================================================================
-- 8. Seed System Roles & Initial Seed Accounts
-- ============================================================================
INSERT INTO public.roles (id, name, position, default_scope, is_system_role, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Super Admin', 999999, 'STATEWIDE', true, 'Full unrestricted statewide administrative and creative control'),
  ('00000000-0000-0000-0000-000000000002', 'Viewer', 0, 'STATEWIDE', true, 'Default read-only viewer role for new registrations')
ON CONFLICT (name) DO UPDATE SET
  position = EXCLUDED.position,
  default_scope = EXCLUDED.default_scope,
  is_system_role = EXCLUDED.is_system_role,
  description = EXCLUDED.description;

-- Grant all 45 permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000001', code FROM public.permissions
ON CONFLICT DO NOTHING;

-- Grant all view/export permissions to Viewer
INSERT INTO public.role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000002', code FROM public.permissions
WHERE code LIKE '%:view' OR code LIKE '%:export'
ON CONFLICT DO NOTHING;

-- Initialize Global Settings
INSERT INTO public.system_settings (id, is_lockdown_active)
VALUES ('global_config', false)
ON CONFLICT (id) DO NOTHING;

-- Provision Initial Super Admin User Account (TOTP Secret: JBSWY3DPEHPK3PXP default base32 seed)
INSERT INTO public.user_profiles (
  id, phone_number, full_name, role_id, jurisdiction_scope, totp_secret, totp_enabled, is_active
) VALUES 
  (
    '00000000-0000-0000-0000-000000000101',
    '9999999999',
    'Super Admin',
    '00000000-0000-0000-0000-000000000001',
    'STATEWIDE',
    'JBSWY3DPEHPK3PXP',
    false,
    true
  )
ON CONFLICT (phone_number) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id,
  jurisdiction_scope = EXCLUDED.jurisdiction_scope;

-- ============================================================================
-- 9. Row Level Security (RLS) & Access Grants
-- ============================================================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anon / authenticated full access for server-side API execution
DROP POLICY IF EXISTS "Public access permissions" ON public.permissions;
CREATE POLICY "Public access permissions" ON public.permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access roles" ON public.roles;
CREATE POLICY "Public access roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access role_permissions" ON public.role_permissions;
CREATE POLICY "Public access role_permissions" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access user_profiles" ON public.user_profiles;
CREATE POLICY "Public access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access audit_logs" ON public.audit_logs;
CREATE POLICY "Public access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access system_settings" ON public.system_settings;
CREATE POLICY "Public access system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
