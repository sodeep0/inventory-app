# Stock Keeper — Roadmap

Last updated: May 2026

## Legend

| Label | Meaning |
|-------|---------|
| **MVP** | Required for launch quality |
| **Post-MVP** | Next 1–2 sprints |
| **Later** | Backlog |
| **Do not build** | Out of scope until validated need |

## Completed (recent)

| ID | Feature | Status |
|----|---------|--------|
| SK-001 | Per-user SKU uniqueness | Done |
| SK-002 | Server-side low-stock filter | Done |
| SK-003 | Movements API filters | Done |
| SK-005 | Secure CSV export | Done |
| SK-006 | Empty states + onboarding | Done |
| SK-009 | Dashboard low-stock banner | Done |

## MVP (launch blockers) — complete

All launch blockers above are implemented. Verify in production after deploy + migration.

## Post-MVP

| ID | Feature | Priority |
|----|---------|----------|
| SK-004 | Persisted alert preferences on User model | P1 |
| SK-007 | Date-range reports | P2 |
| SK-008 | Archive items (soft delete) | P2 |
| SK-011 | Consolidate email config (SMTP vs EMAIL_*) | P2 |
| SK-012 | Fix PWA copy (no offline data claim) | P2 |
| SK-013 | Migrate all pages to `apiClient` | P2 |
| SK-017 | Import row-level error UX | P2 |
| SK-022 | SEO: robots.txt, landing metadata | P3 |
| SK-023 | Weekly low-stock digest email | P3 |

## Later

| ID | Feature |
|----|---------|
| SK-015 | Report charts |
| SK-016 | Item detail pagination polish |
| SK-018 | Category management UI |
| SK-019 | Return → item deep links |

## Do not build yet

- Multi-tenant / teams / RBAC
- Offline inventory sync
- Barcode scanner
- AI demand forecasting
- ERP / Shopify integrations
- Content moderation (N/A for single-user app)

## How to propose changes

1. Add row to Post-MVP or Later with task ID
2. Update [product.md](./product.md) if user-facing behavior changes
3. Update [API.md](./API.md) for endpoint changes
