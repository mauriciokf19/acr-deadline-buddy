import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RegraParsed {
  tipo: 'INTERNA' | 'OFICIAL' | 'FOLLOWUP';
  offset: number;
  unidade: 'd' | 'h';
}

function parseRegra(regra: string): RegraParsed | null {
  // Normalizar: lowercase, remover acentos, normalizar espaços
  const normalized = regra
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/\s+/g, ' ')
    .trim();
  
  // Pattern: "Xd antes de deadline_interna" ou "X dias antes de/da deadline interna"
  const internaMatch = normalized.match(/(\d+)\s*(d|dias?)\s*antes\s*(de|da)?\s*(?:a\s+)?deadline[_\s]?interna/);
  if (internaMatch) {
    return { tipo: 'INTERNA', offset: parseInt(internaMatch[1]), unidade: 'd' };
  }
  
  // Pattern: "Xd antes de deadline_oficial" ou "X dias antes de/da deadline oficial"
  const oficialMatch = normalized.match(/(\d+)\s*(d|dias?)\s*antes\s*(de|da)?\s*(?:a\s+)?deadline[_\s]?oficial/);
  if (oficialMatch) {
    return { tipo: 'OFICIAL', offset: parseInt(oficialMatch[1]), unidade: 'd' };
  }
  
  // Pattern: "Xh após envio_senior" ou "X horas após envio ao senior sem feedback"
  const followupMatch = normalized.match(/(\d+)\s*(h|horas?)\s*apos\s*(o\s+)?envio(\s+ao)?[_\s]?senior/);
  if (followupMatch) {
    return { tipo: 'FOLLOWUP', offset: parseInt(followupMatch[1]), unidade: 'h' };
  }
  
  return null;
}

