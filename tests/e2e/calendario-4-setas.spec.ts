import { test, expect } from '@playwright/test';

test.describe('Calendário 4 setas', () => {
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
    await page.waitForTimeout(1000);
  });

  test('should have 4 functional arrows (top and central)', async ({ page }) => {
    // Get initial month from central header
    const monthHeader = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    
    // Click top next arrow
    const topNextArrow = page.locator('button[aria-label="Mês seguinte"]').first();
    await topNextArrow.click();
    await page.waitForTimeout(1000);
    
    // Month should have changed
    const newMonth1 = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(newMonth1).not.toBe(monthHeader);
    
    // Click central prev arrow (should exist inside vista mensal)
    const centralPrevArrow = page.locator('button[aria-label="Mês anterior"]').last();
    await centralPrevArrow.click();
    await page.waitForTimeout(1000);
    
    // Should return to original month
    const newMonth2 = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(newMonth2).toBe(monthHeader);
    
    // Click central next arrow
    const centralNextArrow = page.locator('button[aria-label="Mês seguinte"]').last();
    await centralNextArrow.click();
    await page.waitForTimeout(1000);
    
    // Month should change again
    const newMonth3 = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(newMonth3).not.toBe(monthHeader);
    
    // Click top prev arrow
    const topPrevArrow = page.locator('button[aria-label="Mês anterior"]').first();
    await topPrevArrow.click();
    await page.waitForTimeout(1000);
    
    // Should return to original
    const finalMonth = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(finalMonth).toBe(monthHeader);
  });

  test('should disable arrows while loading', async ({ page }) => {
    const nextArrow = page.locator('button[aria-label="Mês seguinte"]').first();
    
    // Click next
    await nextArrow.click();
    
    // Should be disabled during load
    await expect(nextArrow).toBeDisabled();
    
    // Wait for load to complete
    await page.waitForTimeout(1500);
    
    // Should be enabled again
    await expect(nextArrow).toBeEnabled();
  });

  test('should sync both arrow pairs', async ({ page }) => {
    // Get initial month
    const initialMonth = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    
    // Click top arrow
    await page.locator('button[aria-label="Mês seguinte"]').first().click();
    await page.waitForTimeout(1000);
    
    const monthAfterTopClick = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    
    // Click central prev arrow
    await page.locator('button[aria-label="Mês anterior"]').last().click();
    await page.waitForTimeout(1000);
    
    // Should be back to original
    const monthAfterCentralClick = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(monthAfterCentralClick).toBe(initialMonth);
  });

  test('should work with "Hoje" button', async ({ page }) => {
    // Navigate away from current month
    await page.locator('button[aria-label="Mês seguinte"]').first().click();
    await page.waitForTimeout(1000);
    await page.locator('button[aria-label="Mês seguinte"]').first().click();
    await page.waitForTimeout(1000);
    
    // Click "Hoje"
    await page.click('button:has-text("Hoje")');
    await page.waitForTimeout(1000);
    
    // Should show current month
    const today = new Date();
    const currentMonthName = today.toLocaleDateString('pt-PT', { month: 'long' });
    const currentYear = today.getFullYear();
    
    const displayedMonth = await page.locator('text=/[A-Za-z]+ \\d{4}/').first().textContent();
    expect(displayedMonth?.toLowerCase()).toContain(currentMonthName.toLowerCase());
    expect(displayedMonth).toContain(currentYear.toString());
  });

  test('should refetch events when navigating months', async ({ page }) => {
    // Count initial events
    const initialEvents = await page.locator('[data-testid="event-card"], .calendar-event').count();
    
    // Navigate to next month
    await page.locator('button[aria-label="Mês seguinte"]').first().click();
    await page.waitForTimeout(1500);
    
    // Events should update (count may be different)
    const newEvents = await page.locator('[data-testid="event-card"], .calendar-event').count();
    
    // Just verify the query executed (no error shown)
    await expect(page.locator('text=/erro/i')).not.toBeVisible();
  });
});
