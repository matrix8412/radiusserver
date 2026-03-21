# RADIUS Server — Self-Hosted AAA Platform

A production-ready, self-hosted Authentication, Authorization, and Accounting (AAA) platform with FreeRADIUS, PostgreSQL, and a modern TypeScript web admin panel — all running in a single Docker container on Alpine Linux.

## Features

- **FreeRADIUS 3.x** with PostgreSQL backend for user/group/NAS management
- **Modern Web Admin** — React 18 + Material UI + TypeScript
- **TOTP Two-Factor Authentication** for RADIUS users
- **RadSec (RADIUS over TLS)** support on port 2083
- **RBAC** — Role-based access control for admin users
- **Audit Logging** — Full audit trail of all admin actions
- **Dark/Light Theme** — User-selectable UI theme
- **i18n Ready** — Internationalization support (English included)
- **Single Container** — PostgreSQL + FreeRADIUS + Node.js in one Alpine container
- **Backup/Restore** — Built-in database backup and restore scripts
- **TLS Certificate Management** — Self-signed CA + server/client certificates
- **Health Monitoring** — Real-time service health checks

## Quick Start

```bash
# Clone the repository
git clone https://github.com/matrix8412/radiusserver.git
cd radiusserver

# Copy and customize environment variables
cp .env.example .env
# Edit .env with your settings (change passwords and secrets!)

# Build and start
docker compose up --build -d

# Check logs
docker compose logs -f
```

The admin panel will be available at **http://localhost:3000**

Default credentials:
- Username: `admin`
- Password: `ChangeMe123!`

> **Important:** Change the default admin password immediately after first login.

## Ports

| Port | Protocol | Service |
|------|----------|---------|
| 3000 | TCP | Web Admin Panel & API |
| 1812 | UDP | RADIUS Authentication |
| 1813 | UDP | RADIUS Accounting |
| 2083 | TCP | RadSec (RADIUS/TLS) |

## Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `POSTGRES_PASSWORD` — PostgreSQL password
- `JWT_SECRET` — Secret for JWT token signing
- `INTERNAL_SECRET` — Secret for internal API communication
- `RADIUS_SECRET` — Shared secret for RADIUS clients
- `DEFAULT_ADMIN_PASSWORD` — Initial admin password (first run only)

## Architecture

```
┌─────────────────────────────────────────────┐
│              Alpine Linux Container          │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │PostgreSQL│  │FreeRADIUS│  │ Node.js   │ │
│  │   :5432  │  │:1812/1813│  │  Backend  │ │
│  │          │  │  :2083   │  │   :3000   │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│       │              │              │        │
│       └──────────────┴──────────────┘        │
│              supervisord                     │
└─────────────────────────────────────────────┘
```

- **supervisord** manages all three processes
- **FreeRADIUS** queries PostgreSQL directly via its SQL module
- **Node.js Backend** serves the React SPA and REST API
- **TOTP validation** flows: FreeRADIUS → exec module → curl → Backend API

## Management

```bash
# Build
make build

# Start / Stop
make up
make down

# View logs
make logs

# Enter container shell
make shell

# Run database migrations
make migrate

# Backup database
make backup

# Restore from backup
make restore

# Generate TLS certificates
make certs

# Test RADIUS authentication
make test-radius USER=testuser PASS=testpass
```

## Project Structure

```
├── backend/                 # Express.js + TypeScript API
│   ├── src/
│   │   ├── config.ts       # Environment configuration
│   │   ├── db/             # Database pool
│   │   ├── middleware/      # Auth, RBAC, audit, rate limiting
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic layer
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Password, JWT, validators
│   └── tests/              # Unit tests
├── frontend/               # React 18 + Vite + MUI
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── i18n/           # Internationalization
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── database/
│   ├── migrations/         # SQL schema migrations
│   └── seeds/              # Initial seed data
├── freeradius/             # FreeRADIUS configuration
│   ├── mods-available/     # SQL and TOTP modules
│   └── sites-available/    # Virtual servers (default + radsec)
├── scripts/                # Container scripts
│   ├── entrypoint.sh       # Container initialization
│   ├── supervisord.conf    # Process manager config
│   ├── backup.sh           # Database backup
│   ├── restore.sh          # Database restore
│   ├── generate-certs.sh   # TLS certificate generation
│   └── validate-totp.sh    # TOTP validation wrapper
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # Multi-stage build
└── Makefile                # Convenience commands
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [RadSec](docs/RADSEC.md)
- [Backup & Restore](docs/BACKUP.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

MIT
