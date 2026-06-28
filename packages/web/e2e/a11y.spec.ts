import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/articles', '/categories', '/search?q=test', '/login'];

for (const path of pages) {
  test(`accessibility: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
