# E2E Tests

## Prerequisites

1. Backend running: `cd backend && npm run dev` (port 5000)
2. Frontend running: `cd frontend && npm run dev` (use port **3001** if 3000 is taken)

```bash
# API smoke tests
cd backend && npm run test:api

# Playwright (from e2e/)
cd e2e && npm install && npx playwright install chromium
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm test
```

**Note:** Port 3000 may host another app on your machine. Stock Keeper E2E defaults to `http://localhost:3001`.
