-- Migration 0044: Add Bypass Validation & Form Stage-Gating Permission
-- Registers 'system:bypass_validation' in public.permissions

INSERT INTO public.permissions (code, module, label, description)
VALUES (
  'system:bypass_validation',
  'System',
  'Bypass Form Validation & Stage Gates',
  'Allows unrestricted multi-stage form navigation and draft saving without blocking on required fields or progressive stage gates'
)
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- Grant to Super Admin role
INSERT INTO public.role_permissions (role_id, permission_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'system:bypass_validation')
ON CONFLICT DO NOTHING;
