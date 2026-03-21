# ============================================================
# RadiusServer – Multi-stage Dockerfile
# ============================================================
# Stage 1: Build TypeScript backend and React frontend
# Stage 2: Alpine runtime with PostgreSQL, FreeRADIUS, Node.js
# ============================================================

# --------------- Stage 1: Builder ---------------
FROM node:20-alpine AS builder

WORKDIR /build

# Backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --ignore-scripts

# Frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci

# Backend source & build
COPY backend/ ./backend/
RUN cd backend && npm run build

# Frontend source & build
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# --------------- Stage 2: Runtime ---------------
FROM alpine:3.21

LABEL maintainer="radiusserver" \
      description="Self-hosted AAA platform – FreeRADIUS + PostgreSQL + Web Admin"

# ---- Install system packages ----
RUN apk add --no-cache \
    postgresql17 postgresql17-contrib \
    freeradius freeradius-postgresql freeradius-utils \
    nodejs npm \
    supervisor \
    openssl curl bash coreutils tzdata \
    # Runtime libs needed by native node modules
    libc6-compat

# ---- Directory setup ----
RUN mkdir -p /var/lib/postgresql/data /run/postgresql /var/log/supervisor \
             /app/backend /app/frontend /app/scripts /app/database \
             /backup /etc/raddb/certs \
    && chown -R postgres:postgres /var/lib/postgresql /run/postgresql

# ---- Copy built backend ----
COPY --from=builder /build/backend/dist        /app/backend/
COPY --from=builder /build/backend/node_modules /app/backend/node_modules
COPY --from=builder /build/backend/package.json /app/backend/

# ---- Copy built frontend ----
COPY --from=builder /build/frontend/dist /app/frontend/

# ---- Copy database assets ----
COPY database/ /app/database/

# ---- Copy scripts ----
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# ---- Copy FreeRADIUS config ----
COPY freeradius/ /tmp/freeradius-custom/

# ---- Supervisor config ----
COPY scripts/supervisord.conf /etc/supervisord.conf

# ---- FreeRADIUS module & site symlinks ----
RUN cp /tmp/freeradius-custom/mods-available/sql   /etc/raddb/mods-available/sql && \
    cp /tmp/freeradius-custom/mods-available/exec_totp /etc/raddb/mods-available/exec_totp && \
    cp /tmp/freeradius-custom/sites-available/default /etc/raddb/sites-available/default && \
    cp /tmp/freeradius-custom/sites-available/radsec  /etc/raddb/sites-available/radsec && \
    cp /tmp/freeradius-custom/clients.conf            /etc/raddb/clients.conf && \
    cp /tmp/freeradius-custom/radiusd.conf            /etc/raddb/radiusd.conf && \
    ln -sf /etc/raddb/mods-available/sql       /etc/raddb/mods-enabled/sql && \
    ln -sf /etc/raddb/mods-available/exec_totp /etc/raddb/mods-enabled/exec_totp && \
    ln -sf /etc/raddb/sites-available/radsec   /etc/raddb/sites-enabled/radsec && \
    rm -rf /tmp/freeradius-custom && \
    chown -R radius:radius /etc/raddb

# ---- Expose ports ----
# 3000 = Web UI + API,  1812/udp = Auth,  1813/udp = Acct,  2083/tcp = RadSec
EXPOSE 3000 1812/udp 1813/udp 2083/tcp

# ---- Health check ----
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=45s \
    CMD /app/scripts/healthcheck.sh

# ---- Entrypoint ----
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
