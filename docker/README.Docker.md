# Docker Setup

## Building and running your application

When you're ready, start your application by running:
`docker compose -f docker/docker-compose.yml --env-file .env up --build`.

Your application will be available at `http://localhost:8080`.

To stop the application:
`docker compose -f docker/docker-compose.yml --env-file .env down -v`.
