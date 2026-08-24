# Movies API

REST API for managing movies, built with Node.js, TypeScript, Express and MongoDB.

## Requirements

- Node.js 22 or later
- npm
- MongoDB, if persistence is required
- Docker, for containerized deployment

## Configuration

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Available variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=movies_api
```

When `MONGODB_URI` is not set, the API uses an in-memory repository. Do not commit `.env` or place database credentials in the Dockerfile.

For MongoDB Atlas, use a connection string such as:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?appName=PROJECT
```

URL-encode special characters in the database password. On Render, configure these values in the service's Environment Variables settings.

## Install

```bash
npm install
```

## Run locally

Build the API and start the production bundle:

```bash
npm start
```

For development with automatic rebuilds:

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default.

## Tests

Run the unit test suite with Jest:

```bash
npm test
```

The tests cover the `Movie` entity and the movie use cases using the in-memory repository.

## OpenAPI and Swagger UI

Endpoint documentation is written as `@openapi` comments in the controllers and REST setup. The build generates the OpenAPI document from those comments:

```bash
npm run generate:openapi
```

`npm run build` runs this command automatically and writes the generated file to `dist/openapi.json`.

When the API is running:

- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
- Health check: `/health`

Local URLs:

- http://localhost:3000/docs
- http://localhost:3000/openapi.json

Production Swagger UI:

- https://ipt-int-web-api.onrender.com/docs

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Check API health |
| `GET` | `/movies` | List all movies |
| `GET` | `/movies/:id` | Get a movie |
| `POST` | `/movies` | Create a movie |
| `PUT` | `/movies/:id` | Update a movie |
| `DELETE` | `/movies/:id` | Delete a movie |

Example request:

```bash
curl -X POST http://localhost:3000/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"The Matrix","director":"The Wachowskis","year":1999,"genre":"Science fiction"}'
```

## Docker

Build the image:

```bash
docker build -t movies-api .
```

Run it with environment variables supplied at runtime:

```bash
docker run --rm -p 3000:3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017" \
  -e MONGODB_DATABASE=movies_api \
  movies-api
```

The Docker build creates `dist/server.js` and `dist/openapi.json`. The runtime image includes both files and installs only production dependencies.

## Deployment on Render

Create a Render Web Service using the repository's `Dockerfile`. Add these environment variables in Render:

- `MONGODB_URI`
- `MONGODB_DATABASE`
- `PORT` if required by the deployment configuration

For MongoDB Atlas, allow the Render service to connect in Atlas **Network Access** and verify that the database user, password and cluster hostname are correct. Never disable TLS certificate validation.
