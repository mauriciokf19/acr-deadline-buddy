import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { TaskKPIs } from "@/components/TaskKPIs";
import { DashboardEventsList } from "@/components/DashboardEventsList";
import { MyWeekList } from "@/components/MyWeekList";
import { DashboardFAB } from "@/components/DashboardFAB";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { startOfWeek, endOfWeek, addDays, isToday, isBefore, startOfDay } from "date-fns";
import { getTodayPT } from "@/lib/dateUtils";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import type { TaskWithRelations } from "@/types/tasks";

export default function Dashboard() {
  const { user } = useAuth();
  const { filters } = useDashboardFilters();
  const [loading, setLoading] = useState(true);
  
  // KPIs de Obrigações
  const [kpis, setKpis] = useState({
    atrasadas: 0,
    vencemHoje: 0,
    estaSemana: 0,
    noPrazo: 0,
  });

  // KPIs de Tarefas
  const [taskKpis, setTaskKpis] = useState({
    total: 0,
    overdue: 0,
    dueToday: 0,
    completed: 0,
  });
  
  // Eventos próximos 7 dias
  const [eventos, setEventos] = useState<any[]>([]);

  // Tarefas - My Week
  const todayPT = getTodayPT();
  const weekStart = startOfWeek(todayPT, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(todayPT, { weekStartsOn: 1 });

  const { data: allTasks = [], isLoading: tasksLoading } = useTasks();
  const updateTask = useUpdateTask();

  // Filtrar tarefas da semana
  const myWeekTasks = allTasks.filter((task: TaskWithRelations) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    // Include overdue + this week
    return dueDate <= weekEnd;
  }).sort((a, b) => {
    // Sort: overdue first, then by date
    const dateA = new Date(a.due_date!);
    const dateB = new Date(b.due_date!);
    return dateA.getTime() - dateB.getTime();
  });

  // Calcular KPIs de tarefas
  useEffect(() => {
    if (!allTasks) return;

    const today = startOfDay(new Date());
    const activeTasks = allTasks.filter(t => t.status !== "done");
    const completedTasks = allTasks.filter(t => t.status === "done");
    
    const overdueTasks = activeTasks.filter(t => {
      if (!t.due_date) return false;
      return isBefore(new Date(t.due_date), today);
    });

    const dueTodayTasks = activeTasks.filter(t => {
      if (!t.due_date) return false;
      return isToday(new Date(t.due_date));
    });

    setTaskKpis({
      total: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
    });
  }, [allTasks]);

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
      .select("id, estado, deadline_oficial, deadline_interna, deadline_revisao_senior, client_id")
      .is("deleted_at", null)
      .not("estado", "in", '("concluido","submetido")');

    // Aplicar filtros por cliente
    if (filters.clientes && filters.clientes.length > 0) {
      query = query.in("client_id", filters.clientes);
    }
    if (filters.tipos.length > 0) {
      query = query.in("tipo", filters.tipos as any);
    }
    if (filters.estados.length > 0) {
      query = query.in("estado", filters.estados as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Use Europe/Lisbon timezone
    const TIMEZONE = "Europe/Lisbon";
    const todayPT = getTodayPT();
    const inicioSemana = startOfWeek(todayPT, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(todayPT, { weekStartsOn: 1 });

    let atrasadas = 0;
    let vencemHoje = 0;
    let estaSemana = 0;
    let noPrazo = 0;

    (data || []).forEach((obr: any) => {
      // Convert all dates to Europe/Lisbon timezone and normalize to start of day
      const oficial = toZonedTime(new Date(obr.deadline_oficial), TIMEZONE);
      oficial.setHours(0, 0, 0, 0);
      
      const interna = toZonedTime(new Date(obr.deadline_interna), TIMEZONE);
      interna.setHours(0, 0, 0, 0);
      
      const revisao = toZonedTime(new Date(obr.deadline_revisao_senior), TIMEZONE);
      revisao.setHours(0, 0, 0, 0);

      // Atrasadas: estado NOT IN ('Submetido','Concluido') AND todayPT > deadline_oficial
      if (oficial < todayPT) {
        atrasadas++;
        return;
      }

      // Vencem Hoje: qualquer das 3 datas = hoje
      if (
        oficial.getTime() === todayPT.getTime() ||
        interna.getTime() === todayPT.getTime() ||
        revisao.getTime() === todayPT.getTime()
      ) {
        vencemHoje++;
        return;
      }

      // Esta Semana: qualquer das 3 datas dentro da semana ISO
      if (
        (oficial >= inicioSemana && oficial <= fimSemana) ||
        (interna >= inicioSemana && interna <= fimSemana) ||
        (revisao >= inicioSemana && revisao <= fimSemana)
      ) {
        estaSemana++;
        return;
      }

      // No Prazo: ativas e não classificadas acima
      noPrazo++;
    });

    setKpis({ atrasadas, vencemHoje, estaSemana, noPrazo });
  };

  const loadEventos = async () => {
    const todayPT = getTodayPT();
    const seteDias = addDays(todayPT, 7);

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
        client_id,
        client:clients(name)
      `)
      .is("deleted_at", null);

    // Aplicar filtros por cliente
    if (filters.clientes && filters.clientes.length > 0) {
      query = query.in("client_id", filters.clientes);
    }
    if (filters.tipos.length > 0) {
      query = query.in("tipo", filters.tipos as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    const TIMEZONE = "Europe/Lisbon";

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
        const dataEvento = toZonedTime(new Date(dataStr), TIMEZONE);
        dataEvento.setHours(0, 0, 0, 0);

        if (dataEvento >= todayPT && dataEvento <= seteDias) {
          eventosArray.push({
            id: obr.id,
            titulo: obr.titulo,
            tipo_evento: tipo,
            data_evento: dataStr,
            estado: obr.estado,
            periodicidade: obr.periodicidade,
            periodo_referencia: obr.periodo_referencia || "-",
            cliente_nome: obr.client?.name || "Sem cliente",
          });
        }
      });
    });

    // Ordenar por data
    eventosArray.sort((a, b) => a.data_evento.localeCompare(b.data_evento));
    setEventos(eventosArray);
  };

  // Handlers para My Week
  const handleCompleteTask = async (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
    } catch (error) {
      // Toast already handled by hook
    }
  };

  const handleRescheduleTask = async (taskId: string, newDate: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, due_date: newDate });
      toast.success("Tarefa adiada para amanhã");
    } catch (error) {
      // Toast already handled by hook
    }
  };

  const handleReassignTask = (taskId: string) => {
    // TODO: Open modal to reassign
    toast.info("Funcionalidade de reatribuição em desenvolvimento");
  };

  if (loading && tasksLoading) {
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
      <div className="container mx-auto max-w-2xl space-y-6 p-4 pb-24">
        <DemoModeBanner />

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das suas obrigações e tarefas
          </p>
        </div>

        {/* KPIs de Tarefas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Minhas Tarefas</h2>
          <TaskKPIs 
            total={taskKpis.total}
            overdue={taskKpis.overdue}
            dueToday={taskKpis.dueToday}
            completed={taskKpis.completed}
          />
        </div>

        {/* My Week */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">My Week</h2>
          <p className="text-xs text-muted-foreground">
            Tarefas atrasadas e desta semana
          </p>
          <MyWeekList
            tasks={myWeekTasks}
            onComplete={handleCompleteTask}
            onReschedule={handleRescheduleTask}
            onReassign={handleReassignTask}
            loading={tasksLoading}
          />
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

        {/* KPIs de Obrigações */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Obrigações Fiscais</h2>
          <DashboardKPIs
            atrasadas={kpis.atrasadas}
            vencemHoje={kpis.vencemHoje}
            estaSemana={kpis.estaSemana}
            noPrazo={kpis.noPrazo}
          />
        </div>

        {/* Hoje & Próximos 7 dias */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Próximos 7 dias</h2>
          <DashboardEventsList eventos={eventos} />
        </div>
      </div>

      {/* FAB */}
      <DashboardFAB />
    </Layout>
  );
}