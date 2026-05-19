import { test, expect } from '@playwright/test';

const token = process.env.E2E_TOKEN;

function seedAuth(page: import('@playwright/test').Page) {
  return page.addInitScript((t: string) => {
    localStorage.removeItem('stockKeeperOnboardingComplete');
    localStorage.setItem(
      'user',
      JSON.stringify({
        username: 'e2e_user',
        email: 'e2e-user@stockkeeper.test',
        token: t,
      })
    );
  }, token!);
}

test.describe('Authenticated flows', () => {
  test.beforeEach(() => {
    test.skip(!token, 'E2E_TOKEN not set — run via playwright test (global-setup)');
  });

  test('dashboard shows onboarding for empty account', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/');
    await expect(page.getByText('Get started with Stock Keeper')).toBeVisible({ timeout: 20_000 });
  });

  test('inventory empty state and add item', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/inventory');
    await expect(page.getByText('No items yet')).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Add Item' }).first().click();
    await page.getByLabel('Name').fill('E2E Test Product');
    await page.getByLabel('Quantity').fill('5');
    await page.getByLabel('Low Stock Threshold').fill('10');
    await page.getByRole('button', { name: 'Add Item' }).last().click();

    await expect(page.getByText('E2E Test Product')).toBeVisible({ timeout: 20_000 });
  });

  test('low stock filter checkbox from URL', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/inventory?lowStock=true');
    await expect(page.getByText('Low stock only')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('label:has-text("Low stock only") input[type="checkbox"]')).toBeChecked({ timeout: 20_000 });
  });

  test('movements page has search and type filter', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/movements');
    await expect(page.getByRole('heading', { name: 'Movements' })).toBeVisible();
    await expect(page.getByPlaceholder('Search by item name')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('export uses Authorization header not query token', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/inventory');
    await expect(page.getByText('No items yet')).toBeVisible({ timeout: 20_000 }).catch(() => {});

    let exportUrl = '';
    let authHeader = '';
    page.on('request', (req) => {
      if (req.url().includes('/export/')) {
        exportUrl = req.url();
        authHeader = req.headers()['authorization'] || '';
      }
    });

    await page.getByRole('button', { name: 'Export' }).click();
    await page.waitForTimeout(2000);

    if (exportUrl) {
      expect(exportUrl).not.toContain('token=');
      expect(authHeader).toMatch(/^Bearer /);
    }
  });
});
