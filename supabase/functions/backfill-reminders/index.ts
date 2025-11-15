import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obter user_id do body ou do auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`🔄 Iniciando backfill de lembretes para user ${userId}...`);
    
    // Buscar defaults do utilizador
    const { data: profile } = await supabase
      .from('profiles')
      .select('lembrete_interna_dias, lembrete_oficial_dias')
      .eq('id', userId)
      .single();
    
    const internaOffset = profile?.lembrete_interna_dias || 3;
    const oficialOffset = profile?.lembrete_oficial_dias || 5;
    
    // Buscar obrigações ativas do utilizador
    const { data: obrigacoes, error: obrigacoesError } = await supabase
      .from('obrigacoes')
      .select('id, tipo, periodo_referencia, deadline_interna, deadline_oficial, projeto:projetos(nome)')
      .eq('owner_id', userId)
      .is('deleted_at', null);
    
    if (obrigacoesError) throw obrigacoesError;
    
    console.log(`📋 Encontradas ${obrigacoes?.length || 0} obrigações ativas`);
    
    let criados = 0;
    let erros = 0;
    
    for (const obrigacao of obrigacoes || []) {
      try {
        // Verificar lembretes existentes
        const { data: existentes } = await supabase
          .from('lembretes')
          .select('regra')
          .eq('entidade_tipo', 'obrigacao')
          .eq('entidade_id', obrigacao.id)
          .eq('owner_id', userId)
          .is('deleted_at', null);
        
        const existentesSet = new Set(existentes?.map(l => l.regra) || []);
        
        // Criar lembrete de deadline_interna se não existir
        if (obrigacao.deadline_interna && !existentesSet.has(`${internaOffset}d antes de deadline_interna`)) {
          const { error: insertError } = await supabase
            .from('lembretes')
            .insert({
              entidade_tipo: 'obrigacao',
              entidade_id: obrigacao.id,
              owner_id: userId,
              regra: `${internaOffset}d antes de deadline_interna`,
              canal: 'email',
              ativo: true,
            });
          
          if (insertError) {
            console.error(`❌ Erro ao criar lembrete interna para ${obrigacao.id}:`, insertError);
            erros++;
          } else {
            criados++;
            console.log(`✅ Criado lembrete interna para ${obrigacao.id}`);
          }
        }
        
        // Criar lembrete de deadline_oficial se não existir
        if (obrigacao.deadline_oficial && !existentesSet.has(`${oficialOffset}d antes de deadline_oficial`)) {
          const { error: insertError } = await supabase
            .from('lembretes')
            .insert({
              entidade_tipo: 'obrigacao',
              entidade_id: obrigacao.id,
              owner_id: userId,
              regra: `${oficialOffset}d antes de deadline_oficial`,
              canal: 'email',
              ativo: true,
            });
          
          if (insertError) {
            console.error(`❌ Erro ao criar lembrete oficial para ${obrigacao.id}:`, insertError);
            erros++;
          } else {
            criados++;
            console.log(`✅ Criado lembrete oficial para ${obrigacao.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar obrigação ${obrigacao.id}:`, error);
        erros++;
      }
    }
    
    console.log(`✨ Backfill concluído: ${criados} lembretes criados, ${erros} erros`);
    
    return new Response(
      JSON.stringify({ success: true, criados, erros }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro geral:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
