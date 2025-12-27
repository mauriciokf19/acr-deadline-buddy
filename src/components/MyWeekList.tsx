import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Calendar, 
  ArrowRight, 
  User,
  Mail,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations, TaskPriority } from "@/types/tasks";

interface MyWeekListProps {
  tasks: TaskWithRelations[];
  onComplete: (taskId: string) => void;
  onReschedule: (taskId: string, newDate: string) => void;
  onReassign: (taskId: string) => void;
  loading?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function MyWeekList({ 
  tasks, 
  onComplete, 
  onReschedule,
  onReassign,
  loading 
}: MyWeekListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Sem tarefas para esta semana
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAdiar = (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onReschedule(taskId, tomorrow.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date();
        const isDone = task.status === "done";

        return (
          <Card 
            key={task.id} 
            className={cn(
              "transition-all",
              isDone && "opacity-60",
              isOverdue && !isDone && "border-destructive/50"
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {/* Checkbox para concluir */}
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => onComplete(task.id)}
                  className="mt-0.5"
                  aria-label={`Marcar tarefa "${task.title}" como ${isDone ? "pendente" : "concluída"}`}
                />

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        isDone && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      
                      {/* Meta info */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {/* Cliente */}
                        {task.client && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {task.client.name}
                          </span>
                        )}
                        
                        {/* Email thread */}
                        {task.email_thread && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Thread
                          </span>
                        )}

                        {/* Data */}
                        {task.due_date && (
                          <span className={cn(
                            "inline-flex items-center gap-1",
                            isOverdue && !isDone && "text-destructive font-medium"
                          )}>
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), "dd/MM", { locale: pt })}
                            {isOverdue && !isDone && " (atrasada)"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prioridade + Menu */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", priorityColors[task.priority as TaskPriority] || priorityColors.medium)}
                      >
                        {priorityLabels[task.priority as TaskPriority] || "Média"}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            aria-label="Ações da tarefa"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAdiar(task.id)}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Adiar para amanhã
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReassign(task.id)}>
                            <User className="mr-2 h-4 w-4" />
                            Reatribuir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}