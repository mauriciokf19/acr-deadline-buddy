import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, X, CheckSquare, Calendar } from "lucide-react";
import { TarefaForm } from "@/components/TarefaForm";
import { useTarefasFilters } from "@/hooks/useTarefasFilters";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import { formatDatePT } from "@/lib/dateUtils";

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTarefas, setSelectedTarefas] = useState<string[]>([]);
  const { filters, updateFilter, clearFilters } = useTarefasFilters();

  useEffect(() => {
    loadTarefas();
  }, [filters]);

  const loadTarefas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tarefas")
        .select(`
          *,
          obrigacao:obrigacoes(titulo, projeto:projetos(nome))
        `)
        .order("deadline", { ascending: true, nullsFirst: false });

      if (filters.search) {
        query = query.ilike("titulo", `%${filters.search}%`);
      }
      if (filters.estado === "concluida") {
        query = query.eq("concluida", true);
      } else if (filters.estado === "nao_concluida") {
        query = query.eq("concluida", false);
      }
      // "todas" shows all tasks
      if (filters.responsavel_id) {
        query = query.eq("responsavel_id", filters.responsavel_id);
      }
      if (filters.obrigacao_id) {
        query = query.eq("obrigacao_id", filters.obrigacao_id);
      }

      const { data, error } = await query;
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

  const handleBulkMarkDone = async () => {
    if (selectedTarefas.length === 0) {
      toast.error("Selecione pelo menos uma tarefa");
      return;
    }

    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ concluida: true })
        .in("id", selectedTarefas);

      if (error) throw error;

      for (const id of selectedTarefas) {
        await createLog({
          entidade_tipo: "tarefa",
          entidade_id: id,
          acao: "mudanca_estado",
          detalhes: "Tarefa marcada como concluída (ação em massa)",
        });
      }

      toast.success(`${selectedTarefas.length} tarefa(s) marcada(s) como concluída(s)`);
      setSelectedTarefas([]);
      loadTarefas();
    } catch (error: any) {
      console.error("Erro ao atualizar tarefas:", error);
      toast.error("Erro ao atualizar tarefas");
    }
  };

  const hasActiveFilters = filters.search || 
                          (filters.estado && filters.estado !== "todas") || 
                          filters.responsavel_id || filters.obrigacao_id;

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              Gerir tarefas e checklist
            </p>
          </div>
          <Button 
            size="icon" 
            className="rounded-full"
            onClick={() => {
              setEditingTarefa(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tarefas..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filtros</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>

              <Select
                value={filters.estado}
                onValueChange={(value) => updateFilter("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="nao_concluida">Por fazer</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTarefas.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">
                {selectedTarefas.length} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTarefas([])}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleBulkMarkDone}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Marcar como Feitas
                </Button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            A carregar tarefas...
          </div>
        ) : tarefas.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma tarefa encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {tarefas.map((tarefa) => (
              <Card 
                key={tarefa.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setEditingTarefa(tarefa);
                  setShowForm(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTarefas.includes(tarefa.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTarefas([...selectedTarefas, tarefa.id]);
                        } else {
                          setSelectedTarefas(selectedTarefas.filter(id => id !== tarefa.id));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${tarefa.concluida ? "line-through text-muted-foreground" : ""}`}>
                          {tarefa.titulo}
                        </h3>
                        {tarefa.concluida && (
                          <Badge variant="secondary" className="text-xs">
                            Concluída
                          </Badge>
                        )}
                      </div>
                      {tarefa.obrigacao && (
                        <p className="text-sm text-muted-foreground">
                          {tarefa.obrigacao.titulo}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={tarefa.concluida}
                      onCheckedChange={() => toggleTarefa(tarefa.id, tarefa.concluida)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardHeader>
                {tarefa.deadline && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDatePT(tarefa.deadline)}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <TarefaForm
        open={showForm}
        onOpenChange={setShowForm}
        tarefa={editingTarefa}
        onSuccess={loadTarefas}
      />
    </Layout>
  );
}
