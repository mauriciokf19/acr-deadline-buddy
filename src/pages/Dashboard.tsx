import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { DashboardEventsList } from "@/components/DashboardEventsList";
import { ProjetoProgress } from "@/components/ProjetoProgress";
import { DashboardFAB } from "@/components/DashboardFAB";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { filters } = useDashboardFilters();
  const [loading, setLoading] = useState(true);
  
  // KPIs
  const [kpis, setKpis] = useState({
    atrasadas: 0,
    vencemHoje: 0,
    estaSemana: 0,
    noPrazo: 0,
  });
  
  // Eventos próximos 7 dias
  const [eventos, setEventos] = useState<any[]>([]);
  
  // Progresso por projeto
  const [projetos, setProjeitos] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIs(),
        loadEventos(),
        loadProjetoProgress(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIs = async () => {
    let query = supabase
      .from("obrigacoes")
      .select("id, estado, deadline_oficial, deadline_interna, deadline_revisao_senior")
      .is("deleted_at", null)
      .not("estado", "in", '("concluido","submetido")');

    // Aplicar filtros
    if (filters.projetos.length > 0) {
      query = query.in("projeto_id", filters.projetos);
    }
    if (filters.tipos.length > 0) {
      query = query.in("tipo", filters.tipos as any);
    }
    if (filters.estados.length > 0) {
      query = query.in("estado", filters.estados as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

    let atrasadas = 0;
    let vencemHoje = 0;
    let estaSemana = 0;
    let noPrazo = 0;

    (data || []).forEach((obr: any) => {
      const oficial = new Date(obr.deadline_oficial);
      const interna = new Date(obr.deadline_interna);
      const revisao = new Date(obr.deadline_revisao_senior);
      
      oficial.setHours(0, 0, 0, 0);
      interna.setHours(0, 0, 0, 0);
      revisao.setHours(0, 0, 0, 0);

      // Atrasadas: deadline_oficial < hoje
      if (oficial < hoje) {
        atrasadas++;
        return;
      }

      // Vencem Hoje: qualquer das 3 datas = hoje
      if (
        oficial.getTime() === hoje.getTime() ||
        interna.getTime() === hoje.getTime() ||
        revisao.getTime() === hoje.getTime()
      ) {
        vencemHoje++;
        return;
      }

      // Esta Semana: qualquer das 3 datas dentro da semana
      if (
        (oficial >= inicioSemana && oficial <= fimSemana) ||
        (interna >= inicioSemana && interna <= fimSemana) ||
        (revisao >= inicioSemana && revisao <= fimSemana)
      ) {
        estaSemana++;
        return;
      }

      // No Prazo: resto
      noPrazo++;
    });

    setKpis({ atrasadas, vencemHoje, estaSemana, noPrazo });
  };

  const loadEventos = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const seteDias = addDays(hoje, 7);

    let query = supabase
      .from("obrigacoes")
      .select(`
        id,
        titulo,
        estado,
        periodicidade,
        periodo_referencia,
        deadline_oficial,
        deadline_interna,
        deadline_revisao_senior,
        projeto:projetos(nome, cor)
      `)
      .is("deleted_at", null);

    // Aplicar filtros
    if (filters.projetos.length > 0) {
      query = query.in("projeto_id", filters.projetos);
    }
    if (filters.tipos.length > 0) {
      query = query.in("tipo", filters.tipos as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Expandir para eventos individuais
    const eventosArray: any[] = [];
    (data || []).forEach((obr: any) => {
      const datas = [
        { tipo: "REVISAO", data: obr.deadline_revisao_senior },
        { tipo: "INTERNA", data: obr.deadline_interna },
        { tipo: "OFICIAL", data: obr.deadline_oficial },
      ];

      datas.forEach(({ tipo, data: dataStr }) => {
        if (!dataStr) return;
        const dataEvento = new Date(dataStr);
        dataEvento.setHours(0, 0, 0, 0);

        if (dataEvento >= hoje && dataEvento <= seteDias) {
          eventosArray.push({
            id: obr.id,
            titulo: obr.titulo,
            tipo_evento: tipo,
            data_evento: dataStr,
            estado: obr.estado,
            periodicidade: obr.periodicidade,
            periodo_referencia: obr.periodo_referencia || "-",
            projeto_nome: obr.projeto?.nome || "Sem projeto",
            projeto_cor: obr.projeto?.cor || "#3B82F6",
          });
        }
      });
    });

    // Ordenar por data
    eventosArray.sort((a, b) => a.data_evento.localeCompare(b.data_evento));
    setEventos(eventosArray);
  };

  const loadProjetoProgress = async () => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

    // Obter todos os projetos ativos
    const { data: projetosData, error: projetosError } = await supabase
      .from("projetos")
      .select("id, nome, cor, ativo")
      .eq("ativo", true)
      .order("nome");

    if (projetosError) throw projetosError;

    // Para cada projeto, calcular estatísticas
    const projetosComStats = await Promise.all(
      (projetosData || []).map(async (projeto: any) => {
        // Total de obrigações ativas
        const { count: total } = await supabase
          .from("obrigacoes")
          .select("*", { count: "exact", head: true })
          .eq("projeto_id", projeto.id)
          .is("deleted_at", null);

        // Obrigações concluídas/submetidas
        const { count: concluidas } = await supabase
          .from("obrigacoes")
          .select("*", { count: "exact", head: true })
          .eq("projeto_id", projeto.id)
          .is("deleted_at", null)
          .in("estado", ["concluido", "submetido"]);

        // Eventos esta semana
        const { data: obrigacoesSemana } = await supabase
          .from("obrigacoes")
          .select("deadline_oficial, deadline_interna, deadline_revisao_senior")
          .eq("projeto_id", projeto.id)
          .is("deleted_at", null);

        let eventosSemana = 0;
        (obrigacoesSemana || []).forEach((obr: any) => {
          const datas = [
            obr.deadline_revisao_senior,
            obr.deadline_interna,
            obr.deadline_oficial,
          ];

          datas.forEach((dataStr) => {
            if (!dataStr) return;
            const data = new Date(dataStr);
            data.setHours(0, 0, 0, 0);
            if (data >= inicioSemana && data <= fimSemana) {
              eventosSemana++;
            }
          });
        });

        return {
          id: projeto.id,
          nome: projeto.nome,
          cor: projeto.cor,
          total: total || 0,
          concluidas: concluidas || 0,
          eventosSemana,
        };
      })
    );

    // Top 5 por eventos na semana
    const top5 = projetosComStats
      .filter((p) => p.eventosSemana > 0)
      .sort((a, b) => b.eventosSemana - a.eventosSemana)
      .slice(0, 5);

    setProjeitos(top5);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4 pb-24">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das suas obrigações fiscais
          </p>
        </div>

        {/* Legenda de cores */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Revisão</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Interna</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Oficial</span>
          </div>
        </div>

        {/* KPIs */}
        <DashboardKPIs
          atrasadas={kpis.atrasadas}
          vencemHoje={kpis.vencemHoje}
          estaSemana={kpis.estaSemana}
          noPrazo={kpis.noPrazo}
        />

        {/* Hoje & Próximos 7 dias */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Hoje & Próximos 7 dias</h2>
          <DashboardEventsList eventos={eventos} />
        </div>

        {/* Progresso por Projeto */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Progresso por Projeto</h2>
          <p className="text-xs text-muted-foreground">
            Top 5 projetos com entregas esta semana
          </p>
          <ProjetoProgress projetos={projetos} />
        </div>
      </div>

      {/* FAB */}
      <DashboardFAB />
    </Layout>
  );
}
