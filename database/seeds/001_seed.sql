-- ============================================================
-- RadiusServer – Seed Data
-- ============================================================
-- Creates default admin, roles, permissions, and sample NAS.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================

-- ---- Default Roles ----
INSERT INTO admin_roles (name, description, is_system) VALUES
    ('superadmin', 'Full system access – all permissions', true),
    ('operator', 'Day-to-day operations – user and NAS management', true),
    ('viewer', 'Read-only access to dashboards and logs', true)
ON CONFLICT (name) DO NOTHING;

-- ---- Permissions ----
INSERT INTO admin_permissions (name, description, category) VALUES
    -- Users
    ('users.view',       'View RADIUS users',             'users'),
    ('users.create',     'Create RADIUS users',           'users'),
    ('users.edit',       'Edit RADIUS users',             'users'),
    ('users.delete',     'Delete RADIUS users',           'users'),
    ('users.totp',       'Manage user TOTP',              'users'),
    -- Groups
    ('groups.view',      'View groups',                   'groups'),
    ('groups.create',    'Create groups',                 'groups'),
    ('groups.edit',      'Edit groups',                   'groups'),
    ('groups.delete',    'Delete groups',                 'groups'),
    -- Attributes
    ('attributes.view',  'View RADIUS attributes',        'attributes'),
    ('attributes.create','Create RADIUS attributes',      'attributes'),
    ('attributes.edit',  'Edit RADIUS attributes',        'attributes'),
    ('attributes.delete','Delete RADIUS attributes',      'attributes'),
    -- NAS
    ('nas.view',         'View NAS devices',              'nas'),
    ('nas.create',       'Create NAS devices',            'nas'),
    ('nas.edit',         'Edit NAS devices',              'nas'),
    ('nas.delete',       'Delete NAS devices',            'nas'),
    -- Logs
    ('logs.view',        'View auth and accounting logs', 'logs'),
    ('logs.purge',       'Purge old log records',         'logs'),
    -- Admins
    ('admins.view',      'View admin users',              'admins'),
    ('admins.create',    'Create admin users',            'admins'),
    ('admins.edit',      'Edit admin users',              'admins'),
    ('admins.delete',    'Delete admin users',            'admins'),
    -- Roles
    ('roles.view',       'View roles',                    'roles'),
    ('roles.create',     'Create roles',                  'roles'),
    ('roles.edit',       'Edit roles',                    'roles'),
    ('roles.delete',     'Delete roles',                  'roles'),
    -- Settings
    ('settings.view',    'View system settings',          'settings'),
    ('settings.edit',    'Edit system settings',          'settings'),
    -- Certificates
    ('certificates.view','View certificate metadata',     'certificates'),
    ('certificates.manage','Manage certificates',         'certificates'),
    -- Audit
    ('audit.view',       'View audit log',                'audit'),
    -- Health
    ('health.view',      'View system health',            'health')
ON CONFLICT (name) DO NOTHING;

-- ---- Assign ALL permissions to superadmin ----
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- ---- Assign operator permissions ----
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'operator'
  AND p.name IN (
    'users.view','users.create','users.edit','users.totp',
    'groups.view','groups.create','groups.edit',
    'attributes.view','attributes.create','attributes.edit',
    'nas.view','nas.create','nas.edit',
    'logs.view',
    'health.view'
  )
ON CONFLICT DO NOTHING;

-- ---- Assign viewer permissions ----
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'users.view','groups.view','attributes.view','nas.view',
    'logs.view','audit.view','health.view','settings.view',
    'certificates.view'
  )
ON CONFLICT DO NOTHING;

-- ---- Default Admin Account ----
-- Password: ChangeMe123! (bcrypt hash, 12 rounds)
-- IMPORTANT: Change this password immediately after first login!
INSERT INTO admin_users (username, password_hash, display_name, enabled)
VALUES (
    'admin',
    '$2b$12$LJ3m4ys3Lg8xHwZGOPgiRu8sHbfJNGTqhGRFhYqXtFOmGSqFh5.vy',
    'System Administrator',
    true
)
ON CONFLICT (username) DO NOTHING;

-- ---- Assign superadmin role to default admin ----
INSERT INTO admin_user_roles (admin_id, role_id)
SELECT a.id, r.id
FROM admin_users a
CROSS JOIN admin_roles r
WHERE a.username = 'admin' AND r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- ---- Default System Settings ----
INSERT INTO system_settings (key, value, description, category) VALUES
    ('radius.auth_port',         '1812',     'RADIUS authentication port',           'radius'),
    ('radius.acct_port',         '1813',     'RADIUS accounting port',               'radius'),
    ('radius.radsec_port',       '2083',     'RadSec (RADIUS over TLS) port',        'radius'),
    ('radius.max_request_time',  '30',       'Max seconds to process a request',     'radius'),
    ('radius.cleanup_delay',     '5',        'Seconds before cleaning up a request', 'radius'),
    ('radius.reject_delay',      '1',        'Seconds to delay Access-Reject',       'radius'),
    ('retention.auth_log_days',  '90',       'Days to keep authentication logs',     'retention'),
    ('retention.acct_log_days',  '180',      'Days to keep accounting records',       'retention'),
    ('retention.audit_log_days', '365',      'Days to keep admin audit logs',        'retention'),
    ('security.max_login_attempts', '5',     'Max failed admin login attempts',      'security'),
    ('security.lockout_minutes',    '15',    'Account lockout duration in minutes',  'security'),
    ('radsec.enabled',           'true',     'Enable RadSec (RADIUS over TLS)',      'radsec'),
    ('app.name',                 'RadiusServer', 'Application display name',         'app')
ON CONFLICT (key) DO NOTHING;

-- ---- Default localhost NAS for testing ----
INSERT INTO nas (nasname, shortname, type, secret, description)
VALUES ('127.0.0.1', 'localhost', 'other', 'testing123', 'Localhost testing client')
ON CONFLICT DO NOTHING;
