# audentic-main

This is the core platform application for Audentic.

## Project Overview
- **Type:** Next.js Application
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui

## Commands
Run these commands from this directory:

- **Development:** `npm run dev` (Starts server on localhost)
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## Architecture
- **`src/app`**: Contains the App Router pages and API routes.
- **`src/components`**: Reusable React components.
- **`src/lib`**: Core utilities and helper functions.

## Configuration
- Environment variables are stored in `.env.local`. Copy from `.env.example`.
- Authentication is handled by Clerk.
- Database is PostgreSQL (hosted on Neon).
