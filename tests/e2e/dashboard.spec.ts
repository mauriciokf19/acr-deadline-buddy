import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
  });

  test('should display KPI cards', async ({ page }) => {
    // Wait for KPIs to load
    await page.waitForSelector('[data-testid="kpi-card"]', { timeout: 10000 });

    // Check that KPI cards are present
    const kpiCards = await page.locator('[data-testid="kpi-card"]').count();
    expect(kpiCards).toBeGreaterThanOrEqual(4);

    // Verify card titles
    await expect(page.getByText('Atrasadas')).toBeVisible();
    await expect(page.getByText('Vencem Hoje')).toBeVisible();
    await expect(page.getByText('Esta Semana')).toBeVisible();
    await expect(page.getByText('No Prazo')).toBeVisible();
  });

  test('should navigate to obligations when clicking KPI', async ({ page }) => {
    // Click on "Atrasadas" KPI
    await page.click('text=Atrasadas');

    // Should navigate to obligations page with filter
    await expect(page).toHaveURL(/\/obrigacoes/);
  });

  test('should display events list for next 7 days', async ({ page }) => {
    // Check if events section exists
    const eventsSection = page.locator('text=Hoje & Próximos 7 dias');
    await expect(eventsSection).toBeVisible();
  });

  test('should not display soft-deleted obligations', async ({ page }) => {
    // Search for "TEST_Soft_Deleted" - should not appear
    const softDeleted = page.getByText('TEST_Soft_Deleted');
    await expect(softDeleted).not.toBeVisible();
  });

  test('should display project progress', async ({ page }) => {
    // Check for progress section
    const progressSection = page.locator('text=Progresso por Projeto');
    await expect(progressSection).toBeVisible();
  });
});
