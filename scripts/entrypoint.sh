#!/bin/bash
set -e

# ============================================================
# RadiusServer – Container Entrypoint
# ============================================================
# 1. Initializes PostgreSQL if needed
# 2. Runs database migrations
# 3. Seeds default data on first run
# 4. Generates dev certificates if missing
# 5. Starts supervisord (PostgreSQL → FreeRADIUS → Backend)
# ============================================================

PGDATA="/var/lib/postgresql/data"
DB_NAME="${POSTGRES_DB:-radius}"
DB_USER="${POSTGRES_USER:-radius}"
DB_PASS="${POSTGRES_PASSWORD:-changeme}"
MIGRATION_DIR="/app/database/migrations"
SEED_DIR="/app/database/seeds"
FIRST_RUN_FLAG="/var/lib/postgresql/.initialized"

log() {
    echo "[entrypoint] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# ---- Initialize PostgreSQL data directory ----
init_postgres() {
    if [ ! -s "$PGDATA/PG_VERSION" ]; then
        log "Initializing PostgreSQL data directory..."
        chown -R postgres:postgres "$PGDATA"
        su - postgres -c "initdb -D $PGDATA --auth=trust --encoding=UTF8 --locale=C"

        # Configure pg_hba.conf for local trust + md5 for TCP
        cat > "$PGDATA/pg_hba.conf" <<EOF
local   all   all                 trust
host    all   all   127.0.0.1/32  md5
host    all   all   ::1/128       md5
EOF
        log "PostgreSQL data directory initialized."
    fi
}

# ---- Start PostgreSQL temporarily for setup ----
start_postgres_temp() {
    log "Starting PostgreSQL for setup..."
    su - postgres -c "pg_ctl start -D $PGDATA -l /var/log/postgresql/init.log -o \"-c listen_addresses='127.0.0.1' -c port=5432\" -w -t 30"
    log "PostgreSQL started."
}

# ---- Stop temporary PostgreSQL ----
stop_postgres_temp() {
    log "Stopping temporary PostgreSQL..."
    su - postgres -c "pg_ctl stop -D $PGDATA -m fast -w" 2>/dev/null || true
}

# ---- Create database and user ----
create_db() {
    # Create user if not exists
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\" | grep -q 1" || {
        log "Creating database user '$DB_USER'..."
        su - postgres -c "psql -c \"CREATE USER \\\"$DB_USER\\\" WITH PASSWORD '$DB_PASS'\""
    }

    # Create database if not exists
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\" | grep -q 1" || {
        log "Creating database '$DB_NAME'..."
        su - postgres -c "psql -c \"CREATE DATABASE \\\"$DB_NAME\\\" OWNER \\\"$DB_USER\\\"\""
    }

    # Grant privileges
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE \\\"$DB_NAME\\\" TO \\\"$DB_USER\\\"\""
    su - postgres -c "psql -d \"$DB_NAME\" -c \"GRANT ALL ON SCHEMA public TO \\\"$DB_USER\\\"\""
}

# ---- Run migrations ----
run_migrations() {
    log "Running database migrations..."
    for f in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$f" ]; then
            log "  Applying $(basename "$f")..."
            PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -d "$DB_NAME" -h 127.0.0.1 -f "$f" 2>&1 || {
                log "  Warning: migration $(basename "$f") had errors (may already be applied)."
            }
        fi
    done
    log "Migrations complete."
}

# ---- Seed data on first run ----
seed_data() {
    if [ ! -f "$FIRST_RUN_FLAG" ]; then
        log "First run detected. Seeding data..."
        for f in "$SEED_DIR"/*.sql; do
            if [ -f "$f" ]; then
                log "  Seeding $(basename "$f")..."
                PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -d "$DB_NAME" -h 127.0.0.1 -f "$f" 2>&1 || {
                    log "  Warning: seed $(basename "$f") had errors."
                }
            fi
        done
        touch "$FIRST_RUN_FLAG"
        log "Seeding complete."
    else
        log "Not first run – skipping seed."
    fi
}

# ---- Generate self-signed certificates if missing ----
generate_certs_if_missing() {
    local CERT_DIR="/etc/raddb/certs"
    if [ ! -f "$CERT_DIR/server.pem" ]; then
        log "Generating development TLS certificates..."
        /app/scripts/generate-certs.sh
        log "Certificates generated."
    else
        log "Certificates already exist – skipping generation."
    fi
}

# ---- Write FreeRADIUS client secrets from env ----
configure_radius() {
    # Inject DB credentials into FreeRADIUS SQL module config
    sed -i "s|%%POSTGRES_DB%%|${DB_NAME}|g"   /etc/raddb/mods-available/sql
    sed -i "s|%%POSTGRES_USER%%|${DB_USER}|g"  /etc/raddb/mods-available/sql
    sed -i "s|%%POSTGRES_PASSWORD%%|${DB_PASS}|g" /etc/raddb/mods-available/sql
    sed -i "s|%%INTERNAL_SECRET%%|${INTERNAL_SECRET}|g" /etc/raddb/mods-available/exec_totp

    # Inject secret into clients.conf
    sed -i "s|%%RADIUS_SECRET%%|${RADIUS_SECRET:-testing123}|g" /etc/raddb/clients.conf

    # RadSec toggle
    if [ "${RADSEC_ENABLED}" != "true" ]; then
        rm -f /etc/raddb/sites-enabled/radsec 2>/dev/null || true
        log "RadSec disabled."
    else
        log "RadSec enabled."
    fi

    chown -R radius:radius /etc/raddb
}

# ---- Graceful shutdown handler ----
shutdown_handler() {
    log "Received shutdown signal. Stopping services..."
    supervisorctl stop all 2>/dev/null || true
    log "All services stopped."
    exit 0
}

trap shutdown_handler SIGTERM SIGINT SIGQUIT

# ---- Main ----
main() {
    log "=== RadiusServer starting ==="

    init_postgres
    start_postgres_temp
    create_db
    run_migrations
    seed_data
    stop_postgres_temp

    generate_certs_if_missing
    configure_radius

    log "Starting supervisord..."
    exec /usr/bin/supervisord -c /etc/supervisord.conf
}

# Allow running just migrations
if [ "${1}" = "migrate" ]; then
    start_postgres_temp
    run_migrations
    stop_postgres_temp
    exit 0
fi

main
