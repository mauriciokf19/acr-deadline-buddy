import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDatePT } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface EventoObrigacao {
  id: string;
  titulo: string;
  tipo_evento: "REVISAO" | "INTERNA" | "OFICIAL";
  data_evento: string;
  estado: string;
  periodicidade: string;
  periodo_referencia: string;
  projeto_nome: string;
  projeto_cor: string;
}

interface DashboardEventsListProps {
  eventos: EventoObrigacao[];
}

export function DashboardEventsList({ eventos }: DashboardEventsListProps) {
  const navigate = useNavigate();

  // Agrupar eventos por data
  const eventosPorDia = eventos.reduce((acc, evento) => {
    const data = evento.data_evento.split('T')[0]; // YYYY-MM-DD
    if (!acc[data]) acc[data] = [];
    acc[data].push(evento);
    return acc;
  }, {} as Record<string, EventoObrigacao[]>);

  const getEventoColor = (tipo: string) => {
    switch (tipo) {
      case "REVISAO": return "text-blue-500 border-blue-500";
      case "INTERNA": return "text-yellow-500 border-yellow-500";
      case "OFICIAL": return "text-red-500 border-red-500";
      default: return "text-muted-foreground border-muted";
    }
  };

  const getEventoLabel = (tipo: string) => {
    switch (tipo) {
      case "REVISAO": return "Revisão";
      case "INTERNA": return "Interna";
      case "OFICIAL": return "Oficial";
      default: return tipo;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendente": return <Badge variant="outline">Pendente</Badge>;
      case "em_revisao": return <Badge variant="secondary">Em Revisão</Badge>;
      case "aprovado": return <Badge className="bg-green-500">Aprovado</Badge>;
      case "submetido": return <Badge className="bg-blue-500">Submetido</Badge>;
      case "concluido": return <Badge className="bg-green-600">Concluído</Badge>;
      case "atrasado": return <Badge variant="destructive">Atrasado</Badge>;
      default: return null;
    }
  };

  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum evento nos próximos 7 dias
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(eventosPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, eventosData]) => {
          const dataObj = parseISO(data);
          const diaSemana = format(dataObj, "EEEE", { locale: pt });
          const dataFormatada = formatDatePT(data);

          return (
            <div key={data} className="space-y-2">
              <h3 className="text-sm font-semibold capitalize">
                {diaSemana}, {dataFormatada}
              </h3>
              <div className="space-y-2">
                {eventosData.map((evento) => (
                  <Card
                    key={`${evento.id}-${evento.tipo_evento}`}
                    className="cursor-pointer transition-all hover:shadow-md active:scale-98"
                    onClick={() => navigate(`/obrigacoes?id=${evento.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded border",
                                getEventoColor(evento.tipo_evento)
                              )}
                            >
                              {getEventoLabel(evento.tipo_evento)}
                            </span>
                            {getEstadoBadge(evento.estado)}
                          </div>
                          <p className="text-sm font-medium truncate">{evento.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {evento.periodo_referencia} • {evento.projeto_nome}
                          </p>
                        </div>
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: evento.projeto_cor }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
