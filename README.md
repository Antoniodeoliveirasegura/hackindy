# HackIndy

HackIndy is a campus services web application combining a Node.js backend with a React + Vite frontend. The project integrates Purdue authentication, Supabase, campus schedules, dining, transit, and event-related functionality.

## Repository structure

- `server.mjs` - Node.js/Express backend entry point
- `auth.mjs`, `browser-auth.js`, `boardProfanity.mjs`, `nutrisliceDining.mjs`, `purdueCalendarAutomation.mjs`, `temp-dining-debug.js` - backend utilities and integrations
- `hackindy-react/` - frontend React application built with Vite
- `scripts/` - helper scripts such as `seed-test-user.mjs`
- `.env` - local environment configuration (should be kept secret)
- `supabase-schema.sql`, `supabase-board-only.sql` - database schema and board-related SQL

## Prerequisites

- Node.js 20+ (or a compatible active LTS version)
- npm
- Optional: Supabase project for backend data storage and auth

## Setup

1. Install root dependencies:

```bash
npm install
```

2. Install frontend dependencies:

```bash
cd hackindy-react
npm install
cd ..
```

3. Copy or create your `.env` file in the repository root.

### Required environment variables

The application uses these variables in `.env`:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PORT` - backend port (default: `3000`)
- `HOST` - backend host (default: `127.0.0.1`)
- `SESSION_SECRET` - Express session secret
- `CLIENT_APP_URL` - frontend URL for redirects (usually `http://localhost:5176`)
- `PURDUE_AUTH_MODE` - authentication mode, such as `mock` for development or `cas` for production
- `DEV_PURDUE_EMAIL` - development test email for mocked login flows

> Warning: Do not commit `.env` or secret keys to source control.

## Running the app locally

### Start the backend

From the repository root:

```bash
npm run dev
```

This launches `server.mjs` on the configured `HOST` and `PORT`.

### Start the frontend

From `hackindy-react/`:

```bash
cd hackindy-react
npm run dev
```

The Vite development server typically runs at `http://localhost:5176`.

## Frontend details

The React app lives in `hackindy-react/` and includes:

- `src/App.jsx` and route-based pages
- `src/components/` for layout, navigation, auth guards, and UI features
- `src/context/` for auth and theme state
- `src/lib/` for Supabase API helpers, transit utilities, schedule filters, and linkification

## Backend details

The backend uses:

- Express for HTTP routing
- `express-session` for session management
- `dotenv` for environment loading
- Supabase client for database access
- campus-specific integration scripts for Purdue auth, dining, calendar, and board tools

## Development helpers

- `scripts/seed-test-user.mjs` - seed a test user into the backend/store
- `hackindy-react/package.json` includes `lint`, `build`, and `preview` scripts for the frontend

## Deployment notes

- Ensure the Supabase URL and service role key are configured securely
- Use production-ready values for `SESSION_SECRET`
- Switch `PURDUE_AUTH_MODE` from `mock` to `cas` for live auth
- Build the frontend with `npm run build` inside `hackindy-react`

## Useful commands

From the repository root:

```bash
npm run dev
```

From the frontend folder:

```bash
cd hackindy-react
npm run dev
npm run build
npm run preview
npm run lint
```

## License

This repository does not include a license file. Add one if you intend to share or publish the project.