function calcularProximoDisparo(
  parsed: RegraParsed,
  obrigacao: any,
  silencioInicio: string | null,
  silencioFim: string | null
): Date | null {
  let dataAlvo: Date | null = null;
  
  if (parsed.tipo === 'INTERNA' && obrigacao.deadline_interna) {
    const deadline = new Date(obrigacao.deadline_interna);
    // Para deadlines all-day, calcular X dias antes e definir hora 08:00 Europe/Lisbon
    dataAlvo = new Date(deadline.getTime() - parsed.offset * 24 * 60 * 60 * 1000);
    // Converter para Europe/Lisbon e definir 08:00
    const lisbonDate = new Date(dataAlvo.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
    lisbonDate.setHours(8, 0, 0, 0);
    dataAlvo = lisbonDate;
  } else if (parsed.tipo === 'OFICIAL' && obrigacao.deadline_oficial) {
    const deadline = new Date(obrigacao.deadline_oficial);
    // Para deadlines all-day, calcular X dias antes e definir hora 08:00 Europe/Lisbon
    dataAlvo = new Date(deadline.getTime() - parsed.offset * 24 * 60 * 60 * 1000);
    // Converter para Europe/Lisbon e definir 08:00
    const lisbonDate = new Date(dataAlvo.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
    lisbonDate.setHours(8, 0, 0, 0);
    dataAlvo = lisbonDate;
  } else if (parsed.tipo === 'FOLLOWUP' && obrigacao.data_envio_senior && !obrigacao.data_feedback_senior) {
    const envio = new Date(obrigacao.data_envio_senior);
    dataAlvo = new Date(envio.getTime() + parsed.offset * 60 * 60 * 1000);
  }
  
  if (!dataAlvo) {
    return null;
  }
  
  // Aplicar janela de silêncio
  if (silencioInicio && silencioFim) {
    dataAlvo = ajustarParaJanelaSilencio(dataAlvo, silencioInicio, silencioFim);
  }
  
  // Se for passado mas recente (últimas 24h), permitir disparo imediato
  const agora = new Date();
  const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  if (dataAlvo < agora && dataAlvo > umDiaAtras) {
    return agora; // Disparar imediatamente
  }
  
  // Se for muito no passado, ignorar
  if (dataAlvo < agora) {
    return null;
  }
  
  return dataAlvo;
}

function ajustarParaJanelaSilencio(data: Date, inicio: string, fim: string): Date {
  // TZ Europe/Lisbon
  const lisbon = new Date(data.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
  const hora = lisbon.getHours();
  const minuto = lisbon.getMinutes();
  const horaAtual = hora + minuto / 60;
  
  const [inicioH, inicioM] = inicio.split(':').map(Number);
  const [fimH, fimM] = fim.split(':').map(Number);
  const horaInicio = inicioH + inicioM / 60;
  const horaFim = fimH + fimM / 60;
  
  // Se janela cruza meia-noite (ex: 20:00-08:00)
  if (horaInicio > horaFim) {
    // Silêncio: [20:00, 24:00) U [00:00, 08:00)
    if (horaAtual >= horaInicio || horaAtual < horaFim) {
      // Está no silêncio, reagendar para horaFim
      const ajustada = new Date(data);
      ajustada.setHours(fimH, fimM, 0, 0);
      if (horaAtual >= horaInicio) {
        // Se for depois de 20:00, reagendar para 08:00 do dia seguinte
        ajustada.setDate(ajustada.getDate() + 1);
      }
      return ajustada;
    }
  } else {
    // Silêncio: [horaInicio, horaFim)
    if (horaAtual >= horaInicio && horaAtual < horaFim) {
      const ajustada = new Date(data);
      ajustada.setHours(fimH, fimM, 0, 0);
      return ajustada;
    }
  }
  
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔄 Iniciando cálculo de lembretes...');
    
    // Buscar lembretes ativos sem proximo_disparo_em ou desatualizados
    const { data: lembretes, error: lembreteError } = await supabase
      .from('lembretes')
      .select('*')
      .eq('ativo', true)
      .is('deleted_at', null)
      .or('proximo_disparo_em.is.null,updated_at.gte.now()-1hour');
    
    if (lembreteError) throw lembreteError;
    
    console.log(`📋 Encontrados ${lembretes?.length || 0} lembretes para processar`);
    
    let processados = 0;
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
              .update({ ativo: false, deleted_at: new Date().toISOString() })
              .eq('id', lembrete.id);
            continue;
          }
          
          entidade = obrigacao;
          owner_id = obrigacao.owner_id;
        }
        
        if (!entidade) continue;
        
        // Buscar configurações do utilizador
        const { data: profile } = await supabase
          .from('profiles')
          .select('janela_silencio_inicio, janela_silencio_fim')
          .eq('id', owner_id)
          .single();
        
        // Parse da regra
        const parsed = parseRegra(lembrete.regra);
        if (!parsed) {
          console.warn(`⚠️ Regra inválida: ${lembrete.regra}`);
          continue;
        }
        
        // Calcular próximo disparo
        const proximoDisparo = calcularProximoDisparo(
          parsed,
          entidade,
          profile?.janela_silencio_inicio,
          profile?.janela_silencio_fim
        );
        
        if (proximoDisparo) {
          await supabase
            .from('lembretes')
            .update({ proximo_disparo_em: proximoDisparo.toISOString() })
            .eq('id', lembrete.id);
          
          processados++;
          console.log(`✅ Lembrete ${lembrete.id}: próximo disparo em ${proximoDisparo.toISOString()}`);
        } else {
          // Não há disparo futuro válido
          await supabase
            .from('lembretes')
            .update({ proximo_disparo_em: null })
            .eq('id', lembrete.id);
          
          console.log(`⏭️ Lembrete ${lembrete.id}: sem disparo futuro válido`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar lembrete ${lembrete.id}:`, error);
        erros++;
      }
    }
    
    console.log(`✨ Cálculo concluído: ${processados} processados, ${erros} erros`);
    
    return new Response(
      JSON.stringify({ success: true, processados, erros }),
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
