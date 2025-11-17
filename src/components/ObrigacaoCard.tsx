import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Obrigacao {
  id: string;
  titulo: string;
  tipo: string;
  estado: string;
  deadline_revisao_senior: string;
  deadline_interna: string;
  deadline_oficial: string;
  projeto?: {
    nome: string;
    cor: string;
  };
}

interface ObrigacaoCardProps {
  obrigacao: Obrigacao;
  onQuickAction?: (action: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const estadoColors: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_revisao: "bg-info text-info-foreground",
  aprovado: "bg-success text-success-foreground",
  submetido: "bg-primary text-primary-foreground",
  concluido: "bg-success text-success-foreground",
  atrasado: "bg-destructive text-destructive-foreground",
};

const tipoLabels: Record<string, string> = {
  iva: "IVA",
  ies: "IES",
  saft: "SAF-T",
  modelo_10: "Modelo 10",
  modelo_22: "Modelo 22",
  dmr: "DMR",
  ifs: "IFS",
  outro: "Outro",
};

export function ObrigacaoCard({ obrigacao, onQuickAction, onEdit, onDelete }: ObrigacaoCardProps) {
  const isAtrasado = new Date(obrigacao.deadline_oficial) < new Date() && 
                     obrigacao.estado !== "concluido";

  const proximaDeadline = obrigacao.estado === "pendente" 
    ? obrigacao.deadline_revisao_senior
    : obrigacao.estado === "em_revisao"
    ? obrigacao.deadline_interna
    : obrigacao.deadline_oficial;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md" data-testid="obrigacao-card">
      <div className="h-1" style={{ backgroundColor: obrigacao.projeto?.cor || "#3B82F6" }} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tipoLabels[obrigacao.tipo] || obrigacao.tipo}
              </Badge>
              <Badge className={cn("text-xs", estadoColors[obrigacao.estado])}>
                {obrigacao.estado.replace("_", " ")}
              </Badge>
            </div>
            <h3 className="font-semibold leading-none">{obrigacao.titulo}</h3>
            {obrigacao.projeto && (
              <p className="text-sm text-muted-foreground">{obrigacao.projeto.nome}</p>
            )}
          </div>
          {isAtrasado && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-info" />
            <span className="text-xs">Revisão:</span>
            <span className="font-medium text-foreground">
              {format(new Date(obrigacao.deadline_revisao_senior), "dd MMM", { locale: pt })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-xs">Interna:</span>
            <span className="font-medium text-foreground">
              {format(new Date(obrigacao.deadline_interna), "dd MMM", { locale: pt })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-destructive" />
            <span className="text-xs">Oficial:</span>
            <span className="font-medium text-foreground">
              {format(new Date(obrigacao.deadline_oficial), "dd MMM", { locale: pt })}
            </span>
          </div>
        </div>

        {obrigacao.estado === "pendente" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onQuickAction?.("enviar_senior")}
              aria-label="Enviar ao Senior"
            >
              Enviar ao Senior
            </Button>
          </div>
        )}

        {obrigacao.estado === "em_revisao" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onQuickAction?.("aprovar")}
              aria-label="Aprovar obrigação"
            >
              Aprovar
            </Button>
          </div>
        )}

        {obrigacao.estado === "aprovado" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onQuickAction?.("submeter")}
              aria-label="Submeter obrigação"
            >
              Submeter
            </Button>
          </div>
        )}

        {obrigacao.estado === "submetido" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onQuickAction?.("concluir")}
              aria-label="Concluir obrigação"
            >
              Concluir
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs"
            onClick={onEdit}
            aria-label="Editar obrigação"
          >
            <Edit className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Eliminar obrigação"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Apagar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
