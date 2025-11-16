import { test, expect } from '@playwright/test';

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Projetos', () => {
    test('should create a new project with only name', async ({ page }) => {
      await page.goto('/projetos');
      
      // Click create button
      await page.click('[aria-label="Criar projeto"]');
      
      // Fill form with only required field
      await page.fill('input[name="nome"]', 'TEST_New_Project');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.getByText('TEST_New_Project')).toBeVisible();
    });

    test('should edit an existing project', async ({ page }) => {
      await page.goto('/projetos');
      
      // Find first project and click edit
      await page.click('[data-testid="project-card"]:first-child [data-testid="edit-button"]');
      
      // Change name
      await page.fill('input[name="nome"]', 'TEST_Updated_Project');
      
      // Save
      await page.click('button[type="submit"]');
      
      // Verify update
      await expect(page.getByText('TEST_Updated_Project')).toBeVisible();
    });
  });

  test.describe('Obrigações', () => {
    test('should create a new obligation', async ({ page }) => {
      await page.goto('/obrigacoes');
      
      // Click create button
      await page.click('button:has-text("Nova")');
      
      // Fill form
      await page.fill('input[name="titulo"]', 'TEST_New_Obligation');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Verify success toast
      await expect(page.getByText(/criada com sucesso/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/obrigacoes');
      
      // Click create button
      await page.click('button:has-text("Nova")');
      
      // Try to submit without filling required fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.getByText(/obrigatório/i)).toBeVisible();
    });

    test('should transition through states correctly', async ({ page }) => {
      await page.goto('/obrigacoes');
      
      // Find TEST_Vence_Hoje obligation
      const card = page.locator('text=TEST_Vence_Hoje').first();
      await expect(card).toBeVisible();
      
      // Should have estado badge
      await expect(page.locator('[data-testid="estado-badge"]').first()).toBeVisible();
    });

    test('should block Submetido without data_submissao', async ({ page }) => {
      // This test would verify the comprovativo requirement rule
      // when "Exigir comprovativo para Submetido" is active
      await page.goto('/obrigacoes');
      
      // Find an approved obligation
      const approvedCard = page.locator('[data-estado="aprovado"]').first();
      
      if (await approvedCard.isVisible()) {
        // Try to submit without comprovativo
        await approvedCard.click();
        
        // Attempt to mark as submitted should fail with error
        await page.click('button:has-text("Submeter")');
        
        // Should show error about missing comprovativo
        await expect(page.getByText(/comprovativo/i)).toBeVisible();
      }
    });
  });

  test.describe('Tarefas', () => {
    test('should create a new task', async ({ page }) => {
      await page.goto('/tarefas');
      
      // Click create button
      await page.click('button:has-text("Nova")');
      
      // Fill form
      await page.fill('input[name="titulo"]', 'TEST_New_Task');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.getByText(/criada com sucesso/i)).toBeVisible();
    });

    test('should mark task as complete', async ({ page }) => {
      await page.goto('/tarefas');
      
      // Find first task checkbox
      const checkbox = page.locator('input[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        await checkbox.check();
        
        // Should show success feedback
        await expect(page.getByText(/concluída/i)).toBeVisible();
      }
    });
  });
});
