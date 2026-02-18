.PHONY: run build test clean migrate-up migrate-down docker-up docker-down docker-logs

# Run the application
run:
	go run cmd/server/main.go

# Build the application
build:
	go build -o bin/server cmd/server/main.go

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Install dependencies
deps:
	go mod download
	go mod tidy

# Database migrations (requires golang-migrate)
migrate-up:
	migrate -path migrations -database "postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" up

migrate-down:
	migrate -path migrations -database "postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" down

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f backend

docker-restart:
	docker-compose restart backend

docker-rebuild:
	docker-compose build --no-cache backend
	docker-compose up -d

docker-clean:
	docker-compose down -v

# Run with hot reload (requires air)
dev:
	air

# Generate mocks for testing
mocks:
	go generate ./...

# Database operations
db-connect:
	docker exec -it collection_game_postgres psql -U postgres -d collection_game

valkey-cli:
	docker exec -it collection_game_valkey valkey-cli

# Health check
health:
	curl http://localhost/health

# Quick test APIs
test-register:
	curl -X POST http://localhost/api/v1/auth/register \
		-H "Content-Type: application/json" \
		-d '{"username":"testuser","email":"test@example.com","password":"Test1234!"}'

test-login:
	curl -X POST http://localhost/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"username":"testuser","password":"Test1234!"}'

