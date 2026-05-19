# Stock Keeper — Architecture

## System overview

```
┌─────────────────┐     HTTPS      ┌──────────────────────────────┐
│  Next.js 15     │ ──────────────▶│  Express 5 API (Vercel/Node) │
│  Frontend       │   JWT Bearer   │  TypeScript + Mongoose       │
│  (App Router)   │◀──────────────│  MongoDB Atlas               │
└─────────────────┘                └──────────────────────────────┘
```

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind v4, shadcn/ui |
| Backend | Express 5, TypeScript, Joi validation |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (stored client-side in localStorage) |
| Email | Nodemailer (verification, reset, low-stock) |
| Deploy | Vercel (frontend + serverless API) |

## Repository layout

```
inventory-app/
├── backend/
│   ├── api/           # Route handlers
│   ├── models/        # Mongoose schemas
│   ├── middleware/    # auth, validation, rate limit, errors
│   ├── services/      # skuService, emailService
│   ├── scripts/       # DB utilities & migrations
│   └── index.ts       # Express app entry
├── frontend/
│   └── src/
│       ├── app/       # Pages (App Router)
│       ├── components/
│       ├── contexts/  # AuthContext
│       └── lib/       # api client, utils, export helper
└── docs/              # Product & technical documentation
```

## Data model

### User

- `email`, `username`, `password` (hashed)
- Verification codes via separate `Verification` collection (pending signups)

### Item

- Scoped by `userId`
- **SKU unique per user** (`{ userId, sku }` compound index)
- `quantity`, `lowStockThreshold`, prices, `category`, `tags`, `supplierName`, `status`

### StockMovement

- Types: `sale`, `return`, `adjustment`, `purchase`, `initial`
- `delta` (+/- quantity), optional `customerName`, `reason`
- Linked to `itemId` and `userId`

## Security

| Concern | Approach |
|---------|----------|
| Authentication | JWT in `Authorization: Bearer` header |
| Authorization | All item/movement queries filter by `req.user._id` |
| Rate limiting | `apiLimiter` on `/api/*`, `authLimiter` on auth routes |
| Export | Same JWT middleware as other routes (no token in URL) |
| CORS | Configured for frontend origin |
| Errors | Centralized handler; no raw stack traces to clients |

## Key API modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Register, verify, login, password reset, profile |
| `items` | CRUD, adjust, import, categories, low-stock filter |
| `sales` / `returns` | Stock-changing transactions |
| `movements` | Paginated history with search/type/sort |
| `stats` | Dashboard aggregates + low-stock preview |
| `reports` | Financial summaries |
| `export` | CSV download |

## Frontend architecture

- **Auth:** `AuthContext` + `withAuth` HOC for protected pages
- **API:** Shared `apiClient` (axios) with interceptors for token and 401
- **State:** Local component state; no global inventory store
- **PWA:** Service worker caches app shell; API always network-first

## Deployment

- `vercel.json` routes API to serverless functions
- Env: `MONGODB_URI`, `JWT_SECRET`, SMTP vars, `FRONTEND_URL`

## Migrations

Run SKU migration after deploying model change:

```bash
cd backend && npm run migrate:sku-per-user
```

## Related docs

- [API Reference](./API.md)
- [Product](./product.md)
- [Roadmap](./ROADMAP.md)
