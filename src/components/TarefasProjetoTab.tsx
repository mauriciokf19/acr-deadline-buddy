import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TarefaForm } from "@/components/TarefaForm";
import { createLog } from "@/lib/logUtils";
import { formatDatePT } from "@/lib/dateUtils";

interface TarefasProjetoTabProps {
  projetoId: string;
}

export function TarefasProjetoTab({ projetoId }: TarefasProjetoTabProps) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<any>(null);

  useEffect(() => {
    loadTarefas();
  }, [projetoId]);

  const loadTarefas = async () => {
    setLoading(true);
    try {
      // Get all obrigacoes for this project first
      const { data: obrigacoes, error: obrigacoesError } = await supabase
        .from("obrigacoes")
        .select("id")
        .eq("projeto_id", projetoId)
        .is("deleted_at", null);

      if (obrigacoesError) throw obrigacoesError;

      if (!obrigacoes || obrigacoes.length === 0) {
        setTarefas([]);
        setLoading(false);
        return;
      }

      const obrigacaoIds = obrigacoes.map(o => o.id);

      // Get all tarefas for these obrigacoes
      const { data, error } = await supabase
        .from("tarefas")
        .select(`
          *,
          obrigacao:obrigacoes(titulo)
        `)
        .in("obrigacao_id", obrigacaoIds)
        .is("deleted_at", null)
        .order("deadline", { ascending: true, nullsFirst: false });

      if (error) throw error;

      setTarefas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  };

  const toggleTarefa = async (tarefaId: string, concluida: boolean) => {
    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ concluida: !concluida })
        .eq("id", tarefaId);

      if (error) throw error;

      await createLog({
        entidade_tipo: "tarefa",
        entidade_id: tarefaId,
        acao: "mudanca_estado",
        detalhes: `Tarefa marcada como ${!concluida ? "concluída" : "pendente"}`,
      });

      loadTarefas();
    } catch (error: any) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Carregando tarefas...
        </CardContent>
      </Card>
    );
  }

  if (tarefas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">Sem tarefas neste projeto</p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </CardContent>
        {showForm && (
          <TarefaForm
            open={showForm}
            onOpenChange={setShowForm}
            tarefa={editingTarefa}
            onSuccess={() => {
              setShowForm(false);
              setEditingTarefa(null);
              loadTarefas();
            }}
          />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tarefas ({tarefas.length})</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-2">
        {tarefas.map((tarefa) => (
          <Card key={tarefa.id}>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={tarefa.concluida}
                  onCheckedChange={() => toggleTarefa(tarefa.id, tarefa.concluida)}
                  aria-label={`Marcar tarefa ${tarefa.titulo} como ${tarefa.concluida ? "pendente" : "concluída"}`}
                />
                <div className="flex-1">
                  <p className={`font-medium ${tarefa.concluida ? "line-through text-muted-foreground" : ""}`}>
                    {tarefa.titulo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tarefa.obrigacao?.titulo}
                    {tarefa.deadline && ` • ${formatDatePT(tarefa.deadline)}`}
                  </p>
                </div>
                <Badge variant={tarefa.concluida ? "secondary" : "default"}>
                  {tarefa.concluida ? "Concluída" : "Pendente"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <TarefaForm
          open={showForm}
          onOpenChange={setShowForm}
          tarefa={editingTarefa}
          onSuccess={() => {
            setShowForm(false);
            setEditingTarefa(null);
            loadTarefas();
          }}
        />
      )}
    </div>
  );
}
