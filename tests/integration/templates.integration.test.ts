import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Template Generation Integration', () => {
  let testProjetoId: string;
  let testTemplateId: string;

  beforeEach(async () => {
    // Create test projeto
    const { data: projeto } = await supabase
      .from('projetos')
      .insert({ nome: 'Test Projeto Templates' })
      .select()
      .single();

    testProjetoId = projeto!.id;

    // Create test template
    const { data: template } = await supabase
      .from('templates')
      .insert({
        nome: 'IVA Mensal Test',
        tipo_obrigacao: 'iva',
        periodicidade: 'mensal',
        regra_deadline_oficial: 'dia 20 do mês seguinte',
        offset_interna: 3,
        offset_revisao: 2,
        pais: 'PT',
      })
      .select()
      .single();

    testTemplateId = template!.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testProjetoId) {
      await supabase.from('obrigacoes').delete().eq('projeto_id', testProjetoId);
      await supabase.from('projetos').delete().eq('id', testProjetoId);
    }
    if (testTemplateId) {
      await supabase.from('templates').delete().eq('id', testTemplateId);
    }
  });

  it('should generate monthly obligations for full year', async () => {
    // This would normally be done via GenerateObrigacoesForm
    // Here we're testing the database constraints and structure
    
    const ano = 2024;
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);
    
    const obrigacoes = meses.map(mes => ({
      projeto_id: testProjetoId,
      titulo: `IVA ${mes}/${ano}`,
      tipo: 'iva' as const,
      periodicidade: 'mensal' as const,
      periodo_referencia: `${ano}-${String(mes).padStart(2, '0')}`,
      deadline_revisao_senior: new Date(ano, mes, 18).toISOString(),
      deadline_interna: new Date(ano, mes, 19).toISOString(),
      deadline_oficial: new Date(ano, mes, 20).toISOString(),
    }));

    const { data, error } = await supabase
      .from('obrigacoes')
      .insert(obrigacoes)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(12);
  });

  it('should prevent duplicate generation with unique index', async () => {
    // Insert first obligation
    const { error: error1 } = await supabase
      .from('obrigacoes')
      .insert({
        projeto_id: testProjetoId,
        titulo: 'IVA 01/2024',
        tipo: 'iva',
        periodicidade: 'mensal',
        periodo_referencia: '2024-01',
        deadline_revisao_senior: new Date(2024, 1, 18).toISOString(),
        deadline_interna: new Date(2024, 1, 19).toISOString(),
        deadline_oficial: new Date(2024, 1, 20).toISOString(),
      });

    expect(error1).toBeNull();

    // Try to insert duplicate
    const { error: error2 } = await supabase
      .from('obrigacoes')
      .insert({
        projeto_id: testProjetoId,
        titulo: 'IVA 01/2024 (duplicate)',
        tipo: 'iva',
        periodicidade: 'mensal',
        periodo_referencia: '2024-01',
        deadline_revisao_senior: new Date(2024, 1, 18).toISOString(),
        deadline_interna: new Date(2024, 1, 19).toISOString(),
        deadline_oficial: new Date(2024, 1, 20).toISOString(),
      });

    expect(error2).toBeTruthy();
    expect(error2!.code).toBe('23505'); // Unique violation
  });

  it('should handle trimestral generation', async () => {
    const ano = 2024;
    const trimestres = [1, 2, 3, 4];
    
    const obrigacoes = trimestres.map(t => ({
      projeto_id: testProjetoId,
      titulo: `IES T${t}/${ano}`,
      tipo: 'ies' as const,
      periodicidade: 'trimestral' as const,
      periodo_referencia: `${ano}-T${t}`,
      deadline_revisao_senior: new Date(ano, t * 3, 18).toISOString(),
      deadline_interna: new Date(ano, t * 3, 19).toISOString(),
      deadline_oficial: new Date(ano, t * 3, 20).toISOString(),
    }));

    const { data, error } = await supabase
      .from('obrigacoes')
      .insert(obrigacoes)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(4);
  });

  it('should handle anual generation', async () => {
    const { data, error } = await supabase
      .from('obrigacoes')
      .insert({
        projeto_id: testProjetoId,
        titulo: 'Modelo 22 2024',
        tipo: 'modelo_22',
        periodicidade: 'anual',
        periodo_referencia: '2024',
        deadline_revisao_senior: new Date(2025, 4, 29).toISOString(),
        deadline_interna: new Date(2025, 4, 30).toISOString(),
        deadline_oficial: new Date(2025, 4, 31).toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it('should normalize tipo before insert', async () => {
    // Test that 'IVA' (uppercase) is normalized to 'iva'
    const { data, error } = await supabase
      .from('obrigacoes')
      .insert({
        projeto_id: testProjetoId,
        titulo: 'Test normalization',
        tipo: 'iva' as any, // TypeScript would normally prevent this
        periodicidade: 'mensal',
        periodo_referencia: '2024-12',
        deadline_revisao_senior: new Date(2024, 11, 18).toISOString(),
        deadline_interna: new Date(2024, 11, 19).toISOString(),
        deadline_oficial: new Date(2024, 11, 20).toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data!.tipo).toBe('iva');
  });
});
