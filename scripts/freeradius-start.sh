#!/bin/sh
# Wait for PostgreSQL to be accepting connections before starting FreeRADIUS.
# This prevents FreeRADIUS SQL module from failing to initialize when
# the database is still starting up.

echo "[freeradius-start] Waiting for PostgreSQL to be ready..."
until pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; do
    sleep 1
done
echo "[freeradius-start] PostgreSQL is ready. Starting FreeRADIUS..."

exec /usr/sbin/radiusd -f -l stdout -u radius -g radius
