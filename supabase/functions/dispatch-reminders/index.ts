import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const DispatchRequestSchema = z.object({
  lembrete_id: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional(),
}).optional();

interface ReminderContext {
  lembrete: any;
  entidade: any;
  profile: any;
}

function gerarTituloMensagem(ctx: ReminderContext): { titulo: string; mensagem: string } {
  const { lembrete, entidade } = ctx;
  const regra = lembrete.regra.toLowerCase();
  
  let tipo = '';
  if (regra.includes('interna')) tipo = 'Deadline interna';
  else if (regra.includes('oficial')) tipo = 'Deadline oficial';
  else if (regra.includes('followup') || regra.includes('senior')) tipo = 'Follow-up Senior';
  
  const periodoRef = entidade.periodo_referencia || '';
  const projetoNome = entidade.projeto?.nome || 'Projeto';
  
  const titulo = `${tipo} – ${entidade.tipo} ${periodoRef} (${projetoNome})`;
  
  let mensagem = `Lembrete: ${lembrete.regra}\n\n`;
  mensagem += `Obrigação: ${entidade.titulo}\n`;
  mensagem += `Projeto: ${projetoNome}\n`;
  mensagem += `Estado: ${entidade.estado}\n`;
  
  if (entidade.deadline_interna) {
    mensagem += `Deadline Interna: ${new Date(entidade.deadline_interna).toLocaleDateString('pt-PT')}\n`;
  }
  if (entidade.deadline_oficial) {
    mensagem += `Deadline Oficial: ${new Date(entidade.deadline_oficial).toLocaleDateString('pt-PT')}\n`;
  }
  
  return { titulo, mensagem };
}

async function enviarEmail(ctx: ReminderContext, titulo: string, mensagem: string) {
  // TODO: Integrar com Resend ou provider de email
  // Por enquanto, apenas log
  console.log(`📧 Email seria enviado para ${ctx.profile.email}:`);
  console.log(`   Título: ${titulo}`);
  console.log(`   Mensagem: ${mensagem}`);
  
  // Simulação de sucesso
  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate request body if present
    let validatedInput: z.infer<typeof DispatchRequestSchema> = undefined;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        validatedInput = DispatchRequestSchema.parse(body);
      } catch (validationError) {
        return new Response(
          JSON.stringify({ 
            error: 'Dados de entrada inválidos', 
            details: validationError instanceof z.ZodError ? validationError.errors : String(validationError)
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🚀 Iniciando disparo de lembretes...');
    
    const agora = new Date();
    
    // Buscar lembretes prontos para disparar
    const { data: lembretes, error: lembreteError } = await supabase
      .from('lembretes')
      .select('*')
      .eq('ativo', true)
      .is('deleted_at', null)
      .lte('proximo_disparo_em', agora.toISOString())
      .order('proximo_disparo_em', { ascending: true })
      .limit(50); // Throttle: max 50 por execução
    
    if (lembreteError) throw lembreteError;
    
    console.log(`📋 Encontrados ${lembretes?.length || 0} lembretes para disparar`);
    
    let disparados = 0;
    let erros = 0;
    
    for (const lembrete of lembretes || []) {
      try {
        // Buscar a entidade
        let entidade = null;
        let owner_id = null;
        
        if (lembrete.entidade_tipo === 'obrigacao') {
          const { data: obrigacao } = await supabase
            .from('obrigacoes')
            .select('*, projeto:projetos(nome)')
            .eq('id', lembrete.entidade_id)
            .is('deleted_at', null)
            .single();
          
          if (!obrigacao) {
            // Entidade apagada, desativar lembrete
            await supabase
              .from('lembretes')
              .update({ ativo: false, deleted_at: agora.toISOString() })
              .eq('id', lembrete.id);
            continue;
          }
          
          entidade = obrigacao;
          owner_id = obrigacao.owner_id;
        }
        
        if (!entidade) continue;
        
        // Buscar profile do owner
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', owner_id)
          .single();
        
        if (!profile) continue;
        
        const ctx: ReminderContext = { lembrete, entidade, profile };
        const { titulo, mensagem } = gerarTituloMensagem(ctx);
        
        // Enviar por canal
        if (lembrete.canal === 'email') {
          await enviarEmail(ctx, titulo, mensagem);
        }
        // Push notifications não implementadas ainda
        
        // Registar no feed de alertas
        await supabase.from('alertas').insert({
          user_id: owner_id,
          entidade_tipo: lembrete.entidade_tipo,
          entidade_id: lembrete.entidade_id,
          canal: lembrete.canal,
          titulo,
          mensagem,
          disparado_em: agora.toISOString(),
          visto: false,
        });
        
        // Atualizar lembrete: marcar ultimo_disparo_em
        // Para lembretes one-shot (antes de deadline), desativar após disparo
        const regra = lembrete.regra.toLowerCase();
        const isOneShot = regra.includes('antes de');
        
        const updates: any = {
          ultimo_disparo_em: agora.toISOString(),
        };
        
        if (isOneShot) {
          updates.ativo = false;
          updates.proximo_disparo_em = null;
        } else {
          // Follow-up: pode reagendar (opcional)
          // Por enquanto, desativar também
          updates.ativo = false;
          updates.proximo_disparo_em = null;
        }
        
        await supabase
          .from('lembretes')
          .update(updates)
          .eq('id', lembrete.id);
        
        disparados++;
        console.log(`✅ Lembrete ${lembrete.id} disparado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao disparar lembrete ${lembrete.id}:`, error);
        erros++;
      }
    }
    
    console.log(`✨ Disparo concluído: ${disparados} disparados, ${erros} erros`);
    
    return new Response(
      JSON.stringify({ success: true, disparados, erros }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('❌ Erro geral:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
