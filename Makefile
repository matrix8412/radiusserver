.PHONY: build up down logs shell migrate seed backup restore certs status restart clean

# Build the Docker image
build:
	docker compose build

# Start all services
up:
	docker compose up --build -d

# Stop all services
down:
	docker compose down

# View logs
logs:
	docker compose logs -f

# Open a shell inside the container
shell:
	docker compose exec radiusserver bash

# Run database migrations manually
migrate:
	docker compose exec radiusserver bash /app/scripts/entrypoint.sh migrate

# Run database seed
seed:
	docker compose exec radiusserver bash -c "PGPASSWORD=\$$POSTGRES_PASSWORD psql -U \$$POSTGRES_USER -d \$$POSTGRES_DB -f /app/database/seeds/001_seed.sql"

# Create a database backup
backup:
	docker compose exec radiusserver /app/scripts/backup.sh

# Restore from latest backup
restore:
	docker compose exec radiusserver /app/scripts/restore.sh

# Generate development TLS certificates
certs:
	docker compose exec radiusserver /app/scripts/generate-certs.sh

# Show service status
status:
	docker compose ps

# Restart services
restart:
	docker compose restart

# Remove everything including volumes (DESTRUCTIVE)
clean:
	docker compose down -v --rmi local

# Run backend tests locally (requires Node.js)
test-backend:
	cd backend && npm test

# Run frontend tests locally (requires Node.js)
test-frontend:
	cd frontend && npm test

# RADIUS auth test (requires radtest)
test-radius:
	docker compose exec radiusserver radtest testuser testpass 127.0.0.1 0 testing123
