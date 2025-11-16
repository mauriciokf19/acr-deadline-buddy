import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Calendar, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  variant: "danger" | "warning" | "info" | "success";
  onClick: () => void;
  "aria-label"?: string;
}

function KPICard({ title, count, icon, variant, onClick, "aria-label": ariaLabel }: KPICardProps) {
  const colors = {
    danger: "text-destructive",
    warning: "text-orange-500",
    info: "text-yellow-500",
    success: "text-green-500",
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md active:scale-95"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || title}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2 text-sm font-medium", colors[variant])}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", colors[variant])}>{count}</div>
      </CardContent>
    </Card>
  );
}

interface DashboardKPIsProps {
  atrasadas: number;
  vencemHoje: number;
  estaSemana: number;
  noPrazo: number;
}

export function DashboardKPIs({ atrasadas, vencemHoje, estaSemana, noPrazo }: DashboardKPIsProps) {
  const navigate = useNavigate();

  const handleKPIClick = (filter: string) => {
    // Deep link para página Obrigações com filtro aplicado
    navigate(`/obrigacoes?prazo=${filter}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <KPICard
        title="Atrasadas"
        count={atrasadas}
        icon={<AlertCircle className="h-4 w-4" />}
        variant="danger"
        onClick={() => handleKPIClick("atrasadas")}
        aria-label="Ver obrigações atrasadas. Obrigações com deadline oficial ultrapassado e estado diferente de Submetido ou Concluído"
      />
      <KPICard
        title="Vencem Hoje"
        count={vencemHoje}
        icon={<Clock className="h-4 w-4" />}
        variant="warning"
        onClick={() => handleKPIClick("hoje")}
        aria-label="Ver obrigações que vencem hoje. Qualquer das 3 datas (Revisão, Interna ou Oficial) coincide com hoje"
      />
      <KPICard
        title="Esta Semana"
        count={estaSemana}
        icon={<Calendar className="h-4 w-4" />}
        variant="info"
        onClick={() => handleKPIClick("semana")}
        aria-label="Ver obrigações desta semana. Qualquer das 3 datas dentro da semana ISO atual"
      />
      <KPICard
        title="No Prazo"
        count={noPrazo}
        icon={<CheckCircle className="h-4 w-4" />}
        variant="success"
        onClick={() => handleKPIClick("futuro")}
        aria-label="Ver obrigações no prazo. Obrigações ativas que não estão atrasadas, não vencem hoje e não vencem esta semana"
      />
    </div>
  );
}
