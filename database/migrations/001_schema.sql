-- ============================================================
-- RadiusServer – Database Schema
-- ============================================================
-- Includes FreeRADIUS standard tables and custom extensions.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- FREERADIUS STANDARD TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS radcheck (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL DEFAULT '',
    attribute       VARCHAR(64) NOT NULL DEFAULT '',
    op              CHAR(2) NOT NULL DEFAULT ':=',
    value           VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_radcheck_username ON radcheck(username);

CREATE TABLE IF NOT EXISTS radreply (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL DEFAULT '',
    attribute       VARCHAR(64) NOT NULL DEFAULT '',
    op              CHAR(2) NOT NULL DEFAULT ':=',
    value           VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_radreply_username ON radreply(username);

CREATE TABLE IF NOT EXISTS radgroupcheck (
    id              BIGSERIAL PRIMARY KEY,
    groupname       VARCHAR(64) NOT NULL DEFAULT '',
    attribute       VARCHAR(64) NOT NULL DEFAULT '',
    op              CHAR(2) NOT NULL DEFAULT ':=',
    value           VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_radgroupcheck_groupname ON radgroupcheck(groupname);

CREATE TABLE IF NOT EXISTS radgroupreply (
    id              BIGSERIAL PRIMARY KEY,
    groupname       VARCHAR(64) NOT NULL DEFAULT '',
    attribute       VARCHAR(64) NOT NULL DEFAULT '',
    op              CHAR(2) NOT NULL DEFAULT ':=',
    value           VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_radgroupreply_groupname ON radgroupreply(groupname);

CREATE TABLE IF NOT EXISTS radusergroup (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL DEFAULT '',
    groupname       VARCHAR(64) NOT NULL DEFAULT '',
    priority        INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_radusergroup_username ON radusergroup(username);
CREATE INDEX IF NOT EXISTS idx_radusergroup_groupname ON radusergroup(groupname);

-- NAS / RADIUS clients (FreeRADIUS reads this with read_clients = yes)
CREATE TABLE IF NOT EXISTS nas (
    id              SERIAL PRIMARY KEY,
    nasname         VARCHAR(128) NOT NULL,
    shortname       VARCHAR(32),
    type            VARCHAR(30) DEFAULT 'other',
    ports           INTEGER,
    secret          VARCHAR(60) NOT NULL,
    server          VARCHAR(64),
    community       VARCHAR(50),
    description     VARCHAR(200) DEFAULT 'RADIUS Client'
);
CREATE INDEX IF NOT EXISTS idx_nas_nasname ON nas(nasname);

-- Accounting
CREATE TABLE IF NOT EXISTS radacct (
    radacctid           BIGSERIAL PRIMARY KEY,
    acctsessionid       VARCHAR(64) NOT NULL DEFAULT '',
    acctuniqueid        VARCHAR(32) NOT NULL DEFAULT '',
    username            VARCHAR(64) NOT NULL DEFAULT '',
    realm               VARCHAR(64) DEFAULT '',
    nasipaddress        VARCHAR(15) NOT NULL DEFAULT '',
    nasportid           VARCHAR(32) DEFAULT NULL,
    nasporttype         VARCHAR(32) DEFAULT NULL,
    acctstarttime       TIMESTAMPTZ DEFAULT NULL,
    acctupdatetime      TIMESTAMPTZ DEFAULT NULL,
    acctstoptime        TIMESTAMPTZ DEFAULT NULL,
    acctinterval        INTEGER DEFAULT NULL,
    acctsessiontime     INTEGER DEFAULT NULL,
    acctauthentic       VARCHAR(32) DEFAULT NULL,
    connectinfo_start   VARCHAR(128) DEFAULT NULL,
    connectinfo_stop    VARCHAR(128) DEFAULT NULL,
    acctinputoctets     BIGINT DEFAULT NULL,
    acctoutputoctets    BIGINT DEFAULT NULL,
    calledstationid     VARCHAR(50) NOT NULL DEFAULT '',
    callingstationid    VARCHAR(50) NOT NULL DEFAULT '',
    acctterminatecause  VARCHAR(32) NOT NULL DEFAULT '',
    servicetype         VARCHAR(32) DEFAULT NULL,
    framedprotocol      VARCHAR(32) DEFAULT NULL,
    framedipaddress     VARCHAR(15) NOT NULL DEFAULT '',
    framedipv6address   VARCHAR(45) NOT NULL DEFAULT '',
    framedipv6prefix    VARCHAR(45) NOT NULL DEFAULT '',
    framedinterfaceid   VARCHAR(44) NOT NULL DEFAULT '',
    delegatedipv6prefix VARCHAR(45) NOT NULL DEFAULT '',
    class               VARCHAR(64) DEFAULT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_radacct_acctuniqueid ON radacct(acctuniqueid);
CREATE INDEX IF NOT EXISTS idx_radacct_username ON radacct(username);
CREATE INDEX IF NOT EXISTS idx_radacct_acctsessionid ON radacct(acctsessionid);
CREATE INDEX IF NOT EXISTS idx_radacct_nasipaddress ON radacct(nasipaddress);
CREATE INDEX IF NOT EXISTS idx_radacct_acctstarttime ON radacct(acctstarttime);
CREATE INDEX IF NOT EXISTS idx_radacct_acctstoptime ON radacct(acctstoptime);
CREATE INDEX IF NOT EXISTS idx_radacct_start_username ON radacct(acctstarttime, username);

-- Post-auth logging  
CREATE TABLE IF NOT EXISTS radpostauth (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL DEFAULT '',
    pass            VARCHAR(64) NOT NULL DEFAULT '',
    reply           VARCHAR(32) NOT NULL DEFAULT '',
    authdate        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    class           VARCHAR(64) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_radpostauth_username ON radpostauth(username);
CREATE INDEX IF NOT EXISTS idx_radpostauth_authdate ON radpostauth(authdate);
CREATE INDEX IF NOT EXISTS idx_radpostauth_username_authdate ON radpostauth(username, authdate);

-- ============================================================
-- CUSTOM EXTENSION TABLES
-- ============================================================

-- Extended user information (beyond what FreeRADIUS needs)
CREATE TABLE IF NOT EXISTS radius_users (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(64) NOT NULL UNIQUE,
    display_name        VARCHAR(128),
    email               VARCHAR(255),
    enabled             BOOLEAN NOT NULL DEFAULT true,
    totp_enabled        BOOLEAN NOT NULL DEFAULT false,
    totp_secret         VARCHAR(128),
    totp_verified       BOOLEAN NOT NULL DEFAULT false,
    force_password_reset BOOLEAN NOT NULL DEFAULT false,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_radius_users_username ON radius_users(username);
CREATE INDEX IF NOT EXISTS idx_radius_users_enabled ON radius_users(enabled);

-- Groups metadata
CREATE TABLE IF NOT EXISTS radius_groups (
    id              SERIAL PRIMARY KEY,
    groupname       VARCHAR(64) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users (for web UI login)
CREATE TABLE IF NOT EXISTS admin_users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(128),
    email           VARCHAR(255),
    enabled         BOOLEAN NOT NULL DEFAULT true,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RBAC roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(64) NOT NULL UNIQUE,
    description     VARCHAR(255),
    is_system       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(128) NOT NULL UNIQUE,
    description     VARCHAR(255),
    category        VARCHAR(64) NOT NULL DEFAULT 'general'
);

-- Role → Permission mapping
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id         INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id   INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Admin → Role mapping
CREATE TABLE IF NOT EXISTS admin_user_roles (
    admin_id        BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

-- Audit log (admin actions)
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    admin_id        BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_username  VARCHAR(64),
    action          VARCHAR(64) NOT NULL,
    entity_type     VARCHAR(64),
    entity_id       VARCHAR(64),
    details         JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- System settings (key-value store for RADIUS/app config)
CREATE TABLE IF NOT EXISTS system_settings (
    key             VARCHAR(128) PRIMARY KEY,
    value           TEXT,
    description     VARCHAR(255),
    category        VARCHAR(64) NOT NULL DEFAULT 'general',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Certificate metadata tracking
CREATE TABLE IF NOT EXISTS certificate_metadata (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(128) NOT NULL,
    cert_type       VARCHAR(32) NOT NULL, -- 'ca', 'server', 'client'
    subject         VARCHAR(255),
    issuer          VARCHAR(255),
    serial_number   VARCHAR(64),
    not_before      TIMESTAMPTZ,
    not_after       TIMESTAMPTZ,
    fingerprint     VARCHAR(95),
    file_path       VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes           TEXT
);

-- ============================================================
-- RETENTION HELPER: function to purge old records
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_records(
    p_table_name TEXT,
    p_date_column TEXT,
    p_retention_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    EXECUTE format(
        'DELETE FROM %I WHERE %I < NOW() - INTERVAL ''%s days''',
        p_table_name, p_date_column, p_retention_days
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_radius_users_updated') THEN
        CREATE TRIGGER trg_radius_users_updated BEFORE UPDATE ON radius_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_users_updated') THEN
        CREATE TRIGGER trg_admin_users_updated BEFORE UPDATE ON admin_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_system_settings_updated') THEN
        CREATE TRIGGER trg_system_settings_updated BEFORE UPDATE ON system_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;
