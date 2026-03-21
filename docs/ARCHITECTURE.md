# Architecture

## Overview

The RADIUS Server AAA platform runs as a single Docker container with three main processes managed by supervisord:

1. **PostgreSQL 17** — Primary data store
2. **FreeRADIUS 3.x** — RADIUS protocol server
3. **Node.js 20** — Web admin backend + frontend SPA

## Data Flow

### RADIUS Authentication (PAP)

```
RADIUS Client → FreeRADIUS :1812/UDP
    → authorize: SQL module (lookup radcheck)
    → authorize: Check account enabled
    → authorize: Extract TOTP from password (if enabled)
    → authenticate: PAP module
    → post-auth: Validate TOTP (if enabled, via exec → curl → backend)
    → post-auth: SQL module (log to radpostauth)
```

### RADIUS Accounting

```
RADIUS Client → FreeRADIUS :1813/UDP
    → accounting: SQL module (radacct table)
    → Start/Interim-Update/Stop records
```

### Web Admin API

```
Browser → Node.js :3000
    → Express middleware (auth, RBAC, audit, rate limit)
    → Route handler
    → Service layer
    → PostgreSQL queries
```

### TOTP Validation

```
FreeRADIUS post-auth
    → exec_totp module
    → validate-totp.sh
    → curl POST /api/internal/validate-totp
    → Node.js validates TOTP token via otplib
    → Returns accept/reject
```

## Database Schema

### Standard FreeRADIUS Tables
- `radcheck` — Per-user check attributes
- `radreply` — Per-user reply attributes
- `radgroupcheck` — Per-group check attributes
- `radgroupreply` — Per-group reply attributes
- `radusergroup` — User-to-group mappings
- `radacct` — Accounting records
- `radpostauth` — Post-auth logging
- `nas` — NAS/client devices

### Custom Extension Tables
- `radius_users` — Extended user profiles (full name, email, TOTP, etc.)
- `radius_groups` — Extended group metadata
- `admin_users` — Web admin accounts
- `admin_roles` — Role definitions
- `admin_permissions` — Permission definitions
- `admin_role_permissions` — Role-to-permission mappings
- `admin_user_roles` — User-to-role mappings
- `audit_log` — Admin action audit trail
- `system_settings` — Key-value settings store
- `certificate_metadata` — TLS certificate tracking

## Security Layers

1. **Network**: Only required ports exposed (3000, 1812, 1813, 2083)
2. **Authentication**: JWT in httpOnly cookies, bcrypt password hashing
3. **Authorization**: RBAC with granular permissions
4. **Audit**: All admin actions logged with IP, timestamp, details
5. **Rate Limiting**: Express rate-limit on login and API endpoints
6. **Headers**: Helmet.js security headers + CSP
7. **RADIUS**: Shared secrets, RadSec (TLS), TOTP support
