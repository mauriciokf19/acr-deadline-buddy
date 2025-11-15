import { useState } from "react";
import { Plus, FolderKanban, ClipboardCheck, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjetoForm } from "@/components/ProjetoForm";
import { ObrigacaoForm } from "@/components/ObrigacaoForm";
import { TarefaForm } from "@/components/TarefaForm";
import { cn } from "@/lib/utils";

type ActionType = "projeto" | "obrigacao" | "tarefa" | null;

export function DashboardFAB() {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);

  const handleAction = (type: ActionType) => {
    setActionType(type);
    setDialogOpen(true);
    setExpanded(false);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setActionType(null);
  };

  const actions = [
    {
      type: "projeto" as const,
      label: "Novo Projeto",
      icon: FolderKanban,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      type: "obrigacao" as const,
      label: "Nova Obrigação",
      icon: ClipboardCheck,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      type: "tarefa" as const,
      label: "Nova Tarefa",
      icon: CheckSquare,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-2">
        {expanded && actions.map((action) => (
          <Button
            key={action.type}
            onClick={() => handleAction(action.type)}
            className={cn(
              "rounded-full h-12 px-4 shadow-lg text-white transition-all",
              action.color
            )}
          >
            <action.icon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}

        <Button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "rounded-full h-14 w-14 shadow-lg transition-transform",
            expanded && "rotate-45"
          )}
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {actionType === "projeto" && (
        <ProjetoForm 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess} 
        />
      )}
      {actionType === "obrigacao" && (
        <ObrigacaoForm 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess} 
        />
      )}
      {actionType === "tarefa" && (
        <TarefaForm 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess} 
        />
      )}
    </>
  );
}
