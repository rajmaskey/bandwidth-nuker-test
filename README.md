# Bandwidth Nuker Web App

A full-stack TypeScript web app for high-concurrency bandwidth and request testing, with a React frontend, Express backend, and PostgreSQL via Drizzle ORM.

---

## Features
- Real-time bandwidth and request stats visualization
- Cyberpunk-style UI with Tailwind CSS and Framer Motion
- High-concurrency fetch requests from the browser
- Persistent test history (PostgreSQL)
- REST API for test management

---

## Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **PostgreSQL** database (local or cloud)

---

## Installation

1. **Clone the repository:**
   ```zsh
   git clone <repo-url>
   cd bandwidth-nuker-test
   ```

2. **Install dependencies:**
   ```zsh
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root directory with:
     ```env
     DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>
     PORT=5000
     ```

4. **Push database schema (run migrations):**
   ```zsh
   npm run db:push
   ```

---

## Development

Start the app in development mode (with hot reload):
```zsh
npm run dev
```
- The server and client will be available at `http://localhost:5000`.

---

## Build

To build both the client and server for production:
```zsh
npm run build
```
- Output will be in the `dist/` directory.

---

## Production Start

After building, start the production server:
```zsh
npm start
```

---

## Deployment (Render/PAAS)

### Render.com Example
1. **Create a new Web Service**
   - Environment: **Node**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Add environment variables: `DATABASE_URL`, `PORT` (Render sets `PORT` automatically)
2. **PostgreSQL**: Add a Render PostgreSQL instance and use its connection string for `DATABASE_URL`.
3. **Persistent Storage**: Not required for app, but database is required for history.

### General PAAS (Heroku, Railway, etc.)
- Set build command: `npm run build`
- Set start command: `npm start`
- Set environment variables: `DATABASE_URL`, `PORT`
- Ensure PostgreSQL is provisioned and accessible

---

## Notes
- CORS is enabled for all API routes.
- The app always listens on the `PORT` environment variable (default: 5000).
- For custom domains, configure your PAAS accordingly.

---

## Scripts
- `npm run dev` — Start in development mode
- `npm run build` — Build client and server
- `npm start` — Start production server
- `npm run db:push` — Push Drizzle ORM schema to database

---

## License
MIT
