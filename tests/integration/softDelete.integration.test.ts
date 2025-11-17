import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/lib/supabase';
import { softDeleteObrigacao, restoreObrigacao } from '@/lib/obrigacoesService';

describe('Soft Delete Integration (Real DB)', () => {
  let testObrigacaoId: string;
  let testProjetoId: string;

  beforeAll(async () => {
    // Criar projeto de teste
    const { data: projeto, error: projetoError } = await supabase
      .from('projetos')
      .insert({ nome: 'TEST_SoftDelete_Projeto' })
      .select()
      .single();

    if (projetoError) throw projetoError;
    testProjetoId = projeto.id;

    // Criar obrigação de teste
    const { data: obrigacao, error: obrigacaoError } = await supabase
      .from('obrigacoes')
      .insert({
        titulo: 'TEST_SoftDelete_Obrigacao',
        projeto_id: testProjetoId,
        tipo: 'iva',
        periodicidade: 'mensal',
        deadline_oficial: new Date().toISOString(),
        deadline_interna: new Date().toISOString(),
        deadline_revisao_senior: new Date().toISOString(),
      })
      .select()
      .single();

    if (obrigacaoError) throw obrigacaoError;
    testObrigacaoId = obrigacao.id;

    // Criar tarefa associada
    await supabase.from('tarefas').insert({
      titulo: 'TEST_SoftDelete_Tarefa',
      obrigacao_id: testObrigacaoId,
    });

    // Criar lembrete associado
    await supabase.from('lembretes').insert({
      entidade_tipo: 'obrigacao',
      entidade_id: testObrigacaoId,
      regra: '-3d',
      canal: 'in_app',
      ativo: true,
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await supabase.from('lembretes').delete().eq('entidade_id', testObrigacaoId);
    await supabase.from('tarefas').delete().eq('obrigacao_id', testObrigacaoId);
    await supabase.from('obrigacoes').delete().eq('id', testObrigacaoId);
    await supabase.from('projetos').delete().eq('id', testProjetoId);
  });

  describe('Soft delete operation', () => {
    it('should set deleted_at timestamp and cascade', async () => {
      const result = await softDeleteObrigacao({ obrigacaoId: testObrigacaoId });

      expect(result.success).toBe(true);
      expect(result.affectedTarefas).toBeGreaterThan(0);
      expect(result.affectedLembretes).toBeGreaterThan(0);

      // Verificar que obrigação foi soft-deleted
      const { data: obrigacao } = await supabase
        .from('obrigacoes')
        .select('deleted_at')
        .eq('id', testObrigacaoId)
        .single();

      expect(obrigacao?.deleted_at).not.toBeNull();

      // Verificar que tarefas foram soft-deleted
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('deleted_at')
        .eq('obrigacao_id', testObrigacaoId);

      expect(tarefas?.every(t => t.deleted_at !== null)).toBe(true);

      // Verificar que lembretes foram desativados e soft-deleted
      const { data: lembretes } = await supabase
        .from('lembretes')
        .select('ativo, deleted_at')
        .eq('entidade_tipo', 'obrigacao')
        .eq('entidade_id', testObrigacaoId);

      expect(lembretes?.every(l => l.ativo === false && l.deleted_at !== null)).toBe(true);
    });

    it('should not appear in Dashboard KPIs', async () => {
      // Query simulando Dashboard KPIs (Atrasadas)
      const { data } = await supabase
        .from('obrigacoes')
        .select('id')
        .is('deleted_at', null)
        .not('estado', 'in', '("concluido","submetido")');

      const softDeletedIds = data?.map(o => o.id) || [];
      expect(softDeletedIds).not.toContain(testObrigacaoId);
    });

    it('should not appear in Calendario', async () => {
      const { data } = await supabase
        .from('obrigacoes')
        .select('id, titulo, deadline_oficial')
        .is('deleted_at', null);

      const softDeletedIds = data?.map(o => o.id) || [];
      expect(softDeletedIds).not.toContain(testObrigacaoId);
    });
  });

  describe('Restore operation', () => {
    it('should restore obrigação, tarefas and lembretes', async () => {
      const result = await restoreObrigacao({ obrigacaoId: testObrigacaoId });

      expect(result.success).toBe(true);

      // Verificar que obrigação foi restaurada
      const { data: obrigacao } = await supabase
        .from('obrigacoes')
        .select('deleted_at')
        .eq('id', testObrigacaoId)
        .single();

      expect(obrigacao?.deleted_at).toBeNull();

      // Verificar que tarefas foram restauradas
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('deleted_at')
        .eq('obrigacao_id', testObrigacaoId);

      expect(tarefas?.every(t => t.deleted_at === null)).toBe(true);

      // Verificar que lembretes foram reativados
      const { data: lembretes } = await supabase
        .from('lembretes')
        .select('ativo, deleted_at')
        .eq('entidade_tipo', 'obrigacao')
        .eq('entidade_id', testObrigacaoId);

      expect(lembretes?.every(l => l.ativo === true && l.deleted_at === null)).toBe(true);
    });

    it('should appear again in Dashboard KPIs', async () => {
      const { data } = await supabase
        .from('obrigacoes')
        .select('id')
        .is('deleted_at', null)
        .not('estado', 'in', '("concluido","submetido")');

      const activeIds = data?.map(o => o.id) || [];
      expect(activeIds).toContain(testObrigacaoId);
    });
  });
});
