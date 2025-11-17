import { test, expect } from '@playwright/test';

test.describe('Calendário Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to calendar
    await page.click('text=Calendário');
    await page.waitForURL('/calendario');
  });

  test('should navigate months with Prev/Next buttons', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="calendar-view"]', { timeout: 5000 }).catch(() => {});
    
    // Get initial month (if visible)
    const initialMonth = await page.textContent('h2, [role="heading"]').catch(() => 'Unknown');
    
    // Click Next
    await page.click('button[aria-label="Mês seguinte"], button:has(svg):has-text("Chevron")').last();
    await page.waitForTimeout(500); // Wait for refetch
    
    // Month should have changed
    const nextMonth = await page.textContent('h2, [role="heading"]').catch(() => 'Unknown');
    expect(nextMonth).not.toBe(initialMonth);
    
    // Click Prev twice to go back
    await page.click('button[aria-label="Mês anterior"], button:has(svg):has-text("Chevron")').first();
    await page.waitForTimeout(500);
    
    await page.click('button[aria-label="Mês anterior"], button:has(svg):has-text("Chevron")').first();
    await page.waitForTimeout(500);
  });

  test('should return to today with "Hoje" button', async ({ page }) => {
    // Navigate to a different month
    await page.click('button:has-text("›"), button:has(svg)').last();
    await page.waitForTimeout(500);
    
    // Click "Hoje"
    await page.click('button:has-text("Hoje")');
    await page.waitForTimeout(500);
    
    // Should show current month
    const today = new Date();
    const currentMonthName = today.toLocaleDateString('pt-PT', { month: 'long' });
    await expect(page.locator(`text=${currentMonthName}`)).toBeVisible();
  });

  test('should change view modes', async ({ page }) => {
    // Default is Mensal
    await expect(page.locator('button:has-text("Mensal")[variant="default"]')).toBeVisible();
    
    // Switch to Semanal
    await page.click('button:has-text("Semanal")');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Semanal")[variant="default"]')).toBeVisible();
    
    // Switch to Lista
    await page.click('button:has-text("Lista")');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Lista")[variant="default"]')).toBeVisible();
  });

  test('should load more events in Lista view', async ({ page }) => {
    // Switch to Lista
    await page.click('button:has-text("Lista")');
    await page.waitForTimeout(500);
    
    // Check if "Carregar mais" button exists (only if there are >100 events)
    const loadMoreButton = page.locator('button:has-text("Carregar mais")');
    const isVisible = await loadMoreButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Count events before
      const eventsBefore = await page.locator('[data-testid="event-card"]').count();
      
      // Click load more
      await loadMoreButton.click();
      await page.waitForTimeout(500);
      
      // Should have more events
      const eventsAfter = await page.locator('[data-testid="event-card"]').count();
      expect(eventsAfter).toBeGreaterThan(eventsBefore);
    }
  });

  test('should export .ICS file', async ({ page }) => {
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('button:has-text("Exportar .ICS")');
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.ics');
  });

  test('should open obligation detail when clicking event', async ({ page }) => {
    // Wait for events to load
    await page.waitForTimeout(1000);
    
    // Find and click an event (if exists)
    const event = page.locator('[data-testid="calendar-event"], .calendar-event, text=/IVA|IES|SAF-T/').first();
    const hasEvents = await event.count() > 0;
    
    if (hasEvents) {
      await event.click();
      
      // Should navigate to obligation detail
      await expect(page).toHaveURL(/\/obrigacoes\/[a-f0-9-]+/);
    }
  });

  test('should disable navigation buttons while loading', async ({ page }) => {
    // Click Next button
    const nextButton = page.locator('button[aria-label="Mês seguinte"], button:has-text("›")').last();
    await nextButton.click();
    
    // Button should be disabled during load
    await expect(nextButton).toBeDisabled();
    
    // After load, should be enabled again
    await page.waitForTimeout(1000);
    await expect(nextButton).toBeEnabled();
  });
});
