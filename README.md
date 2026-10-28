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
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id
```

When `MONGODB_URI` is not set, the API uses an in-memory repository. Do not commit `.env` or place database credentials in the Dockerfile.

The API requires `GOOGLE_CLIENT_ID` at startup. It is the public OAuth 2.0 **Web application** client ID used by the frontend. The API validates Google's signed ID tokens against Google's public signing keys and this audience; no client secret is needed by the API.

### Google sign-in setup

Google OAuth sign-in has no charge for this use. You do not need to create an Entra application or a Google service account.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Open **Google Auth Platform** and configure the app branding and audience ([Google setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)). Choose **Internal** only if IPT provides a Google Workspace organization and all users sign in through it. Otherwise choose **External** and add student Google accounts as test users while the app is in testing; publishing or verification requirements depend on the app and scopes.
3. Under **Google Auth Platform → Clients**, create an OAuth client with application type **Web application**. Add the frontend's development and production origins under **Authorized JavaScript origins** (for example, `http://localhost:5173` and `https://your-frontend.example`). This API uses the Google Identity Services JavaScript credential flow, so no redirect URI is needed.
4. Use only the basic `openid`, `email`, and `profile` sign-in claims. Copy the client ID ending in `.apps.googleusercontent.com` to `GOOGLE_CLIENT_ID` in the API environment and use the same client ID in the frontend's Google Identity Services configuration. The client ID is public; do not put a client secret in the frontend or this API.
5. In the frontend, use Google Identity Services to obtain its `credential` ID token and send it with API calls as `Authorization: Bearer <google-id-token>`. The API checks its signature, issuer, expiration, audience, Google-verified email, and exact `@ipt.pt` suffix ([Google token verification guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)). The frontend must send the **ID token**, not an OAuth access token.

The IPT email domain is currently Microsoft-managed, not necessarily a Google Workspace domain. Students can use Google sign-in with an `@ipt.pt` address only if that address is registered and verified as a Google Account. Without Google Workspace, Google will not issue the `hd` (hosted-domain) claim, so the API allows the verified email suffix but cannot prove that the account is managed by IPT. If IPT requires organization-managed identities, an administrator must enable Google Workspace/Cloud Identity for `ipt.pt`, or provide access to an identity provider that supports the existing Microsoft accounts.

The API does not provide a login page, OAuth callback, or session. `/health`, `/docs`, and `/openapi.json` remain public; all CRUD endpoints require the Google ID token. Student-number URLs currently require sign-in but are not checked against the signed-in email.

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

All CRUD endpoints require a Google ID token with a verified `@ipt.pt` email. `/health`, `/docs`, and `/openapi.json` remain public. A student-number URL is currently only gated by IPT email verification; the API does not yet verify that the number belongs to the signed-in user. Add that ownership check when the student-number-to-email mapping is defined.

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
- `GOOGLE_CLIENT_ID`

For MongoDB Atlas, allow the Render service to connect in Atlas **Network Access** and verify that the database user, password and cluster hostname are correct. Never disable TLS certificate validation.
