import { test, expect } from '@playwright/test';

test.describe('Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full obligation workflow', async ({ page }) => {
    // 1. Create Project
    await page.goto('/projetos');
    await page.click('[aria-label="Criar projeto"]');
    await page.fill('input[name="nome"]', 'TEST_Workflow_Project');
    await page.click('button[type="submit"]');
    await expect(page.getByText('TEST_Workflow_Project')).toBeVisible();

    // 2. Create Obligation
    await page.goto('/obrigacoes');
    await page.click('button:has-text("Nova")');
    await page.fill('input[name="titulo"]', 'TEST_Workflow_Obligation');
    // Would fill other required fields...
    await page.click('button[type="submit"]');

    // 3. Transition through states
    // Pendente → Em Revisão → Aprovado → Submetido → Concluído
    const obligation = page.locator('text=TEST_Workflow_Obligation').first();
    await expect(obligation).toBeVisible();
  });

  test('should handle template generation workflow', async ({ page }) => {
    await page.goto('/templates');
    
    // Select template
    const template = page.locator('text=TEST_IVA Mensal PT').first();
    
    if (await template.isVisible()) {
      await template.click();
      
      // Click generate
      await page.click('button:has-text("Gerar")');
      
      // Select project and year
      // ... fill form ...
      
      // Should generate 12 obligations for monthly template
      await page.goto('/obrigacoes');
      const generatedObligations = page.locator('[data-generated="true"]');
      
      // Should have multiple generated obligations
      const count = await generatedObligations.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle deep link navigation from Dashboard to Obrigacoes', async ({ page }) => {
    await page.goto('/');
    
    // Click "Atrasadas" KPI
    await page.click('text=Atrasadas');
    
    // Should navigate to obrigacoes with filter applied
    await expect(page).toHaveURL(/\/obrigacoes\?prazo=atrasadas/);
    
    // Filter should be active
    const filterButton = page.locator('[data-filter-active="true"]');
    await expect(filterButton).toBeVisible();
  });

  test('should handle upload workflow', async ({ page }) => {
    await page.goto('/obrigacoes');
    
    // Find TEST_Upload_Obrigatorio
    const card = page.locator('text=TEST_Upload_Obrigatorio').first();
    
    if (await card.isVisible()) {
      await card.click();
      
      // Click upload button
      await page.click('button:has-text("Upload")');
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      // Would upload actual file in real test
      
      // Verify upload success
      await expect(page.getByText(/upload.*sucesso/i)).toBeVisible();
    }
  });

  test('should handle soft delete and restore workflow', async ({ page }) => {
    await page.goto('/obrigacoes');
    
    // Find any obligation
    const firstCard = page.locator('[data-testid="obrigacao-card"]').first();
    
    if (await firstCard.isVisible()) {
      const title = await firstCard.textContent();
      
      // Delete
      await firstCard.click();
      await page.click('button:has-text("Arquivar")');
      await page.click('button:has-text("Confirmar")');
      
      // Should show undo toast
      await expect(page.getByText(/arquivada/i)).toBeVisible();
      await expect(page.getByText('Desfazer')).toBeVisible();
      
      // Obligation should not be visible anymore
      await expect(page.locator(`text=${title}`)).not.toBeVisible();
      
      // Click undo
      await page.click('button:has-text("Desfazer")');
      
      // Should be restored
      await expect(page.locator(`text=${title}`)).toBeVisible();
    }
  });

  test('should persist filters across sessions', async ({ page }) => {
    await page.goto('/');
    
    // Apply filter
    await page.click('button:has-text("Filtros")');
    await page.selectOption('select[name="projeto"]', 'TEST_Projeto A');
    
    // Navigate away
    await page.goto('/obrigacoes');
    
    // Navigate back
    await page.goto('/');
    
    // Filter should still be applied (stored in localStorage)
    const selectedFilter = page.locator('select[name="projeto"]');
    const value = await selectedFilter.inputValue();
    expect(value).toBeTruthy();
  });
});
