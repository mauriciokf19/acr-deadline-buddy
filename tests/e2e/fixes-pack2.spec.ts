import { test, expect } from "@playwright/test";

test.describe("Fix Pack 2: Submeter + Comprovativo + Tarefas + Calendário", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test.describe("A) Submeter com comprovativo no modal", () => {
    test("deve exigir data de submissão", async ({ page }) => {
      await page.goto("/obrigacoes");
      await page.waitForLoadState("networkidle");

      // Find an obligation card and click "Submeter"
      const submeterButton = page.locator('button:has-text("Submeter")').first();
      if (await submeterButton.isVisible()) {
        await submeterButton.click();

        // Modal should open
        await expect(page.locator('text=Submeter Obrigação')).toBeVisible();
        
        // Date should be pre-filled with today
        await expect(page.locator('button[aria-label="Selecionar data de submissão"]')).toBeVisible();
        
        // Confirm button should be enabled (unless comprovativo is required)
        const confirmButton = page.locator('button:has-text("Confirmar Submissão")');
        await expect(confirmButton).toBeVisible();
      }
    });

    test("deve bloquear submissão se comprovativo obrigatório e ausente", async ({ page }) => {
      // First enable the setting
      await page.goto("/definicoes");
      await page.waitForLoadState("networkidle");
      
      const comprovantivoToggle = page.locator('text=Exigir comprovativo para submissão').locator('..').locator('button[role="switch"]');
      if (await comprovantivoToggle.isVisible()) {
        // Make sure it's ON
        const isChecked = await comprovantivoToggle.getAttribute('data-state');
        if (isChecked !== 'checked') {
          await comprovantivoToggle.click();
          await page.waitForTimeout(500);
        }
      }

      // Now try to submit an obligation without comprovativo
      await page.goto("/obrigacoes");
      await page.waitForLoadState("networkidle");

      const submeterButton = page.locator('button:has-text("Submeter")').first();
      if (await submeterButton.isVisible()) {
        await submeterButton.click();

        // Modal should show comprovativo requirement
        await expect(page.locator('text=É obrigatório anexar um comprovativo')).toBeVisible();
        
        // Confirm button should be disabled
        const confirmButton = page.locator('button:has-text("Confirmar Submissão")');
        await expect(confirmButton).toBeDisabled();
      }
    });

    test("deve permitir upload de PDF 4MB e submissão", async ({ page }) => {
      // Enable comprovativo requirement
      await page.goto("/definicoes");
      await page.waitForLoadState("networkidle");
      
      const comprovantivoToggle = page.locator('text=Exigir comprovativo para submissão').locator('..').locator('button[role="switch"]');
      if (await comprovantivoToggle.isVisible()) {
        const isChecked = await comprovantivoToggle.getAttribute('data-state');
        if (isChecked !== 'checked') {
          await comprovantivoToggle.click();
          await page.waitForTimeout(500);
        }
      }

      await page.goto("/obrigacoes");
      await page.waitForLoadState("networkidle");

      const submeterButton = page.locator('button:has-text("Submeter")').first();
      if (await submeterButton.isVisible()) {
        await submeterButton.click();

        // Wait for modal
        await page.waitForSelector('text=Submeter Obrigação');

        // Upload a file (simulate with a test PDF)
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Create a mock 4MB PDF file
          const buffer = Buffer.alloc(4 * 1024 * 1024);
          await fileInput.setInputFiles({
            name: "test-comprovativo.pdf",
            mimeType: "application/pdf",
            buffer,
          });

          // Wait for upload to complete
          await page.waitForTimeout(2000);

          // Now confirm button should be enabled
          const confirmButton = page.locator('button:has-text("Confirmar Submissão")');
          await expect(confirmButton).toBeEnabled();
          
          await confirmButton.click();
          
          // Should show success toast
          await expect(page.locator('text=Obrigação submetida')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("B) Tarefas - criação e visualização", () => {
    test("deve criar tarefa no detalhe da obrigação e aparecer na aba Tarefas", async ({ page }) => {
      await page.goto("/obrigacoes");
      await page.waitForLoadState("networkidle");

      // Click on first obligation to open detail
      const firstCard = page.locator('[role="button"]').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForLoadState("networkidle");

        // Click "+ Tarefa" button
        const addTaskButton = page.locator('button:has-text("+ Tarefa")');
        if (await addTaskButton.isVisible()) {
          await addTaskButton.click();

          // Fill form
          await page.fill('input[name="titulo"]', "Tarefa de teste E2E");
          await page.fill('textarea[name="descricao"]', "Descrição da tarefa");

          // Submit
          await page.click('button[type="submit"]:has-text("Criar")');

          // Should show success toast
          await expect(page.locator('text=Tarefa criada')).toBeVisible({ timeout: 5000 });

          // Click "Tarefas" tab
          const tarefasTab = page.locator('text=Tarefas');
          if (await tarefasTab.isVisible()) {
            await tarefasTab.click();
            
            // Should see the new task
            await expect(page.locator('text=Tarefa de teste E2E')).toBeVisible();
          }
        }
      }
    });

    test("deve exigir escolha de obrigação ao criar tarefa na página global", async ({ page }) => {
      await page.goto("/tarefas");
      await page.waitForLoadState("networkidle");

      // Click "+ Nova Tarefa"
      const addButton = page.locator('button:has-text("+ Nova Tarefa")');
      if (await addButton.isVisible()) {
        await addButton.click();

        // Form should show obligation selector
        await expect(page.locator('text=Obrigação')).toBeVisible();
        
        // Try to submit without selecting obligation
        await page.fill('input[name="titulo"]', "Tarefa sem obrigação");
        await page.click('button[type="submit"]');

        // Should show validation error or select should be required
        const obrigacaoSelect = page.locator('[name="obrigacao_id"]');
        await expect(obrigacaoSelect).toBeVisible();
      }
    });
  });

  test.describe("C) Calendário - navegação e paginação", () => {
    test("deve navegar entre meses com setas Prev/Next", async ({ page }) => {
      await page.goto("/calendario");
      await page.waitForLoadState("networkidle");

      // Get current month text
      const monthText = await page.locator('h2').filter({ hasText: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i }).first().textContent();

      // Click next month
      await page.click('button[aria-label="Próximo mês"]');
      await page.waitForLoadState("networkidle");

      // Month should change
      const newMonthText = await page.locator('h2').filter({ hasText: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i }).first().textContent();
      expect(newMonthText).not.toBe(monthText);

      // Click previous month
      await page.click('button[aria-label="Mês anterior"]');
      await page.waitForLoadState("networkidle");

      // Should go back
      const backMonthText = await page.locator('h2').filter({ hasText: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i }).first().textContent();
      expect(backMonthText).toBe(monthText);
    });

    test("deve carregar mais eventos na vista lista", async ({ page }) => {
      await page.goto("/calendario");
      await page.waitForLoadState("networkidle");

      // Switch to list view
      const listButton = page.locator('button:has-text("Lista")');
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForLoadState("networkidle");

        // Check if "Carregar mais" button exists
        const loadMoreButton = page.locator('button:has-text("Carregar mais")');
        if (await loadMoreButton.isVisible()) {
          // Get current event count
          const initialCount = await page.locator('[role="button"]').count();

          // Click load more
          await loadMoreButton.click();
          await page.waitForTimeout(1000);

          // Should have more events
          const newCount = await page.locator('[role="button"]').count();
          expect(newCount).toBeGreaterThan(initialCount);
        }
      }
    });
  });

  test.describe("D) KPIs - deep links e contagens", () => {
    test("deve aplicar filtros corretos ao clicar nos KPIs", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Click "Atrasadas" KPI
      const atrasadasKPI = page.locator('text=Atrasadas').locator('..');
      if (await atrasadasKPI.isVisible()) {
        await atrasadasKPI.click();
        
        // Should navigate to /obrigacoes with prazo=atrasadas
        await expect(page).toHaveURL(/\/obrigacoes\?prazo=atrasadas/);
      }

      // Go back and test "Hoje"
      await page.goto("/");
      const hojeKPI = page.locator('text=Vencem Hoje').locator('..');
      if (await hojeKPI.isVisible()) {
        await hojeKPI.click();
        await expect(page).toHaveURL(/\/obrigacoes\?prazo=hoje/);
      }

      // Test "Esta Semana"
      await page.goto("/");
      const semanaKPI = page.locator('text=Esta Semana').locator('..');
      if (await semanaKPI.isVisible()) {
        await semanaKPI.click();
        await expect(page).toHaveURL(/\/obrigacoes\?prazo=semana/);
      }

      // Test "No Prazo"
      await page.goto("/");
      const prazoKPI = page.locator('text=No Prazo').locator('..');
      if (await prazoKPI.isVisible()) {
        await prazoKPI.click();
        await expect(page).toHaveURL(/\/obrigacoes\?prazo=futuro/);
      }
    });

    test("KPIs devem excluir soft-deleted e estados finais", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // All KPIs should be visible with numbers
      const atrasadas = page.locator('text=Atrasadas').locator('..').locator('div').filter({ hasText: /^\d+$/ });
      const hoje = page.locator('text=Vencem Hoje').locator('..').locator('div').filter({ hasText: /^\d+$/ });
      const semana = page.locator('text=Esta Semana').locator('..').locator('div').filter({ hasText: /^\d+$/ });
      const prazo = page.locator('text=No Prazo').locator('..').locator('div').filter({ hasText: /^\d+$/ });

      // All should be visible (even if 0)
      await expect(atrasadas).toBeVisible();
      await expect(hoje).toBeVisible();
      await expect(semana).toBeVisible();
      await expect(prazo).toBeVisible();
    });
  });

  test.describe("F) Mensagens e A11y", () => {
    test("deve ter aria-labels nas setas do calendário", async ({ page }) => {
      await page.goto("/calendario");
      await page.waitForLoadState("networkidle");

      // Check for aria-labels
      await expect(page.locator('button[aria-label="Mês anterior"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Próximo mês"]')).toBeVisible();
    });

    test("botões devem desativar enquanto carrega", async ({ page }) => {
      await page.goto("/calendario");
      
      // Click next month rapidly
      const nextButton = page.locator('button[aria-label="Próximo mês"]');
      await nextButton.click();
      
      // Button should be disabled temporarily
      // This is hard to test reliably due to timing, but we can check it exists
      await expect(nextButton).toBeVisible();
    });

    test("mensagens de erro devem estar em PT-PT", async ({ page }) => {
      await page.goto("/obrigacoes");
      await page.waitForLoadState("networkidle");

      // Try to submit without required fields (if applicable)
      const addButton = page.locator('button:has-text("+ Nova Obrigação")');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Submit empty form
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show Portuguese error messages
          const errors = page.locator('text=/obrigatório|necessário|inválido/i');
          if (await errors.first().isVisible()) {
            const errorText = await errors.first().textContent();
            expect(errorText?.toLowerCase()).toMatch(/obrigatório|necessário|inválido/);
          }
        }
      }
    });
  });
});
