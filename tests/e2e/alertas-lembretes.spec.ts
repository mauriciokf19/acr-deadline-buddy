import { test, expect } from '@playwright/test';

test.describe('Alertas & Lembretes', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Alertas deletáveis', () => {
    test('should delete individual alert', async ({ page }) => {
      // Navigate to Alertas
      await page.click('text=Alertas');
      await page.waitForURL('/alertas');
      
      // Wait for alerts to load
      await page.waitForTimeout(1000);
      
      // Count initial alerts
      const initialCount = await page.locator('[data-testid="alerta-card"], .card').count();
      
      if (initialCount > 0) {
        // Click delete button on first alert
        await page.locator('button[aria-label="Eliminar alerta"]').first().click();
        await page.waitForTimeout(500);
        
        // Should have one less alert
        const newCount = await page.locator('[data-testid="alerta-card"], .card').count();
        expect(newCount).toBe(initialCount - 1);
      }
    });

    test('should clear all alerts with confirmation', async ({ page }) => {
      // Navigate to Alertas
      await page.click('text=Alertas');
      await page.waitForURL('/alertas');
      
      await page.waitForTimeout(1000);
      
      const alertCount = await page.locator('[data-testid="alerta-card"], .card').count();
      
      if (alertCount > 0) {
        // Setup dialog handler
        page.on('dialog', dialog => dialog.accept());
        
        // Click "Limpar todos"
        await page.click('button:has-text("Limpar todos")');
        await page.waitForTimeout(500);
        
        // Should show empty state
        await expect(page.locator('text=Sem alertas')).toBeVisible();
      }
    });
  });

  test.describe('Lembretes estáveis', () => {
    test('should load lembretes without error', async ({ page }) => {
      // Navigate to Lembretes
      await page.click('text=Lembretes');
      await page.waitForURL('/lembretes');
      
      // Should not show error
      await expect(page.locator('text=/erro/i')).not.toBeVisible();
      
      // Should show page content
      await expect(page.locator('h1:has-text("Lembretes")')).toBeVisible();
    });

    test('should create lembrete with valid obrigação', async ({ page }) => {
      // Navigate to Lembretes
      await page.click('text=Lembretes');
      await page.waitForURL('/lembretes');
      
      // Click "Criar Lembrete"
      await page.click('button:has-text("Criar Lembrete")');
      
      // Fill form
      await page.selectOption('select[name="entidade_tipo"]', 'obrigacao');
      await page.waitForTimeout(500);
      
      // Select first obrigação if available
      const entidadeSelect = page.locator('select[name="entidade_id"]');
      const hasOptions = await entidadeSelect.locator('option').count() > 1;
      
      if (hasOptions) {
        await entidadeSelect.selectOption({ index: 1 });
        await page.fill('input[name="regra"]', '3 dias antes de deadline interna');
        await page.selectOption('select[name="canal"]', 'email');
        
        // Submit
        await page.click('button:has-text("Guardar")');
        await page.waitForTimeout(1000);
        
        // Should show success and refresh list
        await expect(page.locator('text=criado com sucesso')).toBeVisible();
      }
    });

    test('should toggle lembrete ativo status', async ({ page }) => {
      // Navigate to Lembretes
      await page.click('text=Lembretes');
      await page.waitForURL('/lembretes');
      
      await page.waitForTimeout(1000);
      
      // Find first lembrete switch
      const switchElement = page.locator('[role="switch"]').first();
      const isPresent = await switchElement.count() > 0;
      
      if (isPresent) {
        const initialState = await switchElement.getAttribute('aria-checked');
        
        // Toggle
        await switchElement.click();
        await page.waitForTimeout(500);
        
        // Should have changed
        const newState = await switchElement.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    });
  });
});
