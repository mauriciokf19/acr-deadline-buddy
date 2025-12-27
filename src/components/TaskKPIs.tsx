import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskKPICardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  variant: "default" | "danger" | "warning" | "success";
  onClick?: () => void;
}

function TaskKPICard({ title, count, icon, variant, onClick }: TaskKPICardProps) {
  const colors = {
    default: "text-primary",
    danger: "text-destructive",
    warning: "text-orange-500",
    success: "text-green-500",
  };

  return (
    <Card 
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md active:scale-95"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2 text-xs font-medium", colors[variant])}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colors[variant])}>{count}</div>
      </CardContent>
    </Card>
  );
}

interface TaskKPIsProps {
  total: number;
  overdue: number;
  dueToday: number;
  completed: number;
}

export function TaskKPIs({ total, overdue, dueToday, completed }: TaskKPIsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <TaskKPICard
        title="Total"
        count={total}
        icon={<ListTodo className="h-3 w-3" />}
        variant="default"
      />
      <TaskKPICard
        title="Atrasadas"
        count={overdue}
        icon={<AlertTriangle className="h-3 w-3" />}
        variant="danger"
      />
      <TaskKPICard
        title="Hoje"
        count={dueToday}
        icon={<Clock className="h-3 w-3" />}
        variant="warning"
      />
      <TaskKPICard
        title="Concluídas"
        count={completed}
        icon={<CheckCircle2 className="h-3 w-3" />}
        variant="success"
      />
    </div>
  );
}