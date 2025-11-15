import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTodayInTimezone } from "@/lib/dateUtils";

export type TipoEvento = "REVISAO" | "INTERNA" | "OFICIAL";

export interface CalendarioEvent {
  id: string; // obrigacao_id + sufixo
  titulo: string;
  data: Date;
  tipo: TipoEvento;
  cor: "info" | "warning" | "destructive";
  obrigacaoId: string;
  projetoId: string;
  projetoNome: string;
  prioridade?: string;
  estado?: string;
  periodoReferencia?: string;
  tipoObrigacao: string;
}

interface UseCalendarioEventsParams {
  projetos?: string[];
  tipos?: string[];
  estados?: string[];
  prioridades?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  apenasOficiais?: boolean;
}

export function useCalendarioEvents(params: UseCalendarioEventsParams = {}) {
  const [events, setEvents] = useState<CalendarioEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [
    params.projetos,
    params.tipos,
    params.estados,
    params.prioridades,
    params.dataInicio,
    params.dataFim,
    params.apenasOficiais,
  ]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("obrigacoes")
        .select(`
          id,
          titulo,
          tipo,
          periodicidade,
          periodo_referencia,
          deadline_revisao_senior,
          deadline_interna,
          deadline_oficial,
          estado,
          projeto_id,
          projetos (
            id,
            nome
          )
        `)
        .is("deleted_at", null);

      // Aplicar filtros
      if (params.projetos && params.projetos.length > 0) {
        query = query.in("projeto_id", params.projetos);
      }
      if (params.tipos && params.tipos.length > 0) {
        query = query.in("tipo", params.tipos as any);
      }
      if (params.estados && params.estados.length > 0) {
        query = query.in("estado", params.estados as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformar cada obrigação em até 3 eventos
      const allEvents: CalendarioEvent[] = [];

      data?.forEach((obr: any) => {
        const projetoNome = obr.projetos?.nome || "Sem projeto";
        const tipoLabel = getTipoLabel(obr.tipo);
        const periodoLabel = obr.periodo_referencia || "";

        // Evento 1: Revisão Senior
        if (obr.deadline_revisao_senior && !params.apenasOficiais) {
          const dataRev = new Date(obr.deadline_revisao_senior);
          if (isWithinRange(dataRev, params.dataInicio, params.dataFim)) {
            allEvents.push({
              id: `${obr.id}-REV`,
              titulo: `${tipoLabel} ${periodoLabel} – ${projetoNome} – Revisão`,
              data: dataRev,
              tipo: "REVISAO",
              cor: "info",
              obrigacaoId: obr.id,
              projetoId: obr.projeto_id,
              projetoNome,
              estado: obr.estado,
              periodoReferencia: obr.periodo_referencia,
              tipoObrigacao: obr.tipo,
            });
          }
        }

        // Evento 2: Deadline Interna
        if (obr.deadline_interna && !params.apenasOficiais) {
          const dataInt = new Date(obr.deadline_interna);
          if (isWithinRange(dataInt, params.dataInicio, params.dataFim)) {
            allEvents.push({
              id: `${obr.id}-INT`,
              titulo: `${tipoLabel} ${periodoLabel} – ${projetoNome} – Interna`,
              data: dataInt,
              tipo: "INTERNA",
              cor: "warning",
              obrigacaoId: obr.id,
              projetoId: obr.projeto_id,
              projetoNome,
              estado: obr.estado,
              periodoReferencia: obr.periodo_referencia,
              tipoObrigacao: obr.tipo,
            });
          }
        }

        // Evento 3: Deadline Oficial
        if (obr.deadline_oficial) {
          const dataOfi = new Date(obr.deadline_oficial);
          if (isWithinRange(dataOfi, params.dataInicio, params.dataFim)) {
            allEvents.push({
              id: `${obr.id}-OFI`,
              titulo: `${tipoLabel} ${periodoLabel} – ${projetoNome} – Oficial`,
              data: dataOfi,
              tipo: "OFICIAL",
              cor: "destructive",
              obrigacaoId: obr.id,
              projetoId: obr.projeto_id,
              projetoNome,
              estado: obr.estado,
              periodoReferencia: obr.periodo_referencia,
              tipoObrigacao: obr.tipo,
            });
          }
        }
      });

      // Ordenar por data
      allEvents.sort((a, b) => a.data.getTime() - b.data.getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, reload: loadEvents };
}

function isWithinRange(date: Date, inicio?: Date, fim?: Date): boolean {
  if (!inicio && !fim) return true;
  if (inicio && date < inicio) return false;
  if (fim && date > fim) return false;
  return true;
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    iva: "IVA",
    ies: "IES",
    saft: "SAF-T",
    modelo_10: "M10",
    modelo_22: "M22",
    dmr: "DMR",
    ifs: "IFS",
    outro: "Outro",
  };
  return labels[tipo] || tipo.toUpperCase();
}
