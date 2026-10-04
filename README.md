# ParkEase

A parking discovery and booking app: browse parking lots, view real-time slot
availability on a map, reserve a slot for one of your vehicles, and manage
your bookings.

```
ParkEase/
├── backend/     Express + PostgreSQL API (port 5000)
├── frontend/    React + Vite client (port 5173 in dev)
└── README.md
```

## 1. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (copy `.env.example`) and fill in your
real local values:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parkease
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
```

You need a PostgreSQL database with `users`, `lots`, `slots`, `vehicles`,
and `bookings` tables already created (this project does not include a
schema migration — it assumes your existing database).

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:5000`.

## 2. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (copy `.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

To build for production:

```bash
npm run build
```

## API endpoints

| Method | Path                        | Auth required |
|--------|-----------------------------|---------------|
| POST   | `/api/auth/register`        | No            |
| POST   | `/api/auth/login`           | No            |
| GET    | `/api/lots`                 | No            |
| GET    | `/api/slots`                | No            |
| POST   | `/api/vehicles`             | Yes           |
| GET    | `/api/vehicles`             | Yes           |
| POST   | `/api/bookings`             | Yes           |
| GET    | `/api/my-bookings`          | Yes           |
| PATCH  | `/api/bookings/:id/cancel`  | Yes           |

Authenticated requests need `Authorization: Bearer <token>` from the login
response.

## Notes

- `GET /api/lots` only returns lots that have `latitude`/`longitude` set in
  the database — this is existing backend behavior, unchanged.
- The map on the Explore page only plots lots that have coordinates; lots
  without them still appear in the list, just not on the map.

## Pricing & slot data migration

If your existing data has all slots priced at a single flat rate (e.g. ₹50/hr)
and/or is missing bike/scooter slots, run the migration once against your
real database:

```bash
psql -U <your_db_user> -d <your_db_name> -f backend/migrations/002_fix_pricing_and_slots.sql
```

This is safe to run on production data:
- It only **updates** `price_per_hour` on existing rows (car → ₹30/hr, bike/scooter → ₹15/hr).
- It only **inserts** new slot rows for a lot if that lot has zero slots of a given type yet (idempotent — safe to re-run).
- It **never deletes** rows and never touches `users`, `vehicles`, or `bookings`.
- It syncs `lots.total_slots` to the real slot count per lot, which is what fixes incorrect "Total Capacity"/"Available Slots" numbers on the dashboard.
