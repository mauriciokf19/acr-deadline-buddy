import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { parseReminderRule } from '@/lib/reminderParser';
import { calculateReminderBeforeDeadline, calculateReminderAfterSend } from '@/lib/dateUtils';

describe('Reminders Integration', () => {
  let testUserId: string;
  let testObrigacaoId: string;
  let testLembreteId: string;

  beforeEach(async () => {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    testUserId = user.id;

    // Create test obrigacao
    const { data: projeto } = await supabase
      .from('projetos')
      .insert({ nome: 'Test Projeto Lembretes' })
      .select()
      .single();

    const { data: obrigacao } = await supabase
      .from('obrigacoes')
      .insert({
        projeto_id: projeto!.id,
        titulo: 'Test Obrigacao Lembrete',
        tipo: 'iva',
        periodicidade: 'mensal',
        deadline_revisao_senior: new Date('2024-12-10').toISOString(),
        deadline_interna: new Date('2024-12-15').toISOString(),
        deadline_oficial: new Date('2024-12-20').toISOString(),
      })
      .select()
      .single();

    testObrigacaoId = obrigacao!.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testLembreteId) {
      await supabase.from('lembretes').delete().eq('id', testLembreteId);
    }
    if (testObrigacaoId) {
      await supabase.from('obrigacoes').delete().eq('id', testObrigacaoId);
    }
  });

  it('should create lembrete with valid reference', async () => {
    const { data, error } = await supabase
      .from('lembretes')
      .insert({
        entidade_tipo: 'obrigacao',
        entidade_id: testObrigacaoId,
        regra: '3 dias antes de deadline interna',
        canal: 'email',
        ativo: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.owner_id).toBe(testUserId);
    testLembreteId = data!.id;
  });

  it('should reject lembrete with invalid entidade_tipo', async () => {
    const { error } = await supabase
      .from('lembretes')
      .insert({
        entidade_tipo: 'invalid',
        entidade_id: testObrigacaoId,
        regra: '3 dias antes de deadline interna',
        canal: 'email',
        ativo: true,
      });

    expect(error).toBeTruthy();
    expect(error!.message).toContain('inválido');
  });

  it('should reject lembrete with non-existent entity', async () => {
    const { error } = await supabase
      .from('lembretes')
      .insert({
        entidade_tipo: 'obrigacao',
        entidade_id: '00000000-0000-0000-0000-000000000000',
        regra: '3 dias antes de deadline interna',
        canal: 'email',
        ativo: true,
      });

    expect(error).toBeTruthy();
    expect(error!.message).toContain('não encontrada');
  });

  it('should calculate proximo_disparo_em correctly for "antes de" rules', async () => {
    const deadline = new Date('2024-12-20T15:00:00');
    const parsed = parseReminderRule('3 dias antes de deadline interna');
    
    expect(parsed.type).toBe('INTERNA');
    expect(parsed.days).toBe(3);

    const nextDisparo = calculateReminderBeforeDeadline(deadline, parsed.days!);
    
    // Should be 3 days before at 08:00
    expect(nextDisparo.getDate()).toBe(17);
    expect(nextDisparo.getHours()).toBe(8);
    expect(nextDisparo.getMinutes()).toBe(0);
  });

  it('should calculate proximo_disparo_em correctly for "após" rules', async () => {
    const sendDate = new Date('2024-12-15T10:00:00');
    const parsed = parseReminderRule('48h após envio_senior');
    
    expect(parsed.type).toBe('FOLLOWUP');
    expect(parsed.hours).toBe(48);

    const nextDisparo = calculateReminderAfterSend(sendDate, parsed.hours!);
    
    // Should be 48 hours after (2 days)
    expect(nextDisparo.getDate()).toBe(17);
    expect(nextDisparo.getHours()).toBe(10);
  });

  it('should apply silence window to reminders', async () => {
    const deadline = new Date('2024-12-20T15:00:00');
    const nextDisparo = calculateReminderBeforeDeadline(
      deadline, 
      3, 
      '20:00', 
      '08:00'
    );

    // Should be at 08:00 (even if calculated time fell in silence window)
    expect(nextDisparo.getHours()).toBe(8);
    expect(nextDisparo.getMinutes()).toBe(0);
  });

  it('should support multiple reminders for same obrigacao', async () => {
    const { data: lembrete1 } = await supabase
      .from('lembretes')
      .insert({
        entidade_tipo: 'obrigacao',
        entidade_id: testObrigacaoId,
        regra: '3 dias antes de deadline interna',
        canal: 'email',
        ativo: true,
      })
      .select()
      .single();

    const { data: lembrete2 } = await supabase
      .from('lembretes')
      .insert({
        entidade_tipo: 'obrigacao',
        entidade_id: testObrigacaoId,
        regra: '5 dias antes de deadline oficial',
        canal: 'push',
        ativo: true,
      })
      .select()
      .single();

    expect(lembrete1).toBeTruthy();
    expect(lembrete2).toBeTruthy();

    // Cleanup
    await supabase.from('lembretes').delete().in('id', [lembrete1!.id, lembrete2!.id]);
  });
});
