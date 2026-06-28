import { test, expect } from '@playwright/test';

test.describe('Public portal', () => {
  test('home page loads and displays articles', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Knowledge Base Central', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recently Published' })).toBeVisible();
  });

  test('clicking an article navigates to detail page', async ({ page }) => {
    await page.goto('/articles');
    const firstArticle = page.locator('article h3').first();
    if ((await firstArticle.count()) === 0) {
      test.skip();
      return;
    }
    const title = await firstArticle.textContent();
    await firstArticle.click();
    await expect(page).toHaveURL(/\/articles\/.+/);
    if (title) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
    }
  });

  test('search for a known term returns results or empty state', async ({ page }) => {
    await page.goto('/search?q=algorithm');
    await expect(page.getByRole('heading', { name: 'Search', level: 1 })).toBeVisible();
    const noResults = page.getByText('No results found');
    const results = page.getByLabel('Search results');
    await expect(noResults.or(results)).toBeVisible();
  });

  test('breadcrumb is correct on a nested category page', async ({ page }) => {
    await page.goto('/categories/machine-learning');
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Categories');
    await expect(breadcrumb).toContainText('Machine Learning');
  });

  test('404 page renders for unknown slug', async ({ page }) => {
    await page.goto('/articles/this-slug-definitely-does-not-exist-xyz');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();
  });
});
