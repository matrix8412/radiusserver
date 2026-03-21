# Security

## Authentication

### Admin Web Panel
- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens stored in **httpOnly, Secure, SameSite=Strict** cookies
- Configurable token expiry (default: 24h)
- Rate limiting on login endpoint (10 attempts per 15 minutes)

### RADIUS Users
- **Cleartext-Password** stored in radcheck for PAP authentication
- Optional **TOTP** two-factor authentication via authenticator apps
- Account enable/disable and expiration controls

## Authorization

- **RBAC** with predefined roles: superadmin, operator, viewer
- 33 granular permissions across 11 categories
- Superadmin bypasses all permission checks
- System roles cannot be deleted

## Audit Trail

- All create/update/delete operations logged
- Captures: admin user, action, entity type, entity ID, details, IP address, timestamp
- Login/logout events tracked
- Queryable via admin panel with filters

## Network Security

- Only necessary ports exposed via Docker
- Internal PostgreSQL not exposed to host
- Internal API protected by shared secret header
- Helmet.js security headers (CSP, HSTS, etc.)
- CORS configured for same-origin

## RADIUS Security

- Shared secret for client authentication
- RadSec (RADIUS/TLS) on port 2083 with mutual TLS
- Self-signed CA with proper certificate chain
- TLS 1.2+ enforced for RadSec

## Best Practices

1. **Change default credentials** immediately after deployment
2. Set strong values for `JWT_SECRET`, `INTERNAL_SECRET`, and `RADIUS_SECRET`
3. Use an external PostgreSQL database for production
4. Enable RadSec for untrusted networks
5. Regular backups via the built-in backup script
6. Monitor audit logs for suspicious activity
7. Keep the container image updated
