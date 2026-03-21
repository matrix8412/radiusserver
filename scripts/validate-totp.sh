#!/bin/sh
# ============================================================
# RadiusServer – TOTP Validation Script
# ============================================================
# Called by FreeRADIUS exec module. Validates a TOTP token
# by calling the backend internal API.
#
# Arguments: $1 = username, $2 = TOTP token
# Exit: 0 = valid, 1 = invalid/error
# ============================================================

USERNAME="$1"
TOKEN="$2"

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
    exit 1
fi

RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "http://127.0.0.1:${APP_PORT:-3000}/api/internal/validate-totp" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Secret: ${INTERNAL_SECRET}" \
    --max-time 4 \
    --data-urlencode "username=${USERNAME}" \
    --data-urlencode "token=${TOKEN}")

if [ "$RESULT" = "200" ]; then
    exit 0
else
    exit 1
fi
