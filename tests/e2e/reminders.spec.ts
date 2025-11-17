import { test, expect } from '@playwright/test';

test.describe('Reminders (Lembretes)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create reminder for obligation', async ({ page }) => {
    // Navigate to reminders via secondary menu
    await page.click('[aria-label="Abrir menu"]');
    await page.click('text=Lembretes');
    await page.waitForURL('/lembretes');

    // Click create reminder
    await page.click('text=Criar Lembrete');

    // Fill form
    await page.click('button:has-text("Selecionar tipo")');
    await page.click('text=Obrigação');
    
    // Select an obligation
    await page.click('button:has-text("Selecionar obrigação")');
    await page.click('[role="option"]').first();

    // Enter rule
    await page.fill('input[placeholder*="regra"]', '3 dias antes de deadline interna');

    // Select channel
    await page.click('button:has-text("Selecionar canal")');
    await page.click('text=Email');

    // Submit
    await page.click('button:has-text("Criar")');

    // Check success
    await expect(page.locator('text=Lembrete criado')).toBeVisible();
    
    // Verify it appears in list
    await expect(page.locator('text=3 dias antes de deadline interna')).toBeVisible();
  });

  test('should toggle reminder active status', async ({ page }) => {
    await page.goto('/lembretes');
    
    // Assuming there's at least one reminder
    const toggle = page.locator('[role="switch"]').first();
    const initialState = await toggle.getAttribute('aria-checked');
    
    // Toggle
    await toggle.click();
    
    // Verify state changed
    const newState = await toggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('should validate reminder entity reference', async ({ page }) => {
    await page.goto('/lembretes');
    await page.click('text=Criar Lembrete');

    // Try to submit without selecting entity
    await page.fill('input[placeholder*="regra"]', '3 dias antes de deadline interna');
    await page.click('button:has-text("Selecionar canal")');
    await page.click('text=Email');
    
    await page.click('button:has-text("Criar")');

    // Should show validation error
    await expect(page.locator('text=obrigatório')).toBeVisible();
  });

  test('should parse reminder rules correctly', async ({ page }) => {
    await page.goto('/lembretes');
    await page.click('text=Criar Lembrete');

    const testRules = [
      '3 dias antes de deadline interna',
      '5d antes de deadline oficial',
      '48h após envio_senior sem feedback',
      '72 horas após envio senior',
    ];

    for (const rule of testRules) {
      await page.fill('input[placeholder*="regra"]', rule);
      
      // Verify no validation error appears
      await expect(page.locator('text=inválid')).not.toBeVisible();
    }
  });
});
