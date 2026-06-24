.PHONY: up down logs

up:
	docker build -t printmonitor-backend backend/
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f
