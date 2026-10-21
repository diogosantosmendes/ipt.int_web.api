# Generic API

Generic REST API for managing JSON collections, built with Node.js, TypeScript, Express and MongoDB.

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
MONGODB_DATABASE=generic_api
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

The tests cover generic collection CRUD using in-memory storage.

## Seed MongoDB

Place each seed dataset in a JSON file inside `seed/`. Each file must contain an array of JSON objects, and its filename (without `.json`) becomes the MongoDB collection name. For example, `seed/station.json` seeds the `station` collection.

`seed/station.json` stores each station's `pricePerKWh` tariff (between €0.13 and €0.19). `seed/charge.json` contains 500 sample sessions with ISO-8601 `timestamp`, `duration` in minutes, and `kWh` calculated from a 7.4, 11, or 22 kW charger rate. During seeding, each charge is assigned a random `stationId` referencing a station, its timestamp is converted to a JavaScript `Date` (stored by MongoDB as a BSON date), and `cost` is calculated as `kWh × station.pricePerKWh`, rounded to cents. The charge JSON intentionally has no `pricePerKWh` or `cost`; those are derived from the selected station at seed time.

Regenerate the sample charge data with:

```bash
npm run seed:generate-charges
```

Configure `MONGODB_URI` and optionally `MONGODB_DATABASE`, then run:

```bash
npm run seed
```

Each run replaces the contents of the corresponding collections, so this command is repeatable but destructive to existing documents in those collections.

## OpenAPI and Swagger UI

Endpoint documentation is written as `@openapi` comments in the generic controller and REST setup. The build generates the OpenAPI document from those comments:

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
| `GET` | `/classes/:entity/page?page=1&size=20` | List a page of records |
| `GET` | `/classes/:entity/count` | Count records matching filters |
| `GET` | `/classes/:entity/:id` | Get one record |
| `POST` | `/classes/:entity` | Create a record; MongoDB creates the collection on first insert |
| `PUT` | `/classes/:entity/:id` | Update a record with the supplied fields |
| `DELETE` | `/classes/:entity/:id` | Delete a record |
| `GET` | `/:studentNumber/:entity/page?page=1&size=20` | List a page of student-owned records |
| `GET` | `/:studentNumber/:entity/count` | Count student-owned records matching filters |
| `GET` | `/:studentNumber/:entity/:id` | Get a student-owned record |
| `POST` | `/:studentNumber/:entity` | Create a student-owned record |
| `PUT` | `/:studentNumber/:entity/:id` | Update a student-owned record |
| `DELETE` | `/:studentNumber/:entity/:id` | Delete a student-owned record |

Entity names must start with a letter and contain only letters, numbers, underscores, or hyphens. Student numbers must contain digits only. MongoDB stores class collections with the `classes_` prefix (for example, `/classes/music` uses `classes_music`) and student collections with the student number as the prefix (for example, `/20178/car` uses `20178_car`). When MongoDB is not configured, the same API uses isolated in-memory collections.

Paginated list endpoints accept `page` (1-based, default `1`), `size` (default `20`, maximum `100`), `sort` (for example, `sort=timestamp:desc,location:asc`), and filters under `filter`. Filters support scalar equality, arrays (matched with MongoDB `$in` semantics), nested fields, and the allowlisted operators `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, and `$exists`. For example, `filter[location][$exists]=true` checks for a present field, and `filter[timestamp][$gt]=2026-01-02` compares against a date value. URL-encode brackets and dollar signs when constructing requests. The matching `/count` endpoint accepts the same filters and ignores pagination and sort parameters. There is no unpaginated collection-list endpoint.

Create an artist:

```bash
curl -X POST http://localhost:3000/classes/artist \
  -H "Content-Type: application/json" \
  -d '{"name":"Nina Simone","genre":"Jazz"}'
```

Then list artists with `GET http://localhost:3000/classes/artist/page?page=1&size=20`. Use the returned `id` for item operations.

Students can use their student number as the route and collection prefix:

```bash
curl -X POST http://localhost:3000/20178/car \
  -H "Content-Type: application/json" \
  -d '{"brand":"Volvo","model":"240"}'
```

## Docker

Build the image:

```bash
docker build -t generic-api .
```

Run it with environment variables supplied at runtime:

```bash
docker run --rm -p 3000:3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017" \
  -e MONGODB_DATABASE=generic_api \
  generic-api
```

The Docker build creates `dist/server.js` and `dist/openapi.json`. The runtime image includes both files and installs only production dependencies.

## Deployment on Render

Create a Render Web Service using the repository's `Dockerfile`. Add these environment variables in Render:

- `MONGODB_URI`
- `MONGODB_DATABASE`
- `PORT` if required by the deployment configuration

For MongoDB Atlas, allow the Render service to connect in Atlas **Network Access** and verify that the database user, password and cluster hostname are correct. Never disable TLS certificate validation.
