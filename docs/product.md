# Stock Keeper — Product Specification

## Vision

Stock Keeper helps small shops and solo operators track inventory, record stock changes, and spot low-stock items without spreadsheet complexity.

## Target users

- Small retail shops
- Home-based sellers
- Single-location businesses with one person managing stock

## Core jobs to be done

1. Know what I have in stock
2. Record sales and restocks quickly
3. See when items need reordering
4. Review history when numbers do not match

## Feature map

| Area | Status | Notes |
|------|--------|-------|
| Auth (register, verify, login, reset) | Shipped | Email verification required |
| Items CRUD | Shipped | Auto SKU, categories, tags |
| Stock operations | Shipped | Sale, purchase, return, adjustment |
| Movement history | Shipped | Filterable list |
| Dashboard stats | Shipped | Includes low-stock list |
| Reports | Shipped | Summary metrics |
| CSV import/export | Shipped | Secure header-based export |
| Low-stock email | Shipped | On threshold cross (SMTP required) |
| PWA install | Shipped | App shell cache only (not offline data) |

## Out of scope (v1)

- Multi-user organizations / roles
- Offline sync
- Barcode scanning
- ERP integrations
- AI forecasting

## Success metrics

- Time to first item added &lt; 3 minutes after signup
- Weekly active users recording ≥1 movement
- Low-stock items acted on within 7 days

## Personas

**Maya — shop owner**  
Runs a small general store. Needs mobile-friendly stock updates after each sale.

**Raj — online reseller**  
Imports CSV catalogs. Needs reliable SKU handling per account.

## User flows

### Onboarding

1. Register → verify email → login
2. Dashboard shows checklist: add item OR import CSV
3. First item appears on inventory with movement history

### Daily use

1. Record sale from Movements or item detail
2. Check dashboard for low-stock banner
3. Export CSV for backup or accounting

## Non-functional requirements

- Per-user data isolation
- JWT auth on all `/api/*` routes (except auth endpoints)
- Rate limiting on API and stricter on auth
- Responsive UI (mobile + desktop)

## Related docs

- [Architecture](./architecture.md)
- [API Reference](./API.md)
- [Roadmap](./ROADMAP.md)
