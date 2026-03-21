#!/bin/bash
# ============================================================
# RadiusServer – Health Check
# ============================================================
# Checks: PostgreSQL, FreeRADIUS, Backend API
# Exit 0 = healthy, Exit 1 = unhealthy
# ============================================================

# Check PostgreSQL
pg_isready -h 127.0.0.1 -p 5432 -U "${POSTGRES_USER:-radius}" -q || {
    echo "PostgreSQL is not ready"
    exit 1
}

# Check backend API
curl -sf http://127.0.0.1:${APP_PORT:-3000}/api/health > /dev/null || {
    echo "Backend API is not responding"
    exit 1
}

# Check FreeRADIUS (verify process is running)
pgrep -x radiusd > /dev/null || {
    echo "FreeRADIUS is not running"
    exit 1
}

exit 0
