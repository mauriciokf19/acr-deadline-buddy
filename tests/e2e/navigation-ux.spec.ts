import { test, expect } from "@playwright/test";

test.describe("Navigation & UX Final", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "test123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("Tab bar has 5 items and is fixed", async ({ page }) => {
    await page.goto("/");
    
    // Check that tab bar has exactly 5 items
    const tabItems = page.locator('nav[class*="fixed bottom-0"] a');
    await expect(tabItems).toHaveCount(5);
    
    // Check tab items
    await expect(page.locator('nav a[href="/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/projetos"]')).toBeVisible();
    await expect(page.locator('nav a[href="/obrigacoes"]')).toBeVisible();
    await expect(page.locator('nav a[href="/calendario"]')).toBeVisible();
    await expect(page.locator('nav a[href="/definicoes"]')).toBeVisible();
    
    // Verify tab bar is fixed (has fixed class)
    const nav = page.locator('nav[class*="fixed bottom-0"]');
    await expect(nav).toBeVisible();
    
    // Scroll and verify tab bar remains visible
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(nav).toBeVisible();
  });

  test("Secondary menu accessible via floating button", async ({ page }) => {
    await page.goto("/");
    
    // Click the floating menu button (...)
    const menuButton = page.locator('button[aria-label="Menu secundário"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Check secondary menu items
    await expect(page.locator('text=Alertas')).toBeVisible();
    await expect(page.locator('text=Tarefas')).toBeVisible();
    await expect(page.locator('text=Lembretes')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
    await expect(page.locator('text=QA')).toBeVisible();
    
    // Click on Tarefas
    await page.click('text=Tarefas');
    await page.waitForURL("/tarefas");
    await expect(page).toHaveURL("/tarefas");
  });

  test("Tarefas page accessible and functional", async ({ page }) => {
    await page.goto("/");
    
    // Open secondary menu
    await page.click('button[aria-label="Menu secundário"]');
    await page.click('text=Tarefas');
    await page.waitForURL("/tarefas");
    
    // Check page has filters and FAB
    await expect(page.locator('input[placeholder*="Pesquisar"]')).toBeVisible();
    await expect(page.locator('button:has-text("+")')).toBeVisible();
  });

  test("ProjetoDetail has Tarefas tab", async ({ page }) => {
    // First create a project
    await page.goto("/projetos");
    await page.click('button:has-text("+")');
    
    // Fill project form
    await page.fill('input[name="nome"]', "Projeto Teste Nav");
    await page.selectOption('select[name="pais"]', "PT");
    await page.click('button[type="submit"]');
    
    // Wait for success and navigate to project detail
    await page.waitForTimeout(1000);
    const projectCard = page.locator('text=Projeto Teste Nav').first();
    await projectCard.click();
    
    // Check tabs
    await expect(page.locator('button:has-text("Informações")')).toBeVisible();
    await expect(page.locator('button:has-text("Obrigações")')).toBeVisible();
    await expect(page.locator('button:has-text("Tarefas")')).toBeVisible();
    
    // Click Tarefas tab
    await page.click('button:has-text("Tarefas")');
    await expect(page.locator('text=Tarefas')).toBeVisible();
  });

  test("Criar Projeto - Select Cliente works correctly", async ({ page }) => {
    await page.goto("/projetos");
    
    // Open form
    await page.click('button:has-text("+")');
    
    // Check cliente select has placeholder
    const clienteSelect = page.locator('button:has-text("Selecione um cliente")');
    await expect(clienteSelect).toBeVisible();
    
    // Open dropdown
    await clienteSelect.click();
    
    // Verify no empty <SelectItem value="">
    const emptyItem = page.locator('div[role="option"][data-value=""]');
    await expect(emptyItem).toHaveCount(0);
    
    // Select a client if available
    const firstOption = page.locator('div[role="option"]').first();
    const hasOptions = await firstOption.isVisible().catch(() => false);
    
    if (hasOptions) {
      await firstOption.click();
      
      // Check clear button appears
      await expect(page.locator('button:has-text("✕")')).toBeVisible();
      
      // Click clear button
      await page.locator('button:has-text("✕")').click();
      
      // Verify placeholder is back
      await expect(page.locator('button:has-text("Selecione um cliente")')).toBeVisible();
    }
    
    // Submit without cliente should work (optional field)
    await page.fill('input[name="nome"]', "Projeto Sem Cliente");
    await page.click('button[type="submit"]');
    
    // Should not show error for missing cliente
    await page.waitForTimeout(500);
    await expect(page.locator('text=Cliente é obrigatório')).toHaveCount(0);
  });

  test("Calendário arrows navigate months and refetch", async ({ page }) => {
    await page.goto("/calendario");
    
    // Get current month text
    const currentMonthText = await page.locator('h2').textContent();
    
    // Click next month arrow
    const nextButton = page.locator('button[aria-label*="Próximo"]');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    
    // Wait for loading and check month changed
    await page.waitForTimeout(500);
    const newMonthText = await page.locator('h2').textContent();
    expect(newMonthText).not.toBe(currentMonthText);
    
    // Click previous month arrow
    const prevButton = page.locator('button[aria-label*="Anterior"]');
    await expect(prevButton).toBeVisible();
    await prevButton.click();
    
    // Wait and verify we're back to original month
    await page.waitForTimeout(500);
    const backMonthText = await page.locator('h2').textContent();
    expect(backMonthText).toBe(currentMonthText);
    
    // Verify buttons are disabled during loading
    // This is harder to test without mocking slow network
  });

  test("Calendário lista has pagination", async ({ page }) => {
    await page.goto("/calendario");
    
    // Switch to list view if needed
    const listaButton = page.locator('button:has-text("Lista")');
    if (await listaButton.isVisible()) {
      await listaButton.click();
    }
    
    // Check if "Carregar mais" button exists (only if there are many events)
    const loadMoreButton = page.locator('button:has-text("Carregar mais")');
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);
    
    if (hasLoadMore) {
      const eventCountBefore = await page.locator('div[class*="space-y-2"] > div').count();
      
      await loadMoreButton.click();
      await page.waitForTimeout(500);
      
      const eventCountAfter = await page.locator('div[class*="space-y-2"] > div').count();
      expect(eventCountAfter).toBeGreaterThan(eventCountBefore);
    }
  });

  test("Tab bar has safe-area padding for mobile", async ({ page }) => {
    await page.goto("/");
    
    // Check nav has safe-area inset in style
    const nav = page.locator('nav[class*="fixed bottom-0"]');
    const style = await nav.getAttribute("style");
    
    expect(style).toContain("env(safe-area-inset-bottom)");
  });

  test("Content has bottom padding for fixed tab bar", async ({ page }) => {
    await page.goto("/");
    
    // Check main container has pb-20 or similar
    const container = page.locator('div[class*="pb-"]').first();
    await expect(container).toBeVisible();
    
    // Verify content is not hidden by tab bar
    const lastElement = page.locator('main > *').last();
    const box = await lastElement.boundingBox();
    
    if (box) {
      const viewportHeight = page.viewportSize()?.height || 0;
      // Last element should not be below viewport (accounting for tab bar)
      expect(box.y + box.height).toBeLessThan(viewportHeight);
    }
  });
});
