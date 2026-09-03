-- Migration 0046: Complete Granular Permissions Catalog
-- Registers all identified operational permissions across all 10 system modules

INSERT INTO public.permissions (code, module, label, description) VALUES
-- System & Security Governance
('system:audit_export', 'System', 'Export Audit Logs', 'Export system audit logs to Excel or CSV'),
('system:view_archived', 'System', 'View Archived Records', 'Toggle and view soft-deleted and archived records across all module dashboards'),
('system:hard_delete', 'System', 'Permanent Database Purge', 'Permanently delete records and history from database tables'),

-- Jurisdiction & Scope
('jurisdiction:reassign_division', 'Jurisdiction', 'Cross-Division Reassignment', 'Reassign existing project or contract jurisdiction to a different Division'),

-- Roles & Users
('roles:reorder', 'Roles & Users', 'Reorder Role Hierarchy', 'Reorder role hierarchy positions via drag-and-drop in Role Studio'),
('roles:delete', 'Roles & Users', 'Delete Custom Roles', 'Delete custom roles and reassign affected users to Viewer'),
('users:unlock', 'Roles & Users', 'Unlock OTP Lockouts', 'Clear temporary login lockouts caused by failed OTP verification attempts'),

-- Module-Specific Master Data Management
('highways:master_data_manage', 'Master Data', 'Manage Highway Master Config', 'Manage Circles, Divisions, Carriageway Configurations, and Level 2 Lane Statuses'),
('dlp:master_data_manage', 'Master Data', 'Manage DLP Master Config', 'Manage DLP Circles, Divisions, and Maintenance Schemes'),
('legal:master_data_manage', 'Master Data', 'Manage Legal Master Config', 'Manage Court Names, Case Types, Present Stages, and GP Opinions'),
('fee_bills:master_data_manage', 'Master Data', 'Manage Fee Bills Master Config', 'Manage G.O. Stages, Claim Types, and Expense Headings'),
('works:master_data_manage', 'Master Data', 'Manage Works Master Config', 'Manage Ongoing Works Schemes, Civil Stages, and Delay Classifications'),
('staff:master_data_manage', 'Master Data', 'Manage Staff Master Config', 'Manage Designations, Posting Units, and Department Wings'),

-- Ongoing Works
('works:create_snapshot', 'Ongoing Works', 'Trigger Monthly Snapshot', 'Manually freeze and generate a monthly progress snapshot for all capital projects'),
('works:bulk_delete', 'Ongoing Works', 'Bulk Soft Delete Works', 'Batch soft-delete multiple selected ongoing capital projects'),
('works:bulk_restore', 'Ongoing Works', 'Bulk Restore Works', 'Batch restore multiple selected ongoing capital projects back to active list'),

-- Highways Catalog & SLD
('highways:restore', 'Highways Catalog', 'Restore Archived Corridors', 'Restore soft-deleted Level 1 highway corridors back to active list'),
('sub_chainages:restore', 'Highways Catalog', 'Restore Sub-Chainages', 'Restore soft-deleted Level 2 sub-chainage geometry stretches'),
('highways:bulk_delete', 'Highways Catalog', 'Bulk Delete Corridors', 'Batch soft-delete multiple selected highway corridors'),
('highways:bulk_restore', 'Highways Catalog', 'Bulk Restore Corridors', 'Batch restore multiple selected highway corridors'),
('highways:import', 'Highways Catalog', 'Bulk Excel Import (Corridors)', 'Bulk import Level 1 highway corridors from Excel sheets'),
('sub_chainages:import', 'Highways Catalog', 'Bulk Excel Import (Sub-Chainages)', 'Bulk import Level 2 sub-chainage stretches from Excel sheets'),

-- DLP Maintenance
('dlp:restore', 'DLP Maintenance', 'Restore Archived Contracts', 'Restore soft-deleted DLP maintenance packages back to active list'),
('dlp:stretches_manage', 'DLP Maintenance', 'Manage 2D Work Stretches', 'Add, modify, and delete child 2D spatial work stretches within a contract package'),
('dlp:bulk_delete', 'DLP Maintenance', 'Bulk Delete DLP Packages', 'Batch soft-delete multiple selected DLP maintenance packages'),
('dlp:bulk_restore', 'DLP Maintenance', 'Bulk Restore DLP Packages', 'Batch restore multiple selected DLP maintenance packages'),
('dlp:import', 'DLP Maintenance', 'Bulk Excel Import (DLP)', 'Bulk import DLP maintenance contracts from Excel sheets'),

-- Legal Litigation
('legal:restore', 'Legal Cases', 'Restore Archived Cases', 'Restore soft-deleted legal litigation cases back to active list'),
('legal:assign_officer', 'Legal Cases', 'Assign Law Officers', 'Assign Government Pleaders, Special GPs, and Advocates to court cases'),
('legal:bulk_delete', 'Legal Cases', 'Bulk Delete Cases', 'Batch soft-delete multiple selected court cases'),
('legal:bulk_restore', 'Legal Cases', 'Bulk Restore Cases', 'Batch restore multiple selected court cases'),
('legal:import', 'Legal Cases', 'Bulk Excel Import (Legal)', 'Bulk import litigation cases from Excel sheets'),

-- Legal Fee Bills
('fee_bills:restore', 'Fee Bills Portal', 'Restore Archived Fee Vouchers', 'Restore soft-deleted advocate fee vouchers back to active list'),
('fee_bills:override_calc', 'Fee Bills Portal', 'Override 1/3rd Rule Calculation', 'Authorize and override 1/3rd fee calculation checks for exceptional vouchers'),
('fee_bills:bulk_delete', 'Fee Bills Portal', 'Bulk Delete Fee Vouchers', 'Batch soft-delete multiple selected fee vouchers'),
('fee_bills:bulk_restore', 'Fee Bills Portal', 'Bulk Restore Fee Vouchers', 'Batch restore multiple selected fee vouchers'),

-- Staff Directory
('staff:restore', 'Staff Directory', 'Restore Archived Staff', 'Restore deactivated staff personnel back to active posting roster'),
('staff:transfer', 'Staff Directory', 'Transfer Posting Location', 'Process staff transfers, seat changes, and jurisdiction relocations'),
('staff:import', 'Staff Directory', 'Bulk Excel Import (Staff)', 'Bulk import staff personnel roster from Excel sheets'),
('staff:bulk_delete', 'Staff Directory', 'Bulk Delete Staff', 'Batch soft-delete multiple selected staff records')
ON CONFLICT (code) DO UPDATE SET 
  module = EXCLUDED.module,
  label = EXCLUDED.label,
  description = EXCLUDED.description;
