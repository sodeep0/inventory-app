# Stock Keeper — API Reference

Base URL: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5000/api` or production API host)

## Authentication

Protected routes require:

```
Authorization: Bearer <jwt>
```

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | API status |
| GET | `/health` | No | Health check |

## Auth (`/api/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{ username, email, password }` | Send verification code |
| POST | `/verify` | `{ email, code }` | Complete registration |
| POST | `/login` | `{ email, password }` | Returns JWT + user |
| POST | `/forgot-password` | `{ email }` | Send reset code |
| POST | `/verify-reset-code` | `{ email, code }` | Validate reset code |
| POST | `/reset-password` | `{ email, code, newPassword }` | Set new password |
| PUT | `/me` | `{ username }` | Update profile |
| PUT | `/password` | `{ currentPassword, newPassword }` | Change password |
| DELETE | `/me` | — | Delete account |

## Items (`/api/items`)

| Method | Path | Query / Body | Description |
|--------|------|--------------|-------------|
| GET | `/` | `page`, `limit`, `search`, `sort`, `category`, **`lowStock`** | List items (`lowStock=true` filters qty ≤ threshold) |
| GET | `/categories` | — | Distinct categories |
| GET | `/:id` | — | Single item |
| POST | `/` | Item body | Create (auto SKU) |
| PUT | `/:id` | Item body | Update |
| DELETE | `/:id` | — | Delete item + movements |
| POST | `/:id/adjust` | `{ delta, reason, type }` | Stock adjustment |
| POST | `/import` | `{ items: [...] }` | Bulk CSV import |

**Sort values:** `quantity`, `-quantity`, `name`, `-name`, `createdAt`, `-createdAt`

## Sales (`/api/sales`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | `{ itemId, quantity, customerName?, reason? }` | Record sale |

## Returns (`/api/returns`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | Return payload | Record return |
| POST | `/from-movement/:movementId` | — | Return from sale movement |

## Movements (`/api/movements`)

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/` | `page`, `limit`, **`search`**, **`type`**, **`sort`** | List movements |
| GET | `/item/:itemId` | `page`, `limit`, `startingQuantity?` | Item history + running qty |

**Type filter:** `sale`, `purchase`, `return`, `adjustment`, `initial`

**Sort values:** `createdAt`, `-createdAt`, `type`, `-type`, `delta`, `-delta`, `itemId`, `-itemId` (sorts by item name)

**Search:** Matches item name, SKU, or customer name (case-insensitive)

## Stats (`/api/stats`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard totals, recent movements, top items, **`lowStockList`** (up to 5) |

## Reports (`/api/reports`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Summary report |
| GET | `/movements-by-type` | Counts by movement type |

## Export (`/api/export`)

Requires `Authorization` header (no query token).

| Method | Path | Response |
|--------|------|----------|
| GET | `/items` | `items.csv` |
| GET | `/movements` | `movements.csv` |

## Error format

```json
{ "message": "Human-readable error" }
```

Common status codes: `400`, `401`, `404`, `409`, `422`, `429`, `500`
