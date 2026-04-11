# AGENTS.md - Inventory App (Stock Keeper)

## Project Overview

Stock Keeper is a full-stack inventory management application with a Next.js frontend and Express.js backend, deployed on Vercel.

## Architecture

### Backend (`backend/`) - Express.js + TypeScript
- **Runtime:** Node.js with Express 5, TypeScript (compiled via `tsc`)
- **Database:** MongoDB via Mongoose (free tier Atlas)
- **Serverless:** Configured for Vercel serverless deployment (`vercel.json`)
- **Dev server:** `cd backend && npm run dev` (nodemon + ts-node)

**Directory structure:**
- `api/` - Route handlers (auth, items, sales, returns, movements)
- `models/` - Mongoose models
- `db/` - Database connection (Mongoose)
- `middleware/` - Rate limiting, error handling, DB connection check
- `services/` - Business logic
- `utils/` - Logger (winston), helpers
- `types/` - TypeScript type definitions
- `scripts/` - Utility scripts (e.g., clearCollections.ts)

**Key middleware:**
- `apiLimiter` / `authLimiter` - Rate limiting (stricter for auth)
- `checkDBConnection` - DB connectivity check on all `/api/` routes
- `errorHandler` / `notFound` - Centralized error handling

### Frontend (`frontend/`) - Next.js 15 + React 19
- **Framework:** Next.js 15.5 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Forms:** React Hook Form + Zod v4 validation
- **State:** React Context (in `contexts/`)
- **Dev server:** `cd frontend && npm run dev`
- **Lint:** `cd frontend && npm run lint`

**Directory structure (`frontend/src/`):**
- `app/` - Next.js App Router pages
- `components/` - React components (many dialog components for item/stock operations)
- `contexts/` - React context providers
- `lib/` - Utility libraries
- `types/` - TypeScript type definitions

## Design System

See `frontend/design-system.md` for the complete design spec. Key rules:
- **Primary color:** `#16697A` | **Accent:** `#FFA62B`
- **Background:** `#F8F8F8` | **Surface:** `#FFFFFF`
- **Font:** Inter (Regular, Medium, SemiBold)
- **Cards:** 12px radius, soft shadow `0px 4px 12px rgba(0,0,0,0.05)`
- **Buttons:** 8px radius, 12px/24px padding
- Minimalist, content-first approach with generous whitespace

## API Endpoints

- `GET /` - API status
- `GET /health` - Health check
- `/api/items` - Inventory item CRUD
- `/api/sales` - Sale recording
- `/api/returns` - Return management
- `/api/auth` - Authentication (rate limited)
- `/api/movements` - Stock movement history

## Development Commands

```bash
# Backend
cd backend && npm run dev      # Start dev server (port 5000)
cd backend && npm run build    # TypeScript compilation
cd backend && npm run clear-db # Clear collections

# Frontend
cd frontend && npm run dev     # Start Next.js dev server (port 3000)
cd frontend && npm run build   # Production build
cd frontend && npm run lint    # ESLint
```

## Environment Variables

- **Backend:** Requires `.env` (MongoDB URI, JWT secret, email config). See `.env.example`
- **Frontend:** Backend API URL in `.env.local`

## Conventions

- Use TypeScript throughout both frontend and backend
- Frontend uses absolute imports via `@/` alias
- Dialog components follow naming pattern: `<action>-item-dialog.tsx`, `<action>-stock-dialog.tsx`
- Backend uses centralized error handling, never return raw errors to clients
- All API routes under `/api/` have rate limiting and DB connection checks
- CORS is configured for Vercel frontend URLs and localhost
