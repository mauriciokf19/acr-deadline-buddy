import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, X } from "lucide-react";
import { ObrigacaoCard } from "@/components/ObrigacaoCard";
import { ObrigacaoForm } from "@/components/ObrigacaoForm";
import { DeleteObrigacaoDialog } from "@/components/DeleteObrigacaoDialog";
import { useObrigacoesFilters } from "@/hooks/useObrigacoesFilters";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import { softDeleteObrigacao, restoreObrigacao } from "@/lib/obrigacoesService";
import { startOfDay, endOfDay, addDays } from "date-fns";

export default function Obrigacoes() {
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingObrigacao, setEditingObrigacao] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [obrigacaoToDelete, setObrigacaoToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileSettings, setProfileSettings] = useState<any>(null);
  const { filters, updateFilter, clearFilters } = useObrigacoesFilters();

  useEffect(() => {
    loadObrigacoes();
    loadProfileSettings();
  }, [filters]);

  const loadProfileSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("exigir_comprovativo_para_submetido")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfileSettings(data);
    } catch (error) {
      console.error("Erro ao carregar configurações do perfil:", error);
    }
  };

  const loadObrigacoes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("obrigacoes")
        .select(`
          *,
          projeto:projetos(nome, cor)
        `)
        .is("deleted_at", null)
        .order("deadline_oficial");

      if (filters.search) {
        query = query.ilike("titulo", `%${filters.search}%`);
      }
      if (filters.tipo) {
        query = (query as any).eq("tipo", filters.tipo);
      }
      if (filters.periodo) {
        query = query.ilike("periodo_referencia", `%${filters.periodo}%`);
      }
      if (filters.estado && filters.estado !== "todos") {
        query = (query as any).eq("estado", filters.estado);
      }
      if (filters.prioridade) {
        query = (query as any).eq("prioridade", filters.prioridade);
      }
      if (filters.projeto_id) {
        query = query.eq("projeto_id", filters.projeto_id);
      }

      // Filtros de prazo
      const now = new Date();
      if (filters.prazo === "atrasadas") {
        query = query.lt("deadline_oficial", now.toISOString())
                     .neq("estado", "concluido" as any);
      } else if (filters.prazo === "hoje") {
        query = query.gte("deadline_oficial", startOfDay(now).toISOString())
                     .lte("deadline_oficial", endOfDay(now).toISOString());
      } else if (filters.prazo === "semana") {
        query = query.gte("deadline_oficial", now.toISOString())
                     .lte("deadline_oficial", addDays(now, 7).toISOString());
      }
      // "todos" shows all obligations

      const { data, error } = await query;
      if (error) throw error;

      setObrigacoes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar obrigações:", error);
      toast.error("Erro ao carregar obrigações");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (obrigacao: any, action: string) => {
    try {
      let updates: any = {};
      let logDetails = "";

      switch (action) {
        case "enviar_senior":
          updates = { 
            estado: "em_revisao",
            enviado_senior_em: new Date().toISOString() 
          };
          logDetails = "Enviado ao Senior";
          break;
        case "aprovar":
          updates = { 
            estado: "aprovado",
            aprovado_em: new Date().toISOString() 
          };
          logDetails = "Aprovado pelo Senior";
          break;
        case "submeter":
          if (!obrigacao.submetido_em) {
            toast.error("Data de submissão é obrigatória");
            return;
          }
          
          // Check if comprovativo is required and missing
          if (profileSettings?.exigir_comprovativo_para_submetido) {
            const hasComprovativo = obrigacao.comprovativo_storage_path || obrigacao.comprovativo_url;
            if (!hasComprovativo) {
              toast.error("Para marcar como Submetido, tens de anexar o comprovativo e preencher a data de submissão.");
              
              // Log the blocked attempt
              await createLog({
                entidade_tipo: "obrigacao",
                entidade_id: obrigacao.id,
                acao: "submissao_bloqueada",
                detalhes: JSON.stringify({
                  motivo: "Comprovativo em falta",
                  regra: "exigir_comprovativo_para_submetido ativo"
                })
              });
              
              return;
            }
          }
          
          updates = { estado: "submetido" };
          logDetails = "Submetido";
          break;
        case "concluir":
          updates = { 
            estado: "concluido",
            concluido_em: new Date().toISOString() 
          };
          logDetails = "Concluído";
          break;
      }

      const { error } = await supabase
        .from("obrigacoes")
        .update(updates)
        .eq("id", obrigacao.id);

      if (error) throw error;

      await createLog({
        entidade_tipo: "obrigacao",
        entidade_id: obrigacao.id,
        acao: "mudanca_estado",
        detalhes: logDetails,
      });

      toast.success(logDetails);
      loadObrigacoes();
    } catch (error: any) {
      console.error("Erro ao atualizar obrigação:", error);
      toast.error("Erro ao atualizar obrigação");
    }
  };

  const handleEdit = (obrigacao: any) => {
    setEditingObrigacao(obrigacao);
    setShowForm(true);
  };

  const handleDelete = (obrigacao: any) => {
    setObrigacaoToDelete(obrigacao);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!obrigacaoToDelete) return;

    setDeleteLoading(true);
    const result = await softDeleteObrigacao({ obrigacaoId: obrigacaoToDelete.id });
    setDeleteLoading(false);

    if (result.success) {
      // Mostrar snackbar com opção de desfazer
      const toastId = toast.success(
        `Obrigação arquivada. ${result.affectedTarefas} tarefas e ${result.affectedLembretes} lembretes também foram arquivados.`,
        {
          duration: 10000,
          action: {
            label: "Desfazer",
            onClick: () => handleRestore(obrigacaoToDelete.id, toastId),
          },
        }
      );

      setDeleteDialogOpen(false);
      setObrigacaoToDelete(null);
      loadObrigacoes();
    } else {
      toast.error(`Erro ao apagar: ${result.error}`);
    }
  };

  const handleRestore = async (obrigacaoId: string, toastId: string | number) => {
    toast.dismiss(toastId);
    
    const result = await restoreObrigacao({ obrigacaoId });
    
    if (result.success) {
      toast.success(
        `Obrigação restaurada. ${result.affectedTarefas} tarefas e ${result.affectedLembretes} lembretes também foram restaurados.`
      );
      loadObrigacoes();
    } else {
      toast.error(`Erro ao restaurar: ${result.error}`);
    }
  };

  const hasActiveFilters = filters.search || filters.tipo || filters.periodo || 
                          (filters.estado && filters.estado !== "todos") || 
                          filters.prioridade || filters.projeto_id || 
                          (filters.prazo && filters.prazo !== "todos");

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Obrigações</h1>
            <p className="text-sm text-muted-foreground">
              Gerir obrigações fiscais
            </p>
          </div>
          <Button 
            size="icon" 
            className="rounded-full"
            onClick={() => {
              setEditingObrigacao(null);
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
                placeholder="Pesquisar obrigações..."
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
                value={filters.prazo}
                onValueChange={(value) => updateFilter("prazo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vencimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="atrasadas">Atrasadas</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.estado}
                onValueChange={(value) => updateFilter("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="submetido">Submetido</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            A carregar obrigações...
          </div>
        ) : obrigacoes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma obrigação encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {obrigacoes.map((obrigacao) => (
              <ObrigacaoCard
                key={obrigacao.id}
                obrigacao={obrigacao}
                onQuickAction={(action) => handleQuickAction(obrigacao, action)}
                onEdit={() => handleEdit(obrigacao)}
                onDelete={() => handleDelete(obrigacao)}
              />
            ))}
          </div>
        )}
      </div>

      <ObrigacaoForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingObrigacao(null);
        }}
        obrigacao={editingObrigacao}
        onSuccess={loadObrigacoes}
      />

      <DeleteObrigacaoDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setObrigacaoToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </Layout>
  );
}
