# Troubleshooting

## Container Won't Start

**Check logs:**
```bash
docker compose logs -f
```

**Common issues:**
- Port conflict: Ensure ports 3000, 1812, 1813, 2083 are not in use
- Missing `.env` file: Copy from `.env.example`
- Permission errors: Check volume mount permissions

## RADIUS Authentication Failing

**Test with radtest:**
```bash
make test-radius USER=testuser PASS=testpassword
# or
docker compose exec radiusserver radtest testuser testpassword 127.0.0.1 0 testing123
```

**Check FreeRADIUS logs:**
```bash
docker compose exec radiusserver cat /var/log/radius/radius.log
```

**Common causes:**
- User not found in radcheck table
- User account disabled (`is_enabled = false`)
- Wrong RADIUS shared secret
- NAS client not configured in clients.conf or nas table

## Web Admin Not Accessible

**Check backend process:**
```bash
docker compose exec radiusserver supervisorctl status
```

**Check health endpoint:**
```bash
curl http://localhost:3000/api/health
```

## Database Connection Issues

**Check PostgreSQL status:**
```bash
docker compose exec radiusserver pg_isready -U radius
```

**Check database exists:**
```bash
docker compose exec radiusserver psql -U radius -d radius_db -c "SELECT 1;"
```

## TOTP Not Working

**Verify TOTP is enabled for user:**
```bash
docker compose exec radiusserver psql -U radius -d radius_db \
  -c "SELECT username, totp_enabled FROM radius_users WHERE username = 'testuser';"
```

**Test TOTP validation directly:**
```bash
docker compose exec radiusserver curl -s -X POST http://127.0.0.1:3000/api/internal/validate-totp \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: your-internal-secret" \
  -d '{"username": "testuser", "token": "123456"}'
```

## RadSec Issues

**Check certificates exist:**
```bash
docker compose exec radiusserver ls -la /etc/raddb/certs/
```

**Regenerate certificates:**
```bash
make certs
```

**Test TLS connection:**
```bash
openssl s_client -connect localhost:2083 -CAfile certs/ca.pem -cert certs/client.pem -key certs/client.key
```

## Performance

**Check active sessions count:**
```bash
docker compose exec radiusserver psql -U radius -d radius_db \
  -c "SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL;"
```

**Purge old records (via API or directly):**
```bash
docker compose exec radiusserver psql -U radius -d radius_db \
  -c "SELECT purge_old_records(90);"
```

## Reset Admin Password

If you've lost access to the admin panel:
```bash
docker compose exec radiusserver psql -U radius -d radius_db -c \
  "UPDATE admin_users SET password_hash = '\$2b\$12\$LJ3m4ys3Yz5.Ec4gmiMpYOQxBGuWMEMxzWqMYbYg2JbRbqGO3gyS2' WHERE username = 'admin';"
```
This resets the password to `ChangeMe123!`.
