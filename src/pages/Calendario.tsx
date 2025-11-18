import { Layout } from "@/components/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarioFilters } from "@/components/CalendarioFilters";
import { useCalendarioFilters } from "@/hooks/useCalendarioFilters";
import { useCalendarioEvents, CalendarioEvent } from "@/hooks/useCalendarioEvents";
import { generateICS, downloadICS } from "@/lib/icsGenerator";
import { formatDatePT, getTodayInTimezone } from "@/lib/dateUtils";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, List, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

type ViewMode = "mensal" | "semanal" | "lista";

export default function Calendario() {
  const navigate = useNavigate();
  const { filters, updateFilter, clearFilters } = useCalendarioFilters();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("calendario-view") as ViewMode) || "mensal";
  });
  const [currentDate, setCurrentDate] = useState<Date>(getTodayInTimezone());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(getTodayInTimezone());
  const [visibleEventsCount, setVisibleEventsCount] = useState(100);

  // Calcular intervalo de datas baseado no filtro
  const dateRange = useMemo(() => {
    const today = getTodayInTimezone();
    switch (filters.intervalo) {
      case "hoje":
        return { inicio: today, fim: today };
      case "semana":
        return { inicio: startOfWeek(today, { weekStartsOn: 1 }), fim: endOfWeek(today, { weekStartsOn: 1 }) };
      case "mes":
        return { inicio: startOfMonth(today), fim: endOfMonth(today) };
      case "30dias":
        return { inicio: today, fim: addDays(today, 30) };
      default:
        return {};
    }
  }, [filters.intervalo]);

  // Calculate date range for current month view
  const monthDateRange = useMemo(() => {
    return {
      inicio: startOfMonth(currentMonthDate),
      fim: endOfMonth(currentMonthDate)
    };
  }, [currentMonthDate]);

  // Use month date range for fetching when in monthly view
  const effectiveDateRange = viewMode === "mensal" ? monthDateRange : dateRange;

  const { events: allEvents, loading } = useCalendarioEvents({
    projetos: filters.projetos,
    tipos: filters.tipos,
    estados: filters.estados,
    dataInicio: effectiveDateRange.inicio,
    dataFim: effectiveDateRange.fim,
    apenasOficiais: filters.apenasOficiais,
  });

  // Paginated events for list view
  const events = useMemo(() => {
    if (viewMode === "lista") {
      return allEvents.slice(0, visibleEventsCount);
    }
    return allEvents;
  }, [allEvents, viewMode, visibleEventsCount]);

  const hasMoreEvents = viewMode === "lista" && allEvents.length > visibleEventsCount;

  const loadMoreEvents = () => {
    setVisibleEventsCount(prev => prev + 100);
  };

  // Eventos futuros para export
  const futureEvents = useMemo(() => {
    const today = getTodayInTimezone();
    return allEvents.filter(e => e.data >= today);
  }, [allEvents]);

  const handleExportICS = () => {
    if (futureEvents.length === 0) {
      toast.error("Sem eventos futuros para exportar");
      return;
    }

    const baseUrl = window.location.origin;
    const icsContent = generateICS(futureEvents, baseUrl);
    downloadICS(icsContent);
    toast.success(`${futureEvents.length} eventos exportados`);
  };

  const handleEventClick = (event: CalendarioEvent) => {
    navigate(`/obrigacoes/${event.obrigacaoId}`);
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("calendario-view", mode);
  };

  const goToToday = () => {
    setCurrentMonthDate(getTodayInTimezone());
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonthDate(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <Layout>
      <div className="container mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Calendário</h1>
            <p className="text-sm text-muted-foreground">
              Visualizar todas as suas deadlines
            </p>
          </div>
          <Button onClick={handleExportICS} disabled={futureEvents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar .ICS
          </Button>
        </div>

        {/* Filtros */}
        <CalendarioFilters
          projetos={filters.projetos}
          tipos={filters.tipos}
          estados={filters.estados}
          intervalo={filters.intervalo}
          apenasOficiais={filters.apenasOficiais}
          onProjetosChange={(v) => updateFilter("projetos", v)}
          onTiposChange={(v) => updateFilter("tipos", v)}
          onEstadosChange={(v) => updateFilter("estados", v)}
          onIntervaloChange={(v) => updateFilter("intervalo", v as any)}
          onApenasOficiaisChange={(v) => updateFilter("apenasOficiais", v)}
          onClear={clearFilters}
        />

        {/* Navegação de vista */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "mensal" ? "default" : "outline"}
              size="sm"
              onClick={() => changeViewMode("mensal")}
              aria-label="Vista mensal"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Mensal
            </Button>
            <Button
              variant={viewMode === "semanal" ? "default" : "outline"}
              size="sm"
              onClick={() => changeViewMode("semanal")}
              aria-label="Vista semanal"
            >
              Semanal
            </Button>
            <Button
              variant={viewMode === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => changeViewMode("lista")}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth("prev")}
              disabled={loading}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              disabled={loading}
              aria-label="Hoje"
            >
              Hoje
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth("next")}
              disabled={loading}
              aria-label="Mês seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legenda */}
        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-info" />
              <span>Revisão Senior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span>Deadline Interna</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span>Deadline Oficial</span>
            </div>
          </div>
        </Card>

        {/* Vista */}
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            A carregar eventos...
          </Card>
        ) : (
          <>
            {viewMode === "mensal" && (
              <VistaMenusal 
                events={events} 
                currentDate={currentMonthDate}
                onEventClick={handleEventClick}
                onPrevMonth={() => navigateMonth("prev")}
                onNextMonth={() => navigateMonth("next")}
                loading={loading}
              />
            )}
            {viewMode === "semanal" && (
              <VistaSemanal events={events} currentDate={currentDate} onEventClick={handleEventClick} />
            )}
            {viewMode === "lista" && (
              <VistaLista events={events} onEventClick={handleEventClick} />
            )}
            {hasMoreEvents && viewMode === "lista" && (
              <div className="flex justify-center mt-4">
                <Button onClick={loadMoreEvents} variant="outline">
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// Vista Mensal
function VistaMenusal({ events, currentDate, onEventClick, onPrevMonth, onNextMonth, loading }: {
  events: CalendarioEvent[];
  currentDate: Date;
  onEventClick: (e: CalendarioEvent) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
}) {
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarioEvent[]>();
    events.forEach(e => {
      const key = format(e.data, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onPrevMonth}
          disabled={loading}
          aria-label="Mês anterior"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center font-semibold text-lg min-w-[200px]">
          {format(currentDate, "MMMM yyyy", { locale: pt })}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onNextMonth}
          disabled={loading}
          aria-label="Mês seguinte"
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Calendar
        mode="single"
        month={currentDate}
        className="rounded-md"
        modifiers={{
          hasEvents: (date) => eventsByDate.has(format(date, "yyyy-MM-dd")),
        }}
        modifiersClassNames={{
          hasEvents: "font-bold",
        }}
        components={{
          Day: ({ date, ...props }: any) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayEvents = eventsByDate.get(dateKey) || [];
            return (
              <div className="relative">
                <button {...props} className={props.className}>
                  {format(date, "d")}
                </button>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className={`h-1 w-1 rounded-full bg-${e.cor}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          },
        }}
      />
      
      {/* Lista de eventos do mês */}
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Sem eventos neste período
          </p>
        ) : (
          events.map(event => (
            <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
          ))
        )}
      </div>
    </Card>
  );
}

// Vista Semanal
function VistaSemanal({ events, currentDate, onEventClick }: {
  events: CalendarioEvent[];
  currentDate: Date;
  onEventClick: (e: CalendarioEvent) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarioEvent[]>();
    events.forEach(e => {
      const key = format(e.data, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  return (
    <Card className="p-4">
      <div className="mb-4 text-center font-semibold">
        Semana de {format(weekStart, "d MMM", { locale: pt })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pt })}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isToday = isSameDay(day, getTodayInTimezone());

          return (
            <div key={dateKey} className={`border rounded-lg p-2 ${isToday ? "border-primary" : ""}`}>
              <div className="text-xs font-medium text-center mb-2">
                {format(day, "EEE", { locale: pt })}
                <br />
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.map(e => (
                  <button
                    key={e.id}
                    onClick={() => onEventClick(e)}
                    className={`w-full text-xs p-1 rounded text-left bg-${e.cor}/10 hover:bg-${e.cor}/20 border-l-2 border-${e.cor}`}
                  >
                    {e.titulo.split("–")[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Vista Lista
function VistaLista({ events, onEventClick }: {
  events: CalendarioEvent[];
  onEventClick: (e: CalendarioEvent) => void;
}) {
  if (events.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Sem eventos para mostrar
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {events.map(event => (
        <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} data-testid="event-card" />
      ))}
    </div>
  );
}

// Card de evento
function EventCard({ event, onClick, ...props }: { event: CalendarioEvent; onClick: () => void; [key: string]: any }) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={event.cor === "info" ? "default" : event.cor === "warning" ? "secondary" : "destructive"}>
              {event.tipo === "REVISAO" ? "Revisão" : event.tipo === "INTERNA" ? "Interna" : "Oficial"}
            </Badge>
            <span className="text-sm font-medium">{formatDatePT(event.data)}</span>
          </div>
          <p className="font-semibold">{event.titulo}</p>
          {event.estado && (
            <p className="text-xs text-muted-foreground">
              Estado: {event.estado.replace("_", " ")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
